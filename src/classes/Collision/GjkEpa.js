/**
 * Provides the classes and algorithms for running GJK+EPA based collision detection
 *
 * @class GjkEpa
 * @static
 */
Goblin.GjkEpa = {
    margins: 0.01,
    result: null,

    max_iterations: 20,
    epa_condition: 0.001,

    /**
     * Holds a point on the edge of a Minkowski difference along with that point's witnesses and the direction used to find the point
     *
     * @class SupportPoint
     * @param witness_a {vec3} Point in first object used to find the supporting point
     * @param witness_b {vec3} Point in the second object ued to find th supporting point
     * @param point {vec3} The support point on the edge of the Minkowski difference
     * @constructor
     */
    SupportPoint: function( witness_a, witness_b, point ) {
        this.witness_a = witness_a;
        this.witness_b = witness_b;
        this.point = point;
    },

    /**
     * Finds the extant point on the edge of the Minkowski difference for `object_a` - `object_b` in `direction`
     *
     * @method findSupportPoint
     * @param object_a {Goblin.RigidBody} First object in the search
     * @param object_b {Goblin.RigidBody} Second object in the search
     * @param direction {vec3} Direction to find the extant point in
     * @param gjk_point {Goblin.GjkEpa.SupportPoint} `SupportPoint` class to store the resulting point & witnesses in
     */
    findSupportPoint: ( function() {
        var temp = new Goblin.Vector3();
        return function( object_a, object_b, direction, support_point ) {
            // Find witnesses from the objects
            object_a.findSupportPoint( direction, support_point.witness_a );
            temp.scaleVector( direction, -1 );
            object_b.findSupportPoint( temp, support_point.witness_b );

            // Find the CSO support point
            support_point.point.subtractVectors( support_point.witness_a, support_point.witness_b );
        };
    } )(),

    findContacts: function( object_a, object_b, do_lightweight_collision ) {
        var simplex = Goblin.GjkEpa.GJK( object_a, object_b, do_lightweight_collision );

        if ( simplex && do_lightweight_collision ) {
            // Collision is detected and we don't need to calculate its properties - just signal that there is actual contact
            var dummyContact = Goblin.ObjectPool.getObject( 'ContactDetails' );
            dummyContact.object_a = object_a;
            dummyContact.object_b = object_b;
            dummyContact.is_lightweight = true;
            return [ dummyContact ];
        } else if ( Goblin.GjkEpa.result != null ) {
            return [ Goblin.GjkEpa.result ];
        } else if ( simplex != null ) {
            return [ Goblin.GjkEpa.EPA( simplex ) ];
        }

        return null;
    },

    /**
     * Returns a closest point on object (either vertex, point on edge or point on face) to a given object.
     * NOTE: point must lie outside the object, otherwise this method will return null.
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} object
     * @param {object} anotherObject - something that implements GJK API (.position and .findSupportPoint)
     * @returns {Goblin.Vector3|null}
     */
    findClosestPointOnObject: ( function() {
        var closestPointOnSimplex = new Goblin.Vector3();
        var currentClosestPointOnSimplex = new Goblin.Vector3();
        var barycentricCoordinates = new Goblin.Vector3();
        var a = new Goblin.Vector3();
        var b = new Goblin.Vector3();
        var c = new Goblin.Vector3();

        var getRealCoordinatesOnObjectA = function( simplex, closestPointOnSimplex, output ) {
            simplex.findBarycentricCoordinatesOf( closestPointOnSimplex, barycentricCoordinates );

            a.scaleVector( simplex.points[ 0 ].witness_a, barycentricCoordinates.x );
            b.scaleVector( simplex.points[ 1 ].witness_a, barycentricCoordinates.y );
            output.addVectors( a, b );

            // We may end up with a simplex with two or three points. findPointClosestToOrigin and findBarycentricCoordinatesOf handles them just fine.
            if ( simplex.points.length > 2 ) {
                c.scaleVector( simplex.points[ 2 ].witness_a, barycentricCoordinates.z );
                output.add( c );
            }
        };

        return function( object, anotherObject ) {
            var simplex = new Goblin.GjkEpa.Simplex( object, anotherObject, true );
            var gjkResult = simplex.addPoint();
            while ( gjkResult ) {
                gjkResult = simplex.addPoint();
            }

            // gjkResult === null => there is a contact, we can't find closest points.
            if ( gjkResult === null ) {
                Goblin.GjkEpa.freeSimplex( simplex );
                return null;
            }
            var result = new Goblin.Vector3();
            // Ok, now we're sure that our simplex does not contains origin, but we still may not be as close to origin as possible.
            // We should expand further it until it includes the closest possible point to the origin.

            // Just in case we've completely failed to expand our simplex in recent direction and ended up with some duplicates.
            simplex.deduplicatePoints();
            // updateDirection call serves two purposes.
            // 1) We're most likely will be dealing with a simplex with four points here (one or two of which is definitely redundant). updateDirection will eliminate them.
            // 2) We still want to perform at leas one expansion here, so we will need an expansion direction anyway.
            simplex.updateDirection();
            simplex.findPointClosestToOrigin( closestPointOnSimplex );
            getRealCoordinatesOnObjectA( simplex, closestPointOnSimplex, result );

            while ( true ) {
                // So, let's expand our simplex couple of times and see if we can get something better.
                // Should really be a one or two iteration cycle, even for a tricky shapes.
                simplex.addPoint();
                simplex.findPointClosestToOrigin( currentClosestPointOnSimplex );
                if ( currentClosestPointOnSimplex.lengthSquared() + Goblin.EPSILON >= closestPointOnSimplex.lengthSquared() ) {
                    break;
                }
                closestPointOnSimplex.copy( currentClosestPointOnSimplex );
                getRealCoordinatesOnObjectA( simplex, closestPointOnSimplex, result );
                simplex.deduplicatePoints();
                simplex.updateDirection();
            }
            Goblin.GjkEpa.freeSimplex( simplex );

            return result;
        };
    } )(),

    /**
     * Returns a closest point on object (either vertex, point on edge or point on face) to a given point.
     * NOTE: point must lie outside the object, otherwise this method will return null.
     *
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} object
     * @param {Goblin.Vector3} point
     * @returns {Goblin.Vector3|null}
     */
    findClosestPointOnObjectToPoint: function( object, point ) {
        return Goblin.GjkEpa.findClosestPointOnObject( object, new Goblin.GjkEpa.PointProxy( point ) );
    },

    /**
     * Returns a closest point on object (either vertex, point on edge or point on face) to a given line segment.
     * NOTE: line segment must fully lie outside the object, otherwise this method will return null.
     *
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} object
     * @param {Goblin.Vector3} lineSegmentStart
     * @param {Goblin.Vector3} lineSegmentEnd
     * @returns {Goblin.Vector3|null}
     */
    findClosestPointOnObjectToLineSegment: function( object, lineSegmentStart, lineSegmentEnd ) {
        return Goblin.GjkEpa.findClosestPointOnObject( object, new Goblin.GjkEpa.LineSegmentProxy( lineSegmentStart, lineSegmentEnd ) );
    },

    /**
     * Perform GJK algorithm against two objects. Returns a ContactDetails object if there is a collision, else null
     *
     * @method GJK
     * @param object_a {Goblin.RigidBody}
     * @param object_b {Goblin.RigidBody}
     * @return {Goblin.ContactDetails|Boolean} Returns `null` if no collision, else a `ContactDetails` object
     */
    GJK: ( function() {
        return function( object_a, object_b, do_lightweight_collision ) {
            var simplex = new Goblin.GjkEpa.Simplex( object_a, object_b, do_lightweight_collision ),
                last_point;

            Goblin.GjkEpa.result = null;

            while ( ( last_point = simplex.addPoint() ) ) {
            }

            // If last_point is false then there is no collision
            if ( last_point === false ) {
                Goblin.GjkEpa.freeSimplex( simplex );
                return null;
            }

            return simplex;
        };
    } )(),

    freeSimplex: function( simplex ) {
        // Free the support points used by this simplex
        for ( var i = 0, points_length = simplex.points.length; i < points_length; i++ ) {
            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', simplex.points[ i ] );
        }
    },

    freePolyhedron: function( polyhedron ) {
        // Free the support points used by the polyhedron (includes the points from the simplex used to create the polyhedron
        var pool = Goblin.ObjectPool.pools[ 'GJK2SupportPoint' ];

        for ( var i = 0, faces_length = polyhedron.faces.length; pool.length > 0 && i < faces_length; i++ ) {
            // The indexOf checking is required because vertices are shared between faces
            if ( pool.indexOf( polyhedron.faces[ i ].a ) === -1 ) {
                Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[ i ].a );
            }
            if ( pool.indexOf( polyhedron.faces[ i ].b ) === -1 ) {
                Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[ i ].b );
            }
            if ( pool.indexOf( polyhedron.faces[ i ].c ) === -1 ) {
                Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[ i ].c );
            }
        }
    },

    /**
     * Performs the Expanding Polytope Algorithm a GJK simplex
     *
     * @method EPA
     * @param simplex {Goblin.GjkEpa.Simplex} Simplex generated by the GJK algorithm
     * @return {Goblin.ContactDetails}
     */
    EPA: ( function() {
        var barycentric = new Goblin.Vector3(),
            confirm = {
                a: new Goblin.Vector3(),
                b: new Goblin.Vector3(),
                c: new Goblin.Vector3()
            };
        return function( simplex ) {
            // Time to convert the simplex to real faces
            // @TODO this should be a priority queue where the position in the queue is ordered by distance from face to origin
            var polyhedron = new Goblin.GjkEpa.Polyhedron( simplex );

            var i = 0;

            // Expand the polyhedron until it doesn't expand any more
            while ( ++i ) {
                polyhedron.findFaceClosestToOrigin();

                // Find a new support point in the direction of the closest point
                if ( polyhedron.closest_face_distance < Goblin.EPSILON ) {
                    _tmp_vec3_1.copy( polyhedron.faces[ polyhedron.closest_face ].normal );
                } else {
                    _tmp_vec3_1.copy( polyhedron.closest_point );
                }

                var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
                Goblin.GjkEpa.findSupportPoint( simplex.object_a, simplex.object_b, _tmp_vec3_1, support_point );

                // Check for terminating condition
                _tmp_vec3_1.subtractVectors( support_point.point, polyhedron.closest_point );
                var gap = _tmp_vec3_1.lengthSquared();

                if ( i === Goblin.GjkEpa.max_iterations || ( gap < Goblin.GjkEpa.epa_condition && polyhedron.closest_face_distance > Goblin.EPSILON ) ) {

                    // Get a ContactDetails object and fill out its details
                    var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
                    contact.object_a = simplex.object_a;
                    contact.object_b = simplex.object_b;

                    contact.contact_normal.normalizeVector( polyhedron.closest_point );
                    if ( contact.contact_normal.lengthSquared() === 0 ) {
                        contact.contact_normal.subtractVectors( contact.object_b.position, contact.object_a.position );
                    }
                    contact.contact_normal.normalize();

                    Goblin.GeometryMethods.findBarycentricCoordinates( polyhedron.closest_point, polyhedron.faces[ polyhedron.closest_face ].a.point, polyhedron.faces[ polyhedron.closest_face ].b.point, polyhedron.faces[ polyhedron.closest_face ].c.point, barycentric );

                    // Contact coordinates of object a
                    confirm.a.scaleVector( polyhedron.faces[ polyhedron.closest_face ].a.witness_a, barycentric.x );
                    confirm.b.scaleVector( polyhedron.faces[ polyhedron.closest_face ].b.witness_a, barycentric.y );
                    confirm.c.scaleVector( polyhedron.faces[ polyhedron.closest_face ].c.witness_a, barycentric.z );
                    contact.contact_point_in_a.addVectors( confirm.a, confirm.b );
                    contact.contact_point_in_a.add( confirm.c );

                    // Contact coordinates of object b
                    confirm.a.scaleVector( polyhedron.faces[ polyhedron.closest_face ].a.witness_b, barycentric.x );
                    confirm.b.scaleVector( polyhedron.faces[ polyhedron.closest_face ].b.witness_b, barycentric.y );
                    confirm.c.scaleVector( polyhedron.faces[ polyhedron.closest_face ].c.witness_b, barycentric.z );
                    contact.contact_point_in_b.addVectors( confirm.a, confirm.b );
                    contact.contact_point_in_b.add( confirm.c );

                    // Find actual contact point
                    contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
                    contact.contact_point.scale( 0.5 );

                    // Set objects' local points
                    contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
                    contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

                    // Calculate penetration depth
                    contact.penetration_depth = polyhedron.closest_point.length() + Goblin.GjkEpa.margins;

                    Goblin.GjkEpa.freePolyhedron( polyhedron );

                    return contact;
                }

                polyhedron.addVertex( support_point );
            }
        };
    } )(),

    Face: function( polyhedron, a, b, c ) {
        this.active = true;
        //this.polyhedron = polyhedron;
        this.a = a;
        this.b = b;
        this.c = c;
        this.normal = new Goblin.Vector3();
        this.neighbors = [];

        _tmp_vec3_1.subtractVectors( b.point, a.point );
        _tmp_vec3_2.subtractVectors( c.point, a.point );
        this.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
        this.normal.normalize();
    }
};

