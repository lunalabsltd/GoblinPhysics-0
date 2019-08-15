/**
 * Half-edge based mesh representations - https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/
 * This implementation are heavily influenced by QuickHullConvexHullLib.cpp in PhysX v3.4 engine. The following things, however, are missing:
 * 1) Initial points cleanup procedure (ConvexHullLib::cleanupVertices in PhysX)
 * 2) _mergeWithAdjacent do not detect nor discard redundant triangles (unlike QuickHullFace::mergeAdjacentFace)
 * 3) No aggressive post-merging for faces (QuickHull::doPostAdjacentMerge)
 * @param {Array<Goblin.Vector3>} verticesCloud
 * @param {Goblin.PhysicMaterial} material
 * @constructor
 */
Goblin.ConvexHullShape = function( verticesCloud, material ) {
    this.shapeType = Goblin.Shapes.Type.ConvexHullShape;
    /**
     * @type {Array<Goblin.ConvexHullShape.Vertex>}
     */
    this.vertices = [];
    /**
     * @type {Goblin.ConvexHullShape.HalfEdge[]}
     */
    this.edges = [];
    /**
     * @type {Array<Goblin.ConvexHullShape.Face>}
     */
    this.faces = [];
    /**
     * @type {Goblin.PhysicMaterial}
     */
    this.material = material;
    /**
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();
    /**
     * NOTE: this field should preserve size and order of `this.faces`, because collision algorithm relies on it.
     * @type {Array<Goblin.Vector3>}
     */
    this.faceNormals = [];
    /**
     * NOTE: this field should preserve size and order of `this.edges`, because collision algorithm relies on it.
     * @type {Goblin.Vector3[]}
     */
    this.edgeDirections = [];
    /**
     * the convex hull's volume
     * @type {number}
     */
    this.volume = 0;
    /**
     * coordinates of the hull's COM
     * @type {Goblin.Vector3}
     */
    this.center_of_mass = new Goblin.Vector3();
    /**
     * used in computing the convex hull's center of mass & volume
     * @type {Float32Array}
     * @private
     */
    this._integral = new Float32Array( 10 );

    this._buildInitialSimplex( verticesCloud );
    this._processUnclaimedPoints();
    this._calculateVerticesEdgesAndNormals();
    this._cleanup();
    this.calculateLocalAABB( this.aabb );
    this.computeVolume();
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `supportPoint`
 *
 * @param direction {Goblin.Vector3} direction to use in finding the support point
 * @param supportPoint {Goblin.Vector3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.ConvexHullShape.prototype.findSupportPoint = function( direction, supportPoint ) {
    var bestVertex = null;
    var bestDot = -Infinity;

    for ( var i = 0; i < this.vertices.length; i++ ) {
        var dot = this.vertices[ i ].position.dot( direction );
        if ( dot > bestDot ) {
            bestDot = dot;
            bestVertex = this.vertices[ i ];
        }
    }

    supportPoint.copy( bestVertex.position );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {Goblin.AABB}
 */
Goblin.ConvexHullShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = aabb.min.y = aabb.min.z = Infinity;
    aabb.max.x = aabb.max.y = aabb.max.z = -Infinity;

    for ( var i = 0; i < this.vertices.length; i++ ) {
        aabb.min.x = Math.min( aabb.min.x, this.vertices[ i ].position.x );
        aabb.min.y = Math.min( aabb.min.y, this.vertices[ i ].position.y );
        aabb.min.z = Math.min( aabb.min.z, this.vertices[ i ].position.z );

        aabb.max.x = Math.max( aabb.max.x, this.vertices[ i ].position.x );
        aabb.max.y = Math.max( aabb.max.y, this.vertices[ i ].position.y );
        aabb.max.z = Math.max( aabb.max.z, this.vertices[ i ].position.z );
    }
};

/**
 * Checks if a ray segment intersects with the shape. See http://geomalgorithms.com/a13-_intersect-4.html for the details.
 * @property {Goblin.Vector3} start - start point of the segment
 * @property {Goblin.Vector3} end - end point of the segment
 * @return {Goblin.RayIntersection|null} if the segment intersects, a RayIntersection is returned, else null
 */
Goblin.ConvexHullShape.prototype.rayIntersect = ( function() {
    var rayDirection = new Goblin.Vector3();
    var latestEntry = 0;
    var earliestExit = 1;
    var enteringFace = null;
    var originInsideAllPlanes = true;
    var face = null;
    var distanceToPlane = 0;
    var dn = 0;
    var distanceAlongRay = 0;

    return function( start, end ) {
        rayDirection.subtractVectors( end, start );
        latestEntry = 0;
        earliestExit = 1;
        enteringFace = null;
        originInsideAllPlanes = true;

        for ( var i = 0; i < this.faces.length; i++ ) {
            face = this.faces[ i ];
            distanceToPlane = face._getDistanceFromPlaneToPoint( start );
            dn = face.normal.dot( rayDirection );
            distanceAlongRay = -distanceToPlane / dn;

            if ( distanceToPlane > 0 ) {
                originInsideAllPlanes = false; // Origin is not behind plane == ray starts outside the convex.
            }

            if ( dn > Goblin.EPSILON ) { // the ray direction "exits" from the back side
                earliestExit = Math.min( earliestExit, distanceAlongRay );
            } else if ( dn < -Goblin.EPSILON ) { // the ray direction "enters" from the front side
                if ( distanceAlongRay > latestEntry ) {
                    latestEntry = distanceAlongRay;
                    enteringFace = face;
                }
            } else {
                // plane normal and ray dir are orthogonal
                if ( distanceToPlane > Goblin.EPSILON ) {
                    return null; // a plane is parallel with ray and we're outside the ray => we definitely miss the entire convex
                }
            }
        }

        if ( originInsideAllPlanes ) {
            return null;
        }

        var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
        intersection.object = this;
        intersection.t = latestEntry;
        intersection.point.scaleVector( rayDirection, latestEntry );
        intersection.point.add( start );
        intersection.normal.copy( enteringFace.normal );
        return intersection;
    };
} )();

/**
 * This is almost a copy of Goblin.ConvexShape.prototype.computeVolume except that it triangulates faces on the fly and uses some specific shape APIs.
 */
Goblin.ConvexHullShape.prototype.computeVolume = ( function() {
    var origin = new Goblin.Vector3();
    var output = new Float32Array( 6 );
    var macro = function( a, b, c ) {
        var temp0 = a + b;
        var temp1 = a * a;
        var temp2 = temp1 + b * temp0;

        output[ 0 ] = temp0 + c;
        output[ 1 ] = temp2 + c * output[ 0 ];
        output[ 2 ] = a * temp1 + b * temp2 + c * output[ 1 ];
        output[ 3 ] = output[ 1 ] + a * ( output[ 0 ] + a );
        output[ 4 ] = output[ 1 ] + b * ( output[ 0 ] + b );
        output[ 5 ] = output[ 1 ] + c * ( output[ 0 ] + c );
    };

    return function() {
        for ( var i = 0; i < this.faces.length; i++ ) {
            var face = this.faces[ i ];
            var initialEdge = face.edge;
            var currentTriangulationEdge = initialEdge.next;

            do {
                var v0 = initialEdge.getHead().position;
                var v1 = currentTriangulationEdge.getHead().position;
                var v2 = currentTriangulationEdge.getTail().position;

                var a1 = v1.x - v0.x;
                var b1 = v1.y - v0.y;
                var c1 = v1.z - v0.z;
                var a2 = v2.x - v0.x;
                var b2 = v2.y - v0.y;
                var c2 = v2.z - v0.z;
                var d0 = b1 * c2 - b2 * c1;
                var d1 = a2 * c1 - a1 * c2;
                var d2 = a1 * b2 - a2 * b1;

                macro( v0.x, v1.x, v2.x );
                var f1x = output[ 0 ];
                var f2x = output[ 1 ];
                var f3x = output[ 2 ];
                var g0x = output[ 3 ];
                var g1x = output[ 4 ];
                var g2x = output[ 5 ];

                macro( v0.y, v1.y, v2.y );
                var f2y = output[ 1 ];
                var f3y = output[ 2 ];
                var g0y = output[ 3 ];
                var g1y = output[ 4 ];
                var g2y = output[ 5 ];

                macro( v0.z, v1.z, v2.z );
                var f2z = output[ 1 ];
                var f3z = output[ 2 ];
                var g0z = output[ 3 ];
                var g1z = output[ 4 ];
                var g2z = output[ 5 ];

                var contributor = face._getDistanceFromPlaneToPoint( origin ) > 0 ? -1 : 1;

                this._integral[ 0 ] += contributor * d0 * f1x;
                this._integral[ 1 ] += contributor * d0 * f2x;
                this._integral[ 2 ] += contributor * d1 * f2y;
                this._integral[ 3 ] += contributor * d2 * f2z;
                this._integral[ 4 ] += contributor * d0 * f3x;
                this._integral[ 5 ] += contributor * d1 * f3y;
                this._integral[ 6 ] += contributor * d2 * f3z;
                this._integral[ 7 ] += contributor * d0 * ( v0.y * g0x + v1.y * g1x + v2.y * g2x );
                this._integral[ 8 ] += contributor * d1 * ( v0.z * g0y + v1.z * g1y + v2.z * g2y );
                this._integral[ 9 ] += contributor * d2 * ( v0.x * g0z + v1.x * g1z + v2.x * g2z );

                currentTriangulationEdge = currentTriangulationEdge.next;
            } while ( currentTriangulationEdge.next !== initialEdge );
        }

        this._integral[ 0 ] *= 1 / 6;
        this._integral[ 1 ] *= 1 / 24;
        this._integral[ 2 ] *= 1 / 24;
        this._integral[ 3 ] *= 1 / 24;
        this._integral[ 4 ] *= 1 / 60;
        this._integral[ 5 ] *= 1 / 60;
        this._integral[ 6 ] *= 1 / 60;
        this._integral[ 7 ] *= 1 / 120;
        this._integral[ 8 ] *= 1 / 120;
        this._integral[ 9 ] *= 1 / 120;

        this.volume = this._integral[ 0 ];

        this.center_of_mass.x = this._integral[ 1 ] / this.volume;
        this.center_of_mass.y = this._integral[ 2 ] / this.volume;
        this.center_of_mass.z = this._integral[ 3 ] / this.volume;
    };
} )();

/**
 * @param {number} mass
 * @returns {Goblin.Matrix3}
 */
Goblin.ConvexHullShape.prototype.getInertiaTensor = function( mass ) {
    return Goblin.ConvexShape.prototype.getInertiaTensor.call( this, mass );
};

/**
 * Builds initial simplex (4 vertices / 4 faces) and allocates all unused points into tmpAllOutsideVertices field of corresponding face.
 * See CREATE_SIMPLEX in http://algolist.manual.ru/maths/geom/convhull/qhull3d.php
 * @param {Array<Goblin.Vector3>} vertices
 * @private
 */
Goblin.ConvexHullShape.prototype._buildInitialSimplex = ( function() {
    var principleDirections = [
        x_axis,
        y_axis,
        z_axis,
    ];

    var planeNormal = new Goblin.Vector3();
    var point = null;

    return function _buildInitialSimplex( vertices ) {
        var candidates = vertices.slice( 0 );

        var minPointAlongDirection = null;
        var maxPointAlongDirection = null;

        for ( var i = 0; i < principleDirections.length; i++ ) {
            var minDirectionDistance = Infinity;
            var maxDirectionDistance = -Infinity;

            for ( var j = 0; j < candidates.length; j++ ) {
                var candidateDirectionDistance = candidates[ j ].dot( principleDirections[ i ] );

                if ( candidateDirectionDistance < minDirectionDistance ) {
                    minPointAlongDirection = candidates[ j ];
                    minDirectionDistance = candidateDirectionDistance;
                } else if ( candidateDirectionDistance > maxDirectionDistance ) {
                    maxPointAlongDirection = candidates[ j ];
                    maxDirectionDistance = candidateDirectionDistance;
                }
            }

            if ( minPointAlongDirection !== null && maxPointAlongDirection !== null && maxDirectionDistance > minDirectionDistance ) {
                break;
            } else {
                minPointAlongDirection = null;
                maxPointAlongDirection = null;
            }
        }

        // minPointAlongDirection and maxPointAlongDirection are our initial 1-simplex
        if ( minPointAlongDirection === null || maxPointAlongDirection === null ) {
            throw new Error( 'Degenerate point cloud, either 1D or 2D' );
        }

        var pointFurthestFromLine = null;
        var maxLineDistance = -Infinity;

        for ( i = 0; i < candidates.length; i++ ) {
            point = candidates[ i ];
            if ( point === minPointAlongDirection || point === maxPointAlongDirection ) {
                continue;
            }

            var distanceToLine = Goblin.GeometryMethods.findSquaredDistanceFromSegment( point, minPointAlongDirection, maxPointAlongDirection );
            if ( distanceToLine > maxLineDistance ) {
                maxLineDistance = distanceToLine;
                pointFurthestFromLine = point;
            }
        }

        // minPointAlongDirection, maxPointAlongDirection and pointFurthestFromLine are the 2-simplex
        if ( pointFurthestFromLine === null || Math.abs( maxLineDistance ) < Goblin.EPSILON ) {
            throw new Error( 'Degenerate point cloud in 2D' );
        }

        _tmp_vec3_1.subtractVectors( minPointAlongDirection, maxPointAlongDirection );
        _tmp_vec3_2.subtractVectors( pointFurthestFromLine, maxPointAlongDirection );
        planeNormal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
        planeNormal.normalize();

        var simplexDistance = maxPointAlongDirection.dot( planeNormal );

        var pointFurthestFromPlane = null;
        var maxSimplexDistance = -Infinity;

        for ( i = 0; i < candidates.length; i++ ) {
            point = candidates[ i ];
            if ( point === minPointAlongDirection || point === maxPointAlongDirection || point === pointFurthestFromLine ) {
                continue;
            }

            var distanceToSimplex = Math.abs( planeNormal.dot( point ) - simplexDistance );
            if ( distanceToSimplex > maxSimplexDistance ) {
                maxSimplexDistance = distanceToSimplex;
                pointFurthestFromPlane = point;
            }
        }

        // minPointAlongDirection, maxPointAlongDirection, pointFurthestFromLine and pointFurthestFromPlane are the target 3-simplex
        if ( pointFurthestFromPlane === null || Math.abs( maxSimplexDistance ) < Goblin.EPSILON ) {
            throw new Error( 'Degenerate point cloud in 2D' );
        }

        var a = new Goblin.ConvexHullShape.Vertex( minPointAlongDirection );
        var b = new Goblin.ConvexHullShape.Vertex( maxPointAlongDirection );
        var c = new Goblin.ConvexHullShape.Vertex( pointFurthestFromLine );
        var d = new Goblin.ConvexHullShape.Vertex( pointFurthestFromPlane );
        var doTriangleFlip = pointFurthestFromPlane.dot( planeNormal ) - simplexDistance < 0;

        var faces = [];
        var k = 0;
        if ( doTriangleFlip ) {
            faces[ 0 ] = this._createTriangle( a, b, c );
            faces[ 1 ] = this._createTriangle( d, b, a );
            faces[ 2 ] = this._createTriangle( d, c, b );
            faces[ 3 ] = this._createTriangle( d, a, c );

            for ( i = 0; i < 3; i++ ) {
                k = ( i + 1 ) % 3;
                faces[ i + 1 ].getEdge( 1 ).setTwin( faces[ k + 1 ].getEdge( 0 ) );
                faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( k ) );
            }
        } else {
            faces[ 0 ] = this._createTriangle( a, c, b );
            faces[ 1 ] = this._createTriangle( d, a, b );
            faces[ 2 ] = this._createTriangle( d, b, c );
            faces[ 3 ] = this._createTriangle( d, c, a );

            for ( i = 0; i < 3; i++ ) {
                k = ( i + 1 ) % 3;
                faces[ i + 1 ].getEdge( 0 ).setTwin( faces[ k + 1 ].getEdge( 1 ) );
                faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( ( 3 - i ) % 3 ) );
            }
        }

        this.faces.push( faces[ 0 ], faces[ 1 ], faces[ 2 ], faces[ 3 ] );

        for ( i = 0; i < candidates.length; i++ ) {
            point = candidates[ i ];
            if ( point === minPointAlongDirection || point === maxPointAlongDirection || point === pointFurthestFromLine || point === pointFurthestFromPlane ) {
                continue;
            }

            this._assignUnusedVertex( new Goblin.ConvexHullShape.Vertex( point ), this.faces );
        }
    };
} )();

