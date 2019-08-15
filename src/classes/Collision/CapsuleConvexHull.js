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

        // If closestPointOnHull is not null then the inner segment does not collide with convex hull.
        // This can mean two things - either there is no collision at all or there is a shallow collision.
        var closestPointOnHull = Goblin.GjkEpa.findClosestPointOnObjectToLineSegment( convexHull, innerSegmentStart, innerSegmentEnd );
        return closestPointOnHull !== null ?
            Goblin.Collision.capsuleConvexHull._shallowCapsuleConvexHull( capsule, convexHull, closestPointOnHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision ) :
            Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHull( capsule, convexHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision );
    };
} )();

/**
 * Capsule vs Convex Hull collision for cases when the inner segment of the capsule is fully outside the convex hull.
 *
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} capsule
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {Goblin.Vector3} closestPointOnHull
 * @param {Goblin.Vector3} innerSegmentStart
 * @param {Goblin.Vector3} innerSegmentEnd
 * @param {boolean} doLightweightCollision
 */
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
        if ( penetrationDepth < Goblin.EPSILON ) {
            return null;
        }

        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = capsule;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        contact.penetration_depth = penetrationDepth;
        contact.contact_normal.copy( contactNormal );

        // We may want to generate two contact points (at the start / end of clipped inner segment).
        // But first, we need to check if inner segment is perpendicular to the contact normal, so that
        // we can specify the same penetration depth for the both contact points.
        innerSegmentDirection.subtractVectors( innerSegmentEnd, innerSegmentStart );
        innerSegmentDirection.normalize();
        var dotBetweenInnerSegmentDirectionAndContactNormal = innerSegmentDirection.dot( contactNormal );
        if ( Math.abs( dotBetweenInnerSegmentDirectionAndContactNormal ) > Goblin.Collision.capsuleConvexHull._epsilon ) {
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contact, closestPointOnInnerSegment, closestPointOnHull );
            return [ contact ];
        }

        // Ok, inner segment is definitely perpendicular to contact normal, but we aren't done yet. Now we want to
        // find the face which is pushing us away and use it to clip inner segment - because capsule may be located
        // at the very end of that face, and we can't just take start and end points of the inner segment - we need
        // to find the part of the inner segment which is actually located above the face.
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

        // Clipping can fail if we've found a wrong face - for example, there are two faces with the same normal
        // which haven't been merged for some reason. In this case we can fall back to our closest point
        // and generate at least some collision (which is most likely will lead to unstable manifold).
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

        // console.log('2 points');
        return [ contactAtTheStart, contactAtTheEnd ];
    };
} )();

/**
 * Capsule vs Convex Hull collision for cases when the inner segment of the capsule is intersecting with the convex hull.
 *
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} capsule
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {Goblin.Vector3} innerSegmentStart
 * @param {Goblin.Vector3} innerSegmentEnd
 * @param {boolean} doLightweightCollision
 */