Goblin.GjkEpa.Polyhedron = function( simplex ) {
    this.closest_face = null;
    this.closest_face_distance = null;
    this.closest_point = new Goblin.Vector3();

    this.faces = [
        //BCD, ACB, CAD, DAB
        new Goblin.GjkEpa.Face( this, simplex.points[ 2 ], simplex.points[ 1 ], simplex.points[ 0 ] ),
        new Goblin.GjkEpa.Face( this, simplex.points[ 3 ], simplex.points[ 1 ], simplex.points[ 2 ] ),
        new Goblin.GjkEpa.Face( this, simplex.points[ 1 ], simplex.points[ 3 ], simplex.points[ 0 ] ),
        new Goblin.GjkEpa.Face( this, simplex.points[ 0 ], simplex.points[ 3 ], simplex.points[ 2 ] )
    ];

    this.faces[ 0 ].neighbors.push( this.faces[ 1 ], this.faces[ 2 ], this.faces[ 3 ] );
    this.faces[ 1 ].neighbors.push( this.faces[ 2 ], this.faces[ 0 ], this.faces[ 3 ] );
    this.faces[ 2 ].neighbors.push( this.faces[ 1 ], this.faces[ 3 ], this.faces[ 0 ] );
    this.faces[ 3 ].neighbors.push( this.faces[ 2 ], this.faces[ 1 ], this.faces[ 0 ] );
};
Goblin.GjkEpa.Polyhedron.prototype = {
    addVertex: function( vertex ) {
        var edges = [], faces = [], i, j, a, b, last_b;
        var e0, e1, e2, e3, e4;
        this.faces[ this.closest_face ].silhouette( vertex, edges );

        // Re-order the edges if needed
        for ( i = 0; i < edges.length - 5; i += 5 ) {
            a = edges[ i + 3 ];
            b = edges[ i + 4 ];

            // Ensure this edge really should be the next one
            if ( i !== 0 && last_b !== a ) {
                // It shouldn't
                for ( j = i + 5; j < edges.length; j += 5 ) {
                    if ( edges[ j + 3 ] === last_b ) {
                        // Found it
                        //var tmp = edges.slice( i, i + 5 );

                        e0 = edges[ i + 0 ];
                        e1 = edges[ i + 1 ];
                        e2 = edges[ i + 2 ];
                        e3 = edges[ i + 3 ];
                        e4 = edges[ i + 4 ];

                        edges[ i ] = edges[ j ];
                        edges[ i + 1 ] = edges[ j + 1 ];
                        edges[ i + 2 ] = edges[ j + 2 ];
                        edges[ i + 3 ] = edges[ j + 3 ];
                        edges[ i + 4 ] = edges[ j + 4 ];
                        edges[ j ] = e0;
                        edges[ j + 1 ] = e1;
                        edges[ j + 2 ] = e2;
                        edges[ j + 3 ] = e3;
                        edges[ j + 4 ] = e4;

                        a = edges[ i + 3 ];
                        b = edges[ i + 4 ];
                        break;
                    }
                }
            }
            last_b = b;
        }

        for ( i = 0; i < edges.length; i += 5 ) {
            var neighbor = edges[ i ];
            a = edges[ i + 3 ];
            b = edges[ i + 4 ];

            var face = new Goblin.GjkEpa.Face( this, b, vertex, a );
            face.neighbors[ 2 ] = edges[ i ];
            faces.push( face );

            neighbor.neighbors[ neighbor.neighbors.indexOf( edges[ i + 2 ] ) ] = face;
        }

        for ( i = 0; i < faces.length; i++ ) {
            faces[ i ].neighbors[ 0 ] = faces[ i + 1 === faces.length ? 0 : i + 1 ];
            faces[ i ].neighbors[ 1 ] = faces[ i - 1 < 0 ? faces.length - 1 : i - 1 ];
        }

        Array.prototype.push.apply( this.faces, faces );

        return edges;
    },

    findFaceClosestToOrigin: ( function() {
        var origin = new Goblin.Vector3(),
            point = new Goblin.Vector3();

        return function() {
            this.closest_face_distance = Infinity;

            var distance, i, face;

            for ( i = 0; i < this.faces.length; i++ ) {
                face = this.faces[ i ];

                if ( face.active === false ) {
                    continue;
                }

                Goblin.GeometryMethods.findClosestPointInTriangle( origin, face.a.point, face.b.point, face.c.point, point );
                distance = point.lengthSquared();
                if ( distance < this.closest_face_distance ) {
                    this.closest_face_distance = distance;
                    this.closest_face = i;
                    this.closest_point.copy( point );
                }
            }
        };
    } )()
};

