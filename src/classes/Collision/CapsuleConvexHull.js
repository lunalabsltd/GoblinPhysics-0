/**
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectA
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectB
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails[]|null}
 */
Goblin.Collision.capsuleConvexHull = ( function() {
    var innerSegmentStart = new Goblin.Vector3();
    var innerSegmentEnd = new Goblin.Vector3();

    return function( objectA, objectB, doLightweightCollision ) {
        var capsule;
        var convexHull;
        if ( objectA.shape.shapeType === Goblin.Shapes.Type.CapsuleShape ) {
            capsule = objectA;
            convexHull = objectB;
        } else {
            capsule = objectB;
            convexHull = objectA;
        }

        innerSegmentStart.set( 0, capsule.shape.half_height, 0 );
        innerSegmentEnd.set( 0, -capsule.shape.half_height, 0 );
        capsule.transform.transformVector3( innerSegmentStart );
        capsule.transform.transformVector3( innerSegmentEnd );

        // If closestPointOnHull is not null then inner segment does not collide with convex hull.
        // This can mean two things - either there is no collision at all or there is a shallow collision.
        var closestPointOnHull = Goblin.GjkEpa.findClosestPointOnObjectToLineSegment( convexHull, innerSegmentStart, innerSegmentEnd );
        return closestPointOnHull !== null ?
            Goblin.Collision.capsuleConvexHull._shallowCapsuleConvexHull( capsule, convexHull, closestPointOnHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision ) :
            Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHull( capsule, convexHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision );
    };
} )();