/**
 * Main loop in which we expand simplex one point at a time.
 * @private
 */
Goblin.ConvexHullShape.prototype._processUnclaimedPoints = function() {
    var nextFace = this._getNextFaceForExtension();
    while ( nextFace !== null ) {
        var nextVertex = nextFace.tmpClosestOutsideVertex;
        this._addVertex( nextVertex, nextFace );
        nextFace = this._getNextFaceForExtension();
    }
};

/**
 * Expand the simplex using given vertex.
 * @param {Goblin.ConvexHullShape.Vertex} vertex
 * @param {Goblin.ConvexHullShape.Face} face
 * @private
 */
Goblin.ConvexHullShape.prototype._addVertex = function( vertex, face ) {
    var faceOutsideVertices = face.tmpAllOutsideVertices;
    faceOutsideVertices[ faceOutsideVertices.indexOf( vertex ) ] = faceOutsideVertices[ faceOutsideVertices.length - 1 ];
    faceOutsideVertices.pop();


    var horizon = [];
    this._calculateHorizon( vertex.position, null, face, horizon );

    var newFaces = this._addNewFacesFromHorizon( vertex, horizon );
    for ( var i = 0; i < newFaces.length; i++ ) {
        var newFace = newFaces[ i ];
        var lastMergeWasSuccessful = false;
        do {
            lastMergeWasSuccessful = this._mergeWithAdjacent( newFace );
        } while ( lastMergeWasSuccessful );
        this.faces.push( newFace );
    }

    var unclaimedVertices = [];
    for ( i = 0; i < this.faces.length; i++ ) {
        var faceToCheck = this.faces[ i ];
        if ( faceToCheck.tmpStatus === Goblin.ConvexHullShape.Face.Status.Visible ) {
            continue;
        }

        this.faces[ i ] = this.faces[ this.faces.length - 1 ];
        this.faces.pop();
        i--;

        for ( var j = 0; j < faceToCheck.tmpAllOutsideVertices.length; j++ ) {
            unclaimedVertices.push( faceToCheck.tmpAllOutsideVertices[ j ] );
        }
    }

    for ( i = 0; i < unclaimedVertices.length; i++ ) {
        this._assignUnusedVertex( unclaimedVertices[ i ], newFaces );
    }
};