Goblin.Collision.capsuleConvexHull._deepCapsuleConvexHull = ( function() {
    var innerSegmentDirection = new Goblin.Vector3();
    var pointOnEdge = new Goblin.Vector3();

    return function( capsule, convexHull, innerSegmentStart, innerSegmentEnd, doLightweightCollision ) {
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = capsule;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        innerSegmentDirection.subtractVectors( innerSegmentStart, innerSegmentEnd );
        innerSegmentDirection.normalize();

        // In order to determine minimum translation vector for such collision we need to perform SAT with 2 types
        // of axes - first type is just the face normals of the convex hull and the second type is cross products
        // between inner segment and all edges of the convex hull.
        // If the MTV was generated using the first type of axes we have a deep face collision, otherwise
        // we are dealing with a deep edge collision.
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
        // There will be a lot of duplicates, mostly because we are dealing with half-edges, so we always have
        // at least two edges pointing in the same direction.
        // We still need to preserve faceNormals and edgeCrossNormals arrays in order to determine which type of
        // collision we're dealing with.
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
            // Ok, so as I said we will have at least two candidates for the reference edge. We can detect the real reference edge
            // by performing a simple test - it should be located in minimumProjection.overlap - capsule.shape.radius units
            // from inner segment in the minimumProjection.normal direction.
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
            // Huh? What kind of normal have we used in that case?
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

/**
 * Capsule vs Convex Hull collision for cases when the inner segment of the capsule is intersecting with the convex hull
 * and our minimum translation vector is obtained using one of the face normals.
 *
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} capsule
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {Goblin.Vector3} innerSegmentStart
 * @param {Goblin.Vector3} innerSegmentEnd
 * @param {Goblin.Collision.SAT.Projection} minimumProjection
 * @param {Goblin.ConvexHullShape.Face} face
 */
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

        // We may want to generate two contact points in order to get a stable contact manifold, but first we need to perform a sanity check.
        // We should verify thet the inner segment is perpendicular to the face, so we can use the same penetration depth for both points.
        // If it's not the case - we can always fall back to deepestPointOnInnerSegment, which is definitely related to out penetration depth.
        var dotBetweenInnerSegmentDirectionAndContactNormal = innerSegmentDirection.dot( contactAtTheStart.contact_normal );
        if ( Math.abs( dotBetweenInnerSegmentDirectionAndContactNormal ) > Goblin.Collision.capsuleConvexHull._epsilon ) {
            contactAtTheStart.contact_point_in_b.add( deepestPointOnInnerSegment );
            Goblin.Collision.capsuleConvexHull._fillContactWithDetails( contactAtTheStart, deepestPointOnInnerSegment, contactAtTheStart.contact_point_in_b );
            return [ contactAtTheStart ];
        }

        // We also want to clip the inner segment by the face, in case the capsule is hanging on the edge of the convex hull.
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
            // Shouldn't really get there, but fine - we still can use good old deepestPointOnInnerSegment and generate one contact point.
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

/**
 * Capsule vs Convex Hull collision for cases when the inner segment of the capsule is intersecting with the convex hull
 * and our minimum translation vector is obtained using the cross product of edge and inner segment.
 *
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} capsule
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {Goblin.Vector3} innerSegmentStart
 * @param {Goblin.Vector3} innerSegmentEnd
 * @param {Goblin.Collision.SAT.Projection} minimumProjection
 * @param {Goblin.ConvexHullShape.Face} face
 */
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

        // An easy way to find a contact point on the inner segment - we can shift the edge in the direction of minimumProjection
        // and intersect it with the inner segment itself. Note, that we can't just obtain that point using a perpendicular from the edge to the inner segment
        // because they might have a different rotation.
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
            // The only way we can end up here is when we've selected minimizing edge incorrectly.
            throw new Error( 'Cannot find an intersection between shifted edge and inner segment' );
        }

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
 * Fills the contact with some boring details given the partially populated contact (with both objects, penetration depth and normal),
 * and two points.
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
 * Clips the given line segment with a face of convex hull. Line segment and face don't need to be coplanar - this method
 * will handle this for you. Returns `true` if clipping was successful (segment intersects with the face or lies fully inside)
 * and `false` otherwise (if segment lies fully outside the face).
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
            // At most two intersection with a convex object, this is a law.
            if ( intersectionsCount === 2 ) {
                return true;
            }

            currentEdge = currentEdge.next;
        } while ( currentEdge !== face.edge );

        // Here we're mostly trying to distinguish two cases when we have no intersections - first one when segment lies inside the face (which is fine)
        // and the second one when segment lies outside the face (which is absolutely not acceptable).
        return intersectionsCount !== 0 || ( segmentStartIsInside && segmentEndIsInside );
    };
} )();

// This moderately small number (which is, however, bigger than the Goblin.EPSILON) allows us to generate two contact points more often, which will lead to a more stable manifolds.
// In practice, this leads to mush stable contact resolution, even if we aren't so precise with rotations.
Goblin.Collision.capsuleConvexHull._epsilon = 0.01;