Goblin.GjkEpa.Face.prototype = {
    /**
     * Determines if a vertex is in front of or behind the face
     *
     * @method classifyVertex
     * @param vertex {vec3} Vertex to classify
     * @return {Number} If greater than 0 then `vertex' is in front of the face
     */
    classifyVertex: function( vertex ) {
        var w = this.normal.dot( this.a.point );
        return this.normal.dot( vertex.point ) - w;
    },

    silhouette: function( point, edges, source ) {
        if ( this.active === false ) {
            return;
        }

        if ( this.classifyVertex( point ) > 0 ) {
            // This face is visible from `point`. Deactivate this face and alert the neighbors
            this.active = false;

            this.neighbors[ 0 ].silhouette( point, edges, this );
            this.neighbors[ 1 ].silhouette( point, edges, this );
            this.neighbors[ 2 ].silhouette( point, edges, this );
        } else if ( source ) {
            // This face is a neighbor to a now-silhouetted face, determine which neighbor and replace it
            var neighbor_idx = this.neighbors.indexOf( source ),
                a, b;
            if ( neighbor_idx === 0 ) {
                a = this.a;
                b = this.b;
            } else if ( neighbor_idx === 1 ) {
                a = this.b;
                b = this.c;
            } else {
                a = this.c;
                b = this.a;
            }
            edges.push( this, neighbor_idx, source, b, a );
        }
    }
};