/**
 * Tries to merge given face with its neighbours by checking normals of all faces with a common edge.
 * @param {Goblin.ConvexHullShape.Face} face
 * @returns {boolean}
 * @private
 */
Goblin.ConvexHullShape.prototype._mergeWithAdjacent = function( face ) {
    var currentEdge = face.edge;
    do {
        var canBeMerged = currentEdge.getOppositeFacePlaneDistance() > -Goblin.EPSILON && currentEdge.twin.getOppositeFacePlaneDistance() > -Goblin.EPSILON;
        if ( canBeMerged ) {
            this._mergeOnEdge( face, currentEdge );
            return true;
        }

        currentEdge = currentEdge.next;
    } while ( currentEdge !== face.edge );

    return false;
};

/**
 * Combines two faces by erasing half-edges between them and updating all references.
 * @param {Goblin.ConvexHullShape.Face} face
 * @param {Goblin.ConvexHullShape.HalfEdge} edge
 * @private
 */
Goblin.ConvexHullShape.prototype._mergeOnEdge = function( face, edge ) {
    var oppositeFace = edge.getOppositeFace();
    oppositeFace.tmpStatus = Goblin.ConvexHullShape.Face.Status.Deleted;
    var oppositeEdge = edge.twin;

    var previousEdge = edge.previous;
    var nextEdge = edge.next;
    var previousOppositeEdge = oppositeEdge.previous;
    var nextOppositeEdge = oppositeEdge.next;

    var breakingEdge = previousEdge;
    while ( previousEdge.getOppositeFace() === oppositeFace ) {
        previousEdge = previousEdge.previous;
        nextOppositeEdge = nextOppositeEdge.next;

        if ( previousEdge === breakingEdge ) {
            throw new Error( 'Degenerated face' );
        }
    }

    breakingEdge = nextEdge;
    while ( nextEdge.getOppositeFace() === oppositeFace ) {
        previousOppositeEdge = previousOppositeEdge.previous;
        nextEdge = nextEdge.next;

        if ( nextEdge === breakingEdge ) {
            throw new Error( 'Degenerated face' );
        }
    }

    // set new face owner for the line up edges
    var currentEdge;
    for ( currentEdge = nextOppositeEdge; currentEdge !== previousOppositeEdge.next; currentEdge = currentEdge.next ) {
        currentEdge.face = face;
    }

    // if we are about to delete the shared edge, check if its not the starting edge of the face
    if ( face.edge === edge ) {
        face.edge = nextEdge;
    }

    previousOppositeEdge.next = nextEdge;
    nextEdge.prev = previousOppositeEdge;

    previousEdge.next = nextOppositeEdge;
    nextOppositeEdge.prev = previousEdge;

    face.computeNormalAndCentroid();
};