Goblin.Collision.capsuleConvexHull._shallowCapsuleConvexHull = ( function() {
    var closestPointOnInnerSegment = new Goblin.Vector3();
    var contactNormal = new Goblin.Vector3();
    var invertedRotationQuaternion = new Goblin.Quaternion();
    var referencePlaneNormal = new Goblin.Vector3();
    var transformedInnerSegmentStart = new Goblin.Vector3();
    var transformedInnerSegmentEnd = new Goblin.Vector3();
    var transformedClippedInnerSegmentStart = new Goblin.Vector3();
    var transformedClippedInnerSegmentEnd = new Goblin.Vector3();
    var clippedInnerSegmentStart = new Goblin.Vector3();
    var clippedInnerSegmentEnd = new Goblin.Vector3();
    var innerSegmentDirection = new Goblin.Vector3();

    return function( capsule, convexHull, closestPointOnHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision ) {
        Goblin.GeometryMethods.findClosestPointOnASegment( innerSegmentStart, innerSegmentEnd, closestPointOnHull, closestPointOnInnerSegment );
        contactNormal.subtractVectors( closestPointOnHull, closestPointOnInnerSegment );
        var distanceToClosestPoint = contactNormal.normalize();

        // The capsule overlaps the hull if the distance of the inner capsule segment to the hull
        // is less or equal than the capsule radius.
        var penetrationDepth = capsule.shape.radius - distanceToClosestPoint;
        if ( penetrationDepth < 0 ) {
            return null;
        }

        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = capsule;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        contact.penetration_depth = penetrationDepth;
        contact.contact_normal.copy( contactNormal );

        innerSegmentDirection.subtractVectors( innerSegmentEnd, innerSegmentStart );
        innerSegmentDirection.normalize();
        var dotBetweenInnerSegmentDirectionAndContactNormal = innerSegmentDirection.dot( contactNormal );
        if ( Math.abs( dotBetweenInnerSegmentDirectionAndContactNormal ) > Goblin.Collision.capsuleConvexHull._epsilon ) {
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contact, closestPointOnInnerSegment, closestPointOnHull );
            return [ contact ];
        }

        invertedRotationQuaternion.invertQuaternion( convexHull.rotation );
        invertedRotationQuaternion.transformVector3Into( contactNormal, referencePlaneNormal );
        referencePlaneNormal.scale( -1 );
        var referenceFace = null;
        for ( var i = 0; i < convexHull.shape.faces.length; i++ ) {
            var face = convexHull.shape.faces[ i ];
            // Let's take a moment and pray for convex hull building algorithm to successfully merge all faces with the same normal.
            if ( face.normal.equals( referencePlaneNormal, Goblin.Collision.capsuleConvexHull._epsilon ) ) {
                referenceFace = face;
                break;
            }
        }

        if ( referenceFace === null ) {
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contact, closestPointOnInnerSegment, closestPointOnHull );
            return [ contact ];
        }

        convexHull.transform_inverse.transformVector3Into( innerSegmentStart, transformedInnerSegmentStart );
        convexHull.transform_inverse.transformVector3Into( innerSegmentEnd, transformedInnerSegmentEnd );
        var clippingWasSuccessful = Goblin.Collision.capsuleConvexHull._clipLineSegmentWithFace(
            transformedInnerSegmentStart,
            transformedInnerSegmentEnd,
            referenceFace,
            transformedClippedInnerSegmentStart,
            transformedClippedInnerSegmentEnd
        );
        convexHull.transform.transformVector3Into( transformedClippedInnerSegmentStart, clippedInnerSegmentStart );
        convexHull.transform.transformVector3Into( transformedClippedInnerSegmentEnd, clippedInnerSegmentEnd );

        if ( !clippingWasSuccessful ) {
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contact, closestPointOnInnerSegment, closestPointOnHull );
            return [ contact ];
        }

        var contactAtTheStart = contact;
        var contactAtTheEnd = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contactAtTheEnd.object_a = capsule;
        contactAtTheEnd.object_b = convexHull;
        contactAtTheEnd.contact_normal.copy( contactAtTheStart.contact_normal );
        contactAtTheEnd.penetration_depth = contactAtTheStart.penetration_depth;

        contactAtTheStart.contact_point_in_b.scaleVector( contactNormal, capsule.shape.radius - penetrationDepth );
        contactAtTheStart.contact_point_in_b.add( clippedInnerSegmentStart );
        contactAtTheEnd.contact_point_in_b.scaleVector( contactNormal, capsule.shape.radius - penetrationDepth );
        contactAtTheEnd.contact_point_in_b.add( clippedInnerSegmentEnd );

        Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheStart, clippedInnerSegmentStart, contactAtTheStart.contact_point_in_b );
        Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheEnd, clippedInnerSegmentEnd, contactAtTheEnd.contact_point_in_b );

        return [ contactAtTheStart, contactAtTheEnd ];
    };
} )();

Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHull = ( function() {
    var innerSegmentDirection = new Goblin.Vector3();
    var pointOnEdge = new Goblin.Vector3();

    return function( capsule, convexHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision ) {
        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = capsule;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        innerSegmentDirection.subtractVectors( innerSegmentStart, innerSegmentEnd );
        innerSegmentDirection.normalize();

        var faceNormals = [];
        for ( var i = 0; i < convexHull.shape.faceNormals.length; i++ ) {
            var faceNormal = convexHull.shape.faceNormals[ i ];
            var rotatedNormal = new Goblin.Vector3();
            convexHull.rotation.transformVector3Into( faceNormal, rotatedNormal );
            faceNormals.push( rotatedNormal );
        }

        var edgeCrossNormals = [];
        for ( i = 0; i < convexHull.shape.edgeDirections.length; i++ ) {
            var edgeDirection = convexHull.shape.edgeDirections[ i ];
            var crossProduct = new Goblin.Vector3();
            convexHull.rotation.transformVector3Into( edgeDirection, crossProduct );
            crossProduct.cross( innerSegmentDirection );
            edgeCrossNormals.push( crossProduct );
        }

        var normals = [];
        normals.push.apply( normals, faceNormals );
        normals.push.apply( normals, edgeCrossNormals );
        Goblin.Collision.SAT.sanitizeAndRemoveDuplicatedVectors( normals );

        var minimumProjection = Goblin.Collision.SAT.performSat( capsule, convexHull, normals );
        if ( minimumProjection === null ) {
            // Shouldn't really be there
            throw new Error( 'Inner segment of the capsule overlaps convex hull, but SAT does not think so.' );
        }

        var referenceFace = null;
        for ( i = 0; i < faceNormals.length; i++ ) {
            if ( faceNormals[ i ].equals( minimumProjection.normal ) ) {
                referenceFace = convexHull.shape.faces[ i ];
                break;
            }
        }

        if ( referenceFace !== null ) {
            // Deep face contact
            return Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHullOnFace(
                capsule,
                convexHull,
                innerSegmentStart,
                innerSegmentEnd,
                minimumProjection,
                referenceFace
            );
        }

        // Deep edge contact
        var referenceEdge = null;
        var segmentDot = Math.min( innerSegmentStart.dot( minimumProjection.normal ), innerSegmentEnd.dot( ( minimumProjection.normal ) ) );
        for ( i = 0; i < edgeCrossNormals.length; i++ ) {
            if ( !edgeCrossNormals[ i ].equals( minimumProjection.normal ) ) {
                continue;
            }

            var potentialReferenceEdge = convexHull.shape.edges[ i ];
            convexHull.transform.transformVector3Into( potentialReferenceEdge.getTail().position, pointOnEdge );
            var edgeDot = pointOnEdge.dot( minimumProjection.normal );
            if ( Math.abs( edgeDot - segmentDot - minimumProjection.overlap + capsule.shape.radius ) < Goblin.EPSILON ) {
                referenceEdge = potentialReferenceEdge;
                break;
            }
        }

        if ( referenceEdge === null ) {
            throw new Error( 'Deep contact: cannot find reference face nor reference edge' );
        }

        return Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHullOnEdge(
            capsule,
            convexHull,
            innerSegmentStart,
            innerSegmentEnd,
            minimumProjection,
            referenceEdge
        );
    };
} )();

Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHullOnFace = ( function() {
    var innerSegmentDirection = new Goblin.Vector3();
    var transformedInnerSegmentStart = new Goblin.Vector3();
    var transformedInnerSegmentEnd = new Goblin.Vector3();
    var transformedClippedInnerSegmentStart = new Goblin.Vector3();
    var transformedClippedInnerSegmentEnd = new Goblin.Vector3();
    var clippedInnerSegmentStart = new Goblin.Vector3();
    var clippedInnerSegmentEnd = new Goblin.Vector3();

    return function( capsule, convexHull, innerSegmentStart, innerSegmentEnd, minimumProjection, face ) {
        innerSegmentDirection.subtractVectors( innerSegmentStart, innerSegmentEnd );
        innerSegmentDirection.normalize();

        var deepestPointOnInnerSegment = innerSegmentStart.dot( minimumProjection.normal ) < innerSegmentEnd.dot( minimumProjection.normal ) ?
            innerSegmentStart : innerSegmentEnd;

        var contactAtTheStart = Goblin.ObjectPool.getObject( 'ContactDetails' );
        var contactAtTheEnd = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contactAtTheStart.object_a = contactAtTheEnd.object_a = capsule;
        contactAtTheStart.object_b = contactAtTheEnd.object_b = convexHull;
        contactAtTheStart.penetration_depth = contactAtTheEnd.penetration_depth = minimumProjection.overlap;
        contactAtTheStart.contact_normal.scaleVector( minimumProjection.normal, -1 );
        contactAtTheEnd.contact_normal.scaleVector( minimumProjection.normal, -1 );
        contactAtTheStart.contact_point_in_b.scaleVector( contactAtTheStart.contact_normal, -( minimumProjection.overlap - capsule.shape.radius ) );
        contactAtTheEnd.contact_point_in_b.copy( contactAtTheStart.contact_point_in_b );

        var dotBetweenInnerSegmentDirectionAndContactNormal = innerSegmentDirection.dot( contactAtTheStart.contact_normal );
        if ( Math.abs( dotBetweenInnerSegmentDirectionAndContactNormal ) > Goblin.Collision.capsuleConvexHull._epsilon ) {
            contactAtTheStart.contact_point_in_b.add( deepestPointOnInnerSegment );
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheStart, deepestPointOnInnerSegment, contactAtTheStart.contact_point_in_b );
            return [ contactAtTheStart ];
        }

        convexHull.transform_inverse.transformVector3Into( innerSegmentStart, transformedInnerSegmentStart );
        convexHull.transform_inverse.transformVector3Into( innerSegmentEnd, transformedInnerSegmentEnd );
        var clippingWasSuccessful = Goblin.Collision.capsuleConvexHull._clipLineSegmentWithFace(
            transformedInnerSegmentStart,
            transformedInnerSegmentEnd,
            face,
            transformedClippedInnerSegmentStart,
            transformedClippedInnerSegmentEnd
        );
        convexHull.transform.transformVector3Into( transformedClippedInnerSegmentStart, clippedInnerSegmentStart );
        convexHull.transform.transformVector3Into( transformedClippedInnerSegmentEnd, clippedInnerSegmentEnd );

        if ( !clippingWasSuccessful ) {
            contactAtTheStart.contact_point_in_b.add( deepestPointOnInnerSegment );
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheStart, deepestPointOnInnerSegment, contactAtTheStart.contact_point_in_b );
            return [ contactAtTheStart ];
        }

        contactAtTheStart.contact_point_in_b.add( clippedInnerSegmentStart );
        contactAtTheEnd.contact_point_in_b.add( clippedInnerSegmentEnd );
        Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheStart, clippedInnerSegmentStart, contactAtTheStart.contact_point_in_b );
        Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheEnd, clippedInnerSegmentEnd, contactAtTheEnd.contact_point_in_b );

        return [ contactAtTheStart, contactAtTheEnd ];
    };
} )();

Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHullOnEdge = ( function() {
    var edgeStart = new Goblin.Vector3();
    var edgeEnd = new Goblin.Vector3();
    var shiftedEdgeStart = new Goblin.Vector3();
    var shiftedEdgeEnd = new Goblin.Vector3();
    var closestPointOnInnerSegment = new Goblin.Vector3();
    var closestPointOnEdge = new Goblin.Vector3();

    return function( capsule, convexHull, innerSegmentStart, innerSegmentEnd, minimumProjection, edge ) {
        convexHull.transform.transformVector3Into( edge.getHead().position, edgeStart );
        convexHull.transform.transformVector3Into( edge.getTail().position, edgeEnd );

        shiftedEdgeStart.scaleVector( minimumProjection.normal, -( minimumProjection.overlap - capsule.shape.radius ) );
        shiftedEdgeEnd.copy( shiftedEdgeStart );
        shiftedEdgeStart.add( edgeStart );
        shiftedEdgeEnd.add( edgeEnd );

        var intersectionWasSuccessful = Goblin.GeometryMethods.getLineSegmentsIntersection(
            innerSegmentStart,
            innerSegmentEnd,
            shiftedEdgeStart,
            shiftedEdgeEnd,
            closestPointOnInnerSegment
        );
        if ( !intersectionWasSuccessful ) {
            throw new Error( 'Cannot find an intersection between shifted edge and inner segment' );
        }

        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = capsule;
        contact.object_b = convexHull;
        contact.contact_normal.scaleVector( minimumProjection.normal, -1 );
        contact.penetration_depth = minimumProjection.overlap;
        closestPointOnEdge.scaleVector( minimumProjection.normal, minimumProjection.overlap - capsule.shape.radius );
        closestPointOnEdge.add( closestPointOnInnerSegment );

        Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contact, closestPointOnInnerSegment, closestPointOnEdge );
        return [ contact ];
    };
} )();

