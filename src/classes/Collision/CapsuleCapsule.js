/**
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectA
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectB
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails[]|null}
 */
Goblin.Collision.capsuleCapsule = ( function() {
    var innerSegmentStartA = new Goblin.Vector3();
    var innerSegmentEndA = new Goblin.Vector3();

    var innerSegmentStartB = new Goblin.Vector3();
    var innerSegmentEndB = new Goblin.Vector3();

    var closestPointA = new Goblin.Vector3();
    var closestPointB = new Goblin.Vector3();

    var directionA = new Goblin.Vector3();
    var directionB = new Goblin.Vector3();

    var startClipPoint = new Goblin.Vector3();
    var endClipPoint = new Goblin.Vector3();

    return function( objectA, objectB, doLightweightCollision ) {
        innerSegmentStartA.set( 0, objectA.shape.half_height, 0 );
        innerSegmentEndA.set( 0, -objectA.shape.half_height, 0 );
        objectA.transform.transformVector3( innerSegmentStartA );
        objectA.transform.transformVector3( innerSegmentEndA );

        innerSegmentStartB.set( 0, objectB.shape.half_height, 0 );
        innerSegmentEndB.set( 0, -objectB.shape.half_height, 0 );
        objectB.transform.transformVector3( innerSegmentStartB );
        objectB.transform.transformVector3( innerSegmentEndB );

        var distance = Math.sqrt( Goblin.GeometryMethods.findClosestPointsOnSegments( innerSegmentStartA, innerSegmentEndA, innerSegmentStartB, innerSegmentEndB, closestPointA, closestPointB ) );
        var radiiSum = objectA.shape.radius + objectB.shape.radius;
        // Two capsules overlap if the distance between their inner segments is less or equal
        // than the sum of their radii.
        if ( distance > radiiSum ) {
            return null;
        }

        // Once we have the closest points we can build virtual spheres around the closest
        // points again and think of this as sphere vs sphere.
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = objectA;
        contact.object_b = objectB;

        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        if ( distance < Goblin.EPSILON ) {
            // Capsules are coincident - set an arbitrary normal
            contact.contact_normal.set( 0, 1, 0 );
        } else {
            contact.contact_normal.subtractVectors( closestPointB, closestPointA );
            contact.contact_normal.normalize();
        }
        contact.penetration_depth = radiiSum - distance;

        directionA.subtractVectors( innerSegmentEndA, innerSegmentStartA );
        directionA.normalize();
        directionB.subtractVectors( innerSegmentEndB, innerSegmentStartB );
        directionB.normalize();

        // If two inner segment are parallel we need to generate two contact points in order to get a stable manifold.
        // Note that it's not a final decision yet, because we may have a sphere-sphere collision (spheres at the end of inner segments of capsules),
        // in which case we receive a contact point at the end of inner segment - it will do just fine by itself.
        var weProbablyNeedToGenerateTwoContactPoints = directionA.isParallelToNormalized( directionB );
        if ( !weProbablyNeedToGenerateTwoContactPoints ) {
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contact, closestPointA, closestPointB );
            return [ contact ];
        }

        // Clip objectB's inner segment with a planes located at the end of objectA's inner segment. Note that we use the same normal twice, so we need to negate
        // distance in the second case.
        var distanceToInnerSegmentStart = Goblin.GeometryMethods.findClosestPointToPlaneOnLineSegment( innerSegmentStartA, directionA, innerSegmentStartB, innerSegmentEndB, startClipPoint );
        var distanceToInnerSegmentEnd = -Goblin.GeometryMethods.findClosestPointToPlaneOnLineSegment( innerSegmentEndA, directionA, innerSegmentStartB, innerSegmentEndB, endClipPoint );

        if ( distanceToInnerSegmentStart < 0 || distanceToInnerSegmentEnd < 0 ) {
            // Inner segment of objectB is fully behind or in front of inner segment of objectA - we have a sphere vs sphere collision
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contact, closestPointA, closestPointB );
            return [ contact ];
        }

        var contactAtTheStart = contact;
        var contactAtTheEnd = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contactAtTheEnd.object_a = objectA;
        contactAtTheEnd.object_b = objectB;
        contactAtTheEnd.contact_normal.copy( contactAtTheStart.contact_normal );
        contactAtTheEnd.penetration_depth = contactAtTheStart.penetration_depth;

        if ( distanceToInnerSegmentStart === 0 ) {
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contactAtTheStart, innerSegmentStartA, startClipPoint );
        } else {
            closestPointA.scaleVector( directionA, distanceToInnerSegmentStart );
            closestPointA.add( innerSegmentStartA );
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contactAtTheStart, closestPointA, startClipPoint );
        }

        if ( distanceToInnerSegmentEnd === 0 ) {
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contactAtTheEnd, innerSegmentEndA, endClipPoint );
        } else {
            closestPointA.scaleVector( directionA, -distanceToInnerSegmentEnd );
            closestPointA.add( innerSegmentEndA );
            Goblin.Collision.capsuleCapsule._fillContactWithDetails( contactAtTheEnd, closestPointA, endClipPoint );
        }

        return [ contactAtTheStart, contactAtTheEnd ];
    };
} )();

/**
 * Fills all contact points details given closest points on inner segments of both objects and partially calculated contract.
 *
 * @param {Goblin.ContactDetails} contact
 * @param {Goblin.Vector3} closestPointA - closest point on inner segment for the objectA
 * @param {Goblin.Vector3} closestPointB - closest point on inner segment for the objectB
 */
Goblin.Collision.capsuleCapsule._fillContactWithDetails = function( contact, closestPointA, closestPointB ) {
    contact.contact_point_in_a.scaleVector( contact.contact_normal, contact.object_a.shape.radius );
    contact.contact_point_in_a.add( closestPointA );

    contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.object_b.shape.radius );
    contact.contact_point_in_b.add( closestPointB );

    contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
    contact.contact_point.scale( 0.5 );

    contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
    contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );
};