/**
 * Returns a face with the furthest point in tmpClosestOutsideVertex so we can expand our simplex using that point.
 * @returns {Goblin.ConvexHullShape.Face|null}
 * @private
 */
Goblin.ConvexHullShape.prototype._getNextFaceForExtension = function() {
    var nextFace = null;
    var maxDistance = -Infinity;

    for ( var i = 0; i < this.faces.length; i++ ) {
        var face = this.faces[ i ];
        var closestOutsideVertex = face.tmpClosestOutsideVertex;

        if ( closestOutsideVertex !== null && closestOutsideVertex.tmpDistanceToFace > maxDistance ) {
            maxDistance = closestOutsideVertex.tmpDistanceToFace;
            nextFace = face;
        }
    }

    return nextFace;
};

/**
 * Calculate the horizon from the eyePoint against a given face.
 * See CALCULATE_HORIZON in http://algolist.manual.ru/maths/geom/convhull/qhull3d.php
 * @param {Goblin.Vector3} eyePoint
 * @param {Goblin.ConvexHullShape.HalfEdge|null} crossedEdge
 * @param {Goblin.ConvexHullShape.Face} face
 * @param {Array<Goblin.ConvexHullShape.HalfEdge>} horizon
 * @private
 */
Goblin.ConvexHullShape.prototype._calculateHorizon = function( eyePoint, crossedEdge, face, horizon ) {
    face.tmpStatus = Goblin.ConvexHullShape.Face.Status.Deleted;

    var edge = null;
    if ( crossedEdge === null ) {
        crossedEdge = face.edge;
        edge = crossedEdge;
    } else {
        edge = crossedEdge.next;
    }

    do {
        var oppositeFace = edge.getOppositeFace();
        if ( oppositeFace.tmpStatus !== Goblin.ConvexHullShape.Face.Status.Visible ) {
            continue;
        }

        var distance = oppositeFace._getDistanceFromPlaneToPoint( eyePoint );
        if ( distance > Goblin.EPSILON ) {
            this._calculateHorizon( eyePoint, edge.twin, oppositeFace, horizon );
        } else {
            horizon.push( edge );
        }
        edge = edge.next;
    } while ( crossedEdge !== edge );
};