( function() {
    var ao = new Goblin.Vector3();
    var ab = new Goblin.Vector3();
    var ac = new Goblin.Vector3();
    var bc = new Goblin.Vector3();

    var barycentric = new Goblin.Vector3(),
        confirm = {
            a: new Goblin.Vector3(),
            b: new Goblin.Vector3(),
            c: new Goblin.Vector3()
        };

    Goblin.GjkEpa.Simplex = function( object_a, object_b, do_lightweight_collision ) {
        this.object_a = object_a;
        this.object_b = object_b;
        this.do_lightweight_collision = do_lightweight_collision;
        this.points = [];
        this.iterations = 0;
        this.next_direction = new Goblin.Vector3();
        this.updateDirection();
    };
    Goblin.GjkEpa.Simplex.prototype = {
        addPoint: function() {
            if ( ++this.iterations === Goblin.GjkEpa.max_iterations ) {
                return false;
            }

            var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
            Goblin.GjkEpa.findSupportPoint( this.object_a, this.object_b, this.next_direction, support_point );
            this.points.push( support_point );

            if ( support_point.point.dot( this.next_direction ) < 0 && this.points.length > 1 ) {
                // Check the margins first
                // @TODO this can be expanded to support 1-simplex (2 points)
                if ( this.points.length >= 3 ) {
                    this.findPointClosestToOrigin( _tmp_vec3_1 );
                    var distanceSquared = _tmp_vec3_1.lengthSquared();

                    if ( distanceSquared <= Goblin.GjkEpa.margins * Goblin.GjkEpa.margins ) {
                        // Get a ContactDetails object and fill out its details
                        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
                        contact.object_a = this.object_a;
                        contact.object_b = this.object_b;

                        contact.contact_normal.normalizeVector( _tmp_vec3_1 );
                        if ( contact.contact_normal.lengthSquared() === 0 ) {
                            contact.contact_normal.subtractVectors( contact.object_b.position, contact.object_a.position );
                        }
                        contact.contact_normal.normalize();
                        contact.contact_normal.scale( -1 );

                        contact.penetration_depth = Goblin.GjkEpa.margins - Math.sqrt( distanceSquared );

                        this.findBarycentricCoordinatesOf( _tmp_vec3_1, barycentric );

                        if ( this.do_lightweight_collision ) {
                            contact.is_lightweight = true;
                            Goblin.GjkEpa.result = contact;
                            return null;
                        }

                        // Contact coordinates of object a
                        confirm.a.scaleVector( this.points[ 0 ].witness_a, barycentric.x );
                        confirm.b.scaleVector( this.points[ 1 ].witness_a, barycentric.y );
                        confirm.c.scaleVector( this.points[ 2 ].witness_a, barycentric.z );
                        contact.contact_point_in_a.addVectors( confirm.a, confirm.b );
                        contact.contact_point_in_a.add( confirm.c );

                        // Contact coordinates of object b
                        contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.penetration_depth );
                        contact.contact_point_in_b.add( contact.contact_point_in_a );

                        // Find actual contact point
                        contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
                        contact.contact_point.scale( 0.5 );

                        // Set objects' local points
                        contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
                        contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

                        Goblin.GjkEpa.result = contact;
                        return null;
                    }
                }

                // if the last added point was not past the origin in the direction
                // then the Minkowski difference cannot contain the origin because
                // point added is past the edge of the Minkowski difference
                return false;
            }

            if ( this.updateDirection() === true ) {
                // Found a collision
                return null;
            }

            return support_point;
        },

        deduplicatePoints: function() {
            for ( var i = 0; i < this.points.length; i++ ) {
                for ( var j = i + 1; j < this.points.length; j++ ) {
                    if ( this.points[ i ].point.equals( this.points[ j ].point ) ) {
                        this.points[ j ] = this.points[ this.points.length - 1 ];
                        this.points.pop();
                        i--;
                        break;
                    }
                }
            }
        },

        findDirectionFromLine: function() {
            ao.scaleVector( this.points[ 1 ].point, -1 );
            ab.subtractVectors( this.points[ 0 ].point, this.points[ 1 ].point );

            if ( ab.dot( ao ) < 0 ) {
                // Origin is on the opposite side of A from B
                this.next_direction.copy( ao );
                Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', this.points[ 1 ] );
                this.points.length = 1; // Remove second point
            } else {
                // Origin lies between A and B, move on to a 2-simplex
                this.next_direction.crossVectors( ab, ao );
                this.next_direction.cross( ab );

                // In the case that `ab` and `ao` are parallel vectors, direction becomes a 0-vector
                if (
                    this.next_direction.x === 0 &&
                    this.next_direction.y === 0 &&
                    this.next_direction.z === 0
                ) {
                    ab.normalize();
                    this.next_direction.x = 1 - Math.abs( ab.x );
                    this.next_direction.y = 1 - Math.abs( ab.y );
                    this.next_direction.z = 1 - Math.abs( ab.z );
                }
            }
        },

        findDirectionFromTriangle: ( function() {
            var triangleNormal = new Goblin.Vector3();
            var abNormal = new Goblin.Vector3();
            var acNormal = new Goblin.Vector3();
            var bcNormal = new Goblin.Vector3();

            return function() {
                // Triangle
                var a = this.points[ 2 ];
                var b = this.points[ 1 ];
                var c = this.points[ 0 ];

                ao.scaleVector( a.point, -1 );
                ab.subtractVectors( b.point, a.point );
                ac.subtractVectors( c.point, a.point );
                bc.subtractVectors( c.point, b.point );

                triangleNormal.crossVectors( ab, ac );

                // Edge cross products
                abNormal.crossVectors( ab, triangleNormal );
                acNormal.crossVectors( triangleNormal, ac );
                bcNormal.crossVectors( bc, triangleNormal );

                var acNormalDotAo = acNormal.dot( ao );
                var abNormalDotAo = abNormal.dot( ao );
                var bcNormalDotAo = bcNormal.dot( ao );

                if ( Math.abs( acNormalDotAo ) < Goblin.EPSILON ) {
                    // Origin lies on AC
                    this.next_direction.copy( acNormal );
                    return;
                } else if ( Math.abs( abNormalDotAo ) < Goblin.EPSILON ) {
                    // Origin lies on AB
                    this.next_direction.copy( abNormal );
                    return;
                } else if ( Math.abs( bcNormalDotAo ) < Goblin.EPSILON ) {
                    // Origin lies on BC
                    this.next_direction.copy( bcNormal );
                    return;
                }

                if ( acNormalDotAo >= 0 ) {
                    // Origin lies on side of ac opposite the triangle
                    if ( ac.dot( ao ) >= 0 ) {
                        // Origin outside of the ac line, so we form a new
                        // 1-simplex (line) with points A and C, leaving B behind
                        this.points.length = 0;
                        this.points.push( c, a );
                        Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );

                        // New search direction is from ac towards the origin
                        this.next_direction.crossVectors( ac, ao );
                        this.next_direction.cross( ac );
                    } else {
                        if ( ab.dot( ao ) >= 0 ) {
                            // Origin outside of the ab line, so we form a new
                            // 1-simplex (line) with points A and B, leaving C behind
                            this.points.length = 0;
                            this.points.push( b, a );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );

                            // New search direction is from ac towards the origin
                            this.next_direction.crossVectors( ab, ao );
                            this.next_direction.cross( ab );
                        } else {
                            // only A gives us a good reference point, start over with a 0-simplex
                            this.points.length = 0;
                            this.points.push( a );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );
                        }
                    }
                } else {
                    // Origin lies on the triangle side of ac
                    if ( abNormalDotAo >= 0 ) {
                        // Origin lies on side of ab opposite the triangle
                        if ( ab.dot( ao ) >= 0 ) {
                            // Origin outside of the ab line, so we form a new
                            // 1-simplex (line) with points A and B, leaving C behind
                            this.points.length = 0;
                            this.points.push( b, a );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );

                            // New search direction is from ac towards the origin
                            this.next_direction.crossVectors( ab, ao );
                            this.next_direction.cross( ab );
                        } else {
                            // only A gives us a good reference point, start over with a 0-simplex
                            this.points.length = 0;
                            this.points.push( a );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );
                            Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );
                        }
                    } else {
                        // Origin lies somewhere in the triangle or above/below it
                        if ( triangleNormal.dot( ao ) >= 0 ) {
                            // Origin is on the front side of the triangle
                            this.next_direction.copy( triangleNormal );
                            this.points.length = 0;
                            this.points.push( a, b, c );
                        } else {
                            // Origin is on the back side of the triangle
                            this.next_direction.copy( triangleNormal );
                            this.next_direction.scale( -1 );
                        }
                    }
                }
            };
        } )(),

        getFaceNormal: function( a, b, c, destination ) {
            ab.subtractVectors( b.point, a.point );
            ac.subtractVectors( c.point, a.point );
            destination.crossVectors( ab, ac );
            destination.normalize();
        },

        faceNormalDotOrigin: function( a, b, c ) {
            // Find face normal
            this.getFaceNormal( a, b, c, _tmp_vec3_1 );

            // Find direction of origin from center of face
            _tmp_vec3_2.addVectors( a.point, b.point );
            _tmp_vec3_2.add( c.point );
            _tmp_vec3_2.scale( -3 );
            _tmp_vec3_2.normalize();

            return _tmp_vec3_1.dot( _tmp_vec3_2 );
        },

        findDirectionFromTetrahedron: function() {
            var a = this.points[ 3 ],
                b = this.points[ 2 ],
                c = this.points[ 1 ],
                d = this.points[ 0 ];

            // Check each of the four sides to see which one is facing the origin.
            // Then keep the three points for that triangle and use its normal as the search direction
            // The four faces are BCD, ACB, CAD, DAB
            var closest_face = null,
                closest_dot = Goblin.EPSILON,
                face_dot;

            // @TODO we end up calculating the "winning" face normal twice, don't do that

            face_dot = this.faceNormalDotOrigin( b, c, d );
            if ( face_dot > closest_dot ) {
                closest_face = 1;
                closest_dot = face_dot;
            }

            face_dot = this.faceNormalDotOrigin( a, c, b );
            if ( face_dot > closest_dot ) {
                closest_face = 2;
                closest_dot = face_dot;
            }

            face_dot = this.faceNormalDotOrigin( c, a, d );
            if ( face_dot > closest_dot ) {
                closest_face = 3;
                closest_dot = face_dot;
            }

            face_dot = this.faceNormalDotOrigin( d, a, b );
            if ( face_dot > closest_dot ) {
                closest_face = 4;
                closest_dot = face_dot;
            }

            if ( closest_face === null ) {
                // We have a collision, ready for EPA
                return true;
            } else if ( closest_face === 1 ) {
                // BCD
                this.points.length = 0;
                this.points.push( b, c, d );
                this.getFaceNormal( b, c, d, _tmp_vec3_1 );
                this.next_direction.copy( _tmp_vec3_1 );
            } else if ( closest_face === 2 ) {
                // ACB
                this.points.length = 0;
                this.points.push( a, c, b );
                this.getFaceNormal( a, c, b, _tmp_vec3_1 );
                this.next_direction.copy( _tmp_vec3_1 );
            } else if ( closest_face === 3 ) {
                // CAD
                this.points.length = 0;
                this.points.push( c, a, d );
                this.getFaceNormal( c, a, d, _tmp_vec3_1 );
                this.next_direction.copy( _tmp_vec3_1 );
            } else if ( closest_face === 4 ) {
                // DAB
                this.points.length = 0;
                this.points.push( d, a, b );
                this.getFaceNormal( d, a, b, _tmp_vec3_1 );
                this.next_direction.copy( _tmp_vec3_1 );
            }

            return false;
        },

        updateDirection: function() {
            if ( this.points.length === 0 ) {
                this.next_direction.subtractVectors( this.object_b.position, this.object_a.position );
                return false;
            } else if ( this.points.length === 1 ) {
                this.next_direction.scale( -1 );
                return false;
            } else if ( this.points.length === 2 ) {
                this.findDirectionFromLine();
                return false;
            } else if ( this.points.length === 3 ) {
                this.findDirectionFromTriangle();
                return false;
            } else {
                return this.findDirectionFromTetrahedron();
            }
        },

        /**
         * This method handle simplexes with any number of points, however, it's result isn't reliable for the simplexes
         * with more than three points.
         *
         * @param {Goblin.Vector3} outputPoint
         */
        findPointClosestToOrigin: ( function() {
            var origin = new Goblin.Vector3();

            return function( outputPoint ) {
                var points = this.points;

                if ( points.length === 1 ) {
                    outputPoint.copy( points[ 0 ].point );
                } else if ( points.length === 2 ) {
                    Goblin.GeometryMethods.findClosestPointOnASegment( points[ 0 ].point, points[ 1 ].point, origin, outputPoint );
                } else {
                    // TODO: Should we really use first 3 points if simplex length > 3? Seems to be the case in current GJK implementation.
                    Goblin.GeometryMethods.findClosestPointInTriangle(
                        origin,
                        points[ 0 ].point,
                        points[ 1 ].point,
                        points[ 2 ].point,
                        outputPoint
                    );
                }
            };
        } )(),

        /**
         * This method handle simplexes with any number of points, however, it's result isn't reliable for the simplexes
         * with more than three points.
         *
         * @param {Goblin.Vector3} point
         * @param {Goblin.Vector3} outputPoint
         */
        findBarycentricCoordinatesOf: ( function() {
            var lineDirection = new Goblin.Vector3();
            var pointDirection = new Goblin.Vector3();

            return function( point, outputPoint ) {
                var points = this.points;

                if ( points.length === 1 ) {
                    outputPoint.set( 1, 0, 0 );
                } else if ( points.length === 2 ) {
                    lineDirection.subtractVectors( points[ 1 ].point, points[ 0 ].point );
                    pointDirection.subtractVectors( point, points[ 0 ].point );
                    var t = Math.sqrt( pointDirection.lengthSquared() / lineDirection.lengthSquared() );
                    outputPoint.set( 1 - t, t );
                } else {
                    Goblin.GeometryMethods.findBarycentricCoordinates( point, points[ 0 ].point, points[ 1 ].point, points[ 2 ].point, outputPoint );
                }
            };
        } )()
    };
} )();