/**
 *
 *
 * @param {Goblin.ContactDetails} contact
 * @param {Goblin.Vector3} closestPointOnInnerSegment - closest point on inner segment for the objectA
 * @param {Goblin.Vector3} closestPointOnHull - closest point on inner segment for the objectB
 */
Goblin.Collision.capsuleConvexHull._fillContactWithDetails = function( contact, closestPointOnInnerSegment, closestPointOnHull ) {
    contact.contact_point_in_a.scaleVector( contact.contact_normal, contact.object_a.shape.radius );
    contact.contact_point_in_a.add( closestPointOnInnerSegment );

    contact.contact_point_in_b.copy( closestPointOnHull );

    contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
    contact.contact_point.scale( 0.5 );

    contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
    contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );
};

/**
 *
 * @param {Goblin.Vector3} lineSegmentStart
 * @param {Goblin.Vector3} lineSegmentEnd
 * @param {Goblin.ConvexHullShape.Face} face
 * @param {Goblin.Vector3} clippedSegmentStart
 * @param {Goblin.Vector3} clippedSegmentEnd
 * @returns {boolean}
 */
Goblin.Collision.capsuleConvexHull._clipLineSegmentWithFace = ( function() {
    var projectedLineSegmentStart = new Goblin.Vector3();
    var projectedLineSegmentEnd = new Goblin.Vector3();
    var edgeDirection = new Goblin.Vector3();
    var edgeNormal = new Goblin.Vector3();
    var intersectionPoint = new Goblin.Vector3();
    var edgeDot = 0;
    var segmentStartDistance = 0;
    var segmentEndDistance = 0;
    var faceDistance = 0;

    return function( lineSegmentStart, lineSegmentEnd, face, clippedSegmentStart, clippedSegmentEnd ) {
        clippedSegmentStart.copy( lineSegmentStart );
        clippedSegmentEnd.copy( lineSegmentEnd );

        faceDistance = Goblin.GeometryMethods.projectPointOnPlane( face.edge.getTail().position, face.normal, lineSegmentStart, projectedLineSegmentStart );
        Goblin.GeometryMethods.projectPointOnPlane( face.edge.getTail().position, face.normal, lineSegmentEnd, projectedLineSegmentEnd );

        var currentEdge = face.edge;
        var segmentStartIsInside = true;
        var segmentEndIsInside = true;
        var intersectionsCount = 0;

        do {
            var edgeStart = currentEdge.getHead().position;
            var edgeEnd = currentEdge.getTail().position;
            edgeDirection.subtractVectors( edgeEnd, edgeStart );
            edgeNormal.crossVectors( face.normal, edgeDirection );
            edgeNormal.normalize();

            edgeDot = edgeStart.dot( edgeNormal );
            segmentStartDistance = projectedLineSegmentStart.dot( edgeNormal ) - edgeDot;
            segmentEndDistance = projectedLineSegmentEnd.dot( edgeNormal ) - edgeDot;

            if ( segmentStartDistance > Goblin.EPSILON ) {
                segmentStartIsInside = false;
            }
            if ( segmentEndDistance > Goblin.EPSILON ) {
                segmentEndIsInside = false;
            }

            if ( Math.sign( segmentStartDistance ) === Math.sign( segmentEndDistance ) ) {
                currentEdge = currentEdge.next;
                continue;
            }

            var thereWasAnIntersection = Goblin.GeometryMethods.getLineSegmentsIntersection( edgeStart, edgeEnd, projectedLineSegmentStart, projectedLineSegmentEnd, intersectionPoint );
            if ( !thereWasAnIntersection ) {
                currentEdge = currentEdge.next;
                continue;
            }

            intersectionsCount++;

            var pointToUse = segmentStartDistance > 0 ? clippedSegmentStart : clippedSegmentEnd;
            pointToUse.scaleVector( face.normal, faceDistance );
            pointToUse.add( intersectionPoint );
            if ( intersectionsCount === 2 ) {
                return true;
            }

            currentEdge = currentEdge.next;
        } while ( currentEdge !== face.edge );

        return intersectionsCount !== 0 || ( segmentStartIsInside && segmentEndIsInside );
    };
} )();

Goblin.Collision.capsuleConvexHull._epsilon = 0.01;