/**
 * Creates all necessary faces to connect eyeVertex with all edges laying on the horizon.
 * @param {Goblin.ConvexHullShape.Vertex} eyeVertex
 * @param {Array<Goblin.ConvexHullShape.HalfEdge>} horizon
 * @returns {Array<Goblin.ConvexHullShape.Face>}
 * @private
 */
Goblin.ConvexHullShape.prototype._addNewFacesFromHorizon = function( eyeVertex, horizon ) {
    var newFaces = [];
    var hedgeSidePrevious = null;
    var hedgeSideBegin = null;

    for ( var i = 0; i < horizon.length; i++ ) {
        var edge = horizon[ i ];
        var newFace = this._createTriangle(
            eyeVertex,
            edge.getHead(),
            edge.getTail()
        );
        newFaces.push( newFace );
        newFace.getEdge( 2 ).setTwin( edge.twin );

        var hedgeSide = newFace.edge;
        if ( hedgeSidePrevious !== null ) {
            hedgeSide.next.setTwin( hedgeSidePrevious );
        } else {
            hedgeSideBegin = hedgeSide;
        }

        hedgeSidePrevious = hedgeSide;
    }

    hedgeSideBegin.next.setTwin( hedgeSidePrevious );

    return newFaces;
};

/**
 * Creates a triangle from a given points and populates almost every connection between edges and faces (except for twins).
 * @param {Goblin.ConvexHullShape.Vertex} a
 * @param {Goblin.ConvexHullShape.Vertex} b
 * @param {Goblin.ConvexHullShape.Vertex} c
 * @returns {Goblin.ConvexHullShape.Face}
 * @private
 */