/**
 * Wraps a vector in a proxy object so that it can ne used in GJK.
 * @param {Goblin.Vector3} point
 * @constructor
 */
Goblin.GjkEpa.PointProxy = function( point ) {
    this.position = point;
};

/**
 * @param {Goblin.Vector3} direction - direction to use in finding the support point
 * @param {Goblin.Vector3} supportPoint - variable which will contain the supporting point after calling this method
 */
Goblin.GjkEpa.PointProxy.prototype.findSupportPoint = function( direction, supportPoint ) {
    supportPoint.copy( this.position );
};

/**
 * Wraps a line segment in a proxy object so that it can be used in GJK.
 *
 * @param {Goblin.Vector3} lineSegmentStart
 * @param {Goblin.Vector3} lineSegmentEnd
 * @constructor
 */
Goblin.GjkEpa.LineSegmentProxy = function( lineSegmentStart, lineSegmentEnd ) {
    this.position = new Goblin.Vector3();
    this.position.addVectors( lineSegmentStart, lineSegmentEnd );
    this.position.scale( 0.5 );

    this.lineSegmentStart = lineSegmentStart;
    this.lineSegmentEnd = lineSegmentEnd;
};

/**
 * @param {Goblin.Vector3} direction - direction to use in finding the support point
 * @param {Goblin.Vector3} supportPoint - variable which will contain the supporting point after calling this method
 */
Goblin.GjkEpa.LineSegmentProxy.prototype.findSupportPoint = function( direction, supportPoint ) {
    var dotStart = this.lineSegmentStart.dot( direction );
    var dotEnd = this.lineSegmentEnd.dot( direction );

    if ( dotStart > dotEnd ) {
        supportPoint.copy( this.lineSegmentStart );
    } else {
        supportPoint.copy( this.lineSegmentEnd );
    }
};