Goblin.ConvexHullShape.prototype._createTriangle = function( a, b, c ) {
    var face = new Goblin.ConvexHullShape.Face();
    var edgeAb = new Goblin.ConvexHullShape.HalfEdge();
    edgeAb.tail = a;
    edgeAb.face = face;
    var edgeBc = new Goblin.ConvexHullShape.HalfEdge();
    edgeBc.tail = b;
    edgeBc.face = face;
    var edgeCa = new Goblin.ConvexHullShape.HalfEdge();
    edgeCa.tail = c;
    edgeCa.face = face;

    edgeAb.previous = edgeCa;
    edgeAb.next = edgeBc;
    edgeBc.previous = edgeAb;
    edgeBc.next = edgeCa;
    edgeCa.previous = edgeBc;
    edgeCa.next = edgeAb;

    face.edge = edgeAb;

    face.computeNormalAndCentroid();

    return face;
};

/**
 * Assigns given vertex to one of the faces (point should lie in front of the face). Point may be assigned to 1 or 0 faces.
 * See ADD_TO_OUTSIDE_SET in http://algolist.manual.ru/maths/geom/convhull/qhull3d.php
 * @param {Goblin.ConvexHullShape.Vertex} vertex
 * @param {Array<Goblin.ConvexHullShape.Face>} facesToConsider
 * @private
 */
Goblin.ConvexHullShape.prototype._assignUnusedVertex = function( vertex, facesToConsider ) {
    for ( var j = 0; j < facesToConsider.length; j++ ) {
        var face = facesToConsider[ j ];
        var distance = face._getDistanceFromPlaneToPoint( vertex.position );
        if ( distance <= Goblin.EPSILON ) {
            continue;
        }

        vertex.tmpDistanceToFace = distance;
        face.tmpAllOutsideVertices.push( vertex );
        if ( face.tmpClosestOutsideVertex === null || face.tmpClosestOutsideVertex.tmpDistanceToFace < distance ) {
            face.tmpClosestOutsideVertex = vertex;
        }
        break;
    }
};

/**
 * Populates this.vertices, this.edges. this.faceNormals and this.edgeDirections
 * @private
 */
Goblin.ConvexHullShape.prototype._calculateVerticesEdgesAndNormals = function() {
    this.vertices.length = 0;
    this.edges.length = 0;

    for ( var i = 0; i < this.faces.length; i++ ) {
        var face = this.faces[ i ];
        var currentEdge = face.edge;
        this.faceNormals.push( face.normal );

        do {
            if ( this.edges.indexOf( currentEdge ) === -1 ) {
                this.edges.push( currentEdge );
                var edgeDirection = new Goblin.Vector3();
                edgeDirection.subtractVectors( currentEdge.getTail().position, currentEdge.getHead().position );
                edgeDirection.normalize();
                this.edgeDirections.push( edgeDirection );
            }

            var vertex = currentEdge.getTail();
            if ( this.vertices.indexOf( vertex ) === -1 ) {
                this.vertices.push( vertex );
            }
            currentEdge = currentEdge.next;
        } while ( currentEdge !== face.edge );
    }
};

/**
 * Cleans all temporary fields in vertices and faces.
 * @private
 */
Goblin.ConvexHullShape.prototype._cleanup = function() {
    for ( var i = 0; i < this.vertices.length; i++ ) {
        this.vertices[ i ].tmpDistanceToFace = 0;
    }

    for ( i = 0; i < this.faces.length; i++ ) {
        var face = this.faces[ i ];
        face.tmpClosestOutsideVertex = null;
        face.tmpAllOutsideVertices = [];
    }
};

/**
 * Represents a vertex. See https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/ for details.
 * @param {Goblin.Vector3} position
 * @constructor
 */
Goblin.ConvexHullShape.Vertex = function( position ) {
    /**
     * @type {Goblin.Vector3}
     */
    this.position = position;
    /**
     * @type {number}
     */
    this.tmpDistanceToFace = 0;
};

/**
 * Represents a half-edge. See https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/ for details.
 * @constructor
 */
Goblin.ConvexHullShape.HalfEdge = function() {
    /**
     *
     * @type {Goblin.ConvexHullShape.HalfEdge}
     */
    this.next = null;
    /**
     *
     * @type {Goblin.ConvexHullShape.HalfEdge}
     */
    this.previous = null;
    /**
     *
     * @type {Goblin.ConvexHullShape.HalfEdge}
     */
    this.twin = null;
    /**
     *
     * @type {Goblin.ConvexHullShape.Vertex}
     */
    this.tail = null;
    /**
     *
     * @type {Goblin.ConvexHullShape.Face}
     */
    this.face = null;
};

/**
 * Returns a face associated with its twin.
 * @returns {Goblin.ConvexHullShape.Face}
 */
Goblin.ConvexHullShape.HalfEdge.prototype.getOppositeFace = function() {
    return this.twin.face;
};

/**
 * Returns the start vertex of the current half-edge.
 * @returns {Goblin.ConvexHullShape.Vertex}
 */
Goblin.ConvexHullShape.HalfEdge.prototype.getHead = function() {
    return this.twin.tail;
};

/**
 * Returns the end vertex of the current half-edge.
 * @returns {Goblin.ConvexHullShape.Vertex}
 */
Goblin.ConvexHullShape.HalfEdge.prototype.getTail = function() {
    return this.tail;
};

/**
 * @param {Goblin.ConvexHullShape.HalfEdge} twin
 */
Goblin.ConvexHullShape.HalfEdge.prototype.setTwin = function( twin ) {
    this.twin = twin;
    twin.twin = this;
};

/**
 * @returns {number}
 */
Goblin.ConvexHullShape.HalfEdge.prototype.getOppositeFacePlaneDistance = function() {
    return this.face._getDistanceFromPlaneToPoint( this.twin.face.centroid );
};

/**
 * Represents a face. See https://fgiesen.wordpress.com/2012/02/21/half-edge-based-mesh-representations-theory/ for details.
 * @constructor
 */
Goblin.ConvexHullShape.Face = function() {
    /**
     * @type {Goblin.ConvexHullShape.HalfEdge}
     */
    this.edge = null;
    /**
     * @type {Goblin.Vector3}
     */
    this.normal = new Goblin.Vector3();
    /**
     * @type {Goblin.Vector3}
     */
    this.centroid = new Goblin.Vector3();
    /**
     * @type {number}
     */
    this.planeOffset = 0;
    /**
     * @type {Array<Goblin.ConvexHullShape.Vertex>}
     */
    this.tmpAllOutsideVertices = [];
    /**
     * @type {Goblin.ConvexHullShape.Vertex}
     */
    this.tmpClosestOutsideVertex = null;

    /**
     * @type {number}
     */
    this.tmpStatus = Goblin.ConvexHullShape.Face.Status.Visible;
};

/**
 * @param {Goblin.Vector3} p
 * @returns {number}
 */
Goblin.ConvexHullShape.Face.prototype._getDistanceFromPlaneToPoint = function( p ) {
    return this.normal.dot( p ) - this.planeOffset;
};

Goblin.ConvexHullShape.Face.prototype.computeNormalAndCentroid = function() {
    var firstEdge = this.edge;
    this.centroid.copy( firstEdge.getTail().position );
    var secondEdge = null;
    var thirdEdge = null;
    var currentEdge = firstEdge.next;
    var edgesCount = 1;

    while ( firstEdge !== currentEdge ) {
        if ( secondEdge === null ) {
            secondEdge = currentEdge;
        } else if ( thirdEdge === null ) {
            thirdEdge = currentEdge;
        }

        this.centroid.add( currentEdge.getTail().position );
        edgesCount++;
        currentEdge = currentEdge.next;
    }
    this.centroid.scale( 1 / edgesCount );

    var a = firstEdge.getTail().position;
    var b = secondEdge.getTail().position;
    var c = thirdEdge.getTail().position;

    _tmp_vec3_1.subtractVectors( a, b );
    _tmp_vec3_2.subtractVectors( c, b );
    this.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
    this.normal.normalize();

    this.planeOffset = this.normal.dot( this.centroid );
};

/**
 * Get nth edge associated with this face.
 * @param {number} idx
 * @returns {Goblin.ConvexHullShape.HalfEdge}
 */
Goblin.ConvexHullShape.Face.prototype.getEdge = function( idx ) {
    var result = this.edge;
    while ( idx > 0 ) {
        result = result.next;
        idx--;
    }

    return result;
};

Goblin.ConvexHullShape.Face.Status = {
    Visible: 0,
    Deleted: 1,
};