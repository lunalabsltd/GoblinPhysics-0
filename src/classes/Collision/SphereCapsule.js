/**
 * @param {Goblin.RigidBody} objectA
 * @param {Goblin.RigidBody} objectB
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails|null}
 */
Goblin.Collision.sphereCapsule = ( function() {
    var firstCenterPoint = new Goblin.Vector3();
    var secondCenterPoint = new Goblin.Vector3();

    return function( objectA, objectB, doLightweightCollision ) {
        var sphere;
        var capsule;
        if ( objectA.shape.shape === Goblin.SphereShape ) {
            sphere = objectA;
            capsule = objectB;
        } else {
            sphere = objectB;
            capsule = objectA;
        }

        firstCenterPoint.set( 0, capsule.shape.half_height, 0 );
        secondCenterPoint.set( 0, -capsule.shape.half_height, 0 );
        capsule.transform.transformVector3( firstCenterPoint );
        capsule.transform.transformVector3( secondCenterPoint );

        var closestPointOnInnerSegment = Goblin.GeometryMethods.findClosestPointOnASegment( firstCenterPoint, secondCenterPoint, sphere.position );
        var distanceToClosestPoint = closestPointOnInnerSegment.distanceTo( sphere.position );

        // The sphere overlaps the capsule if the distance of the sphere center to the closest
        // point on the inner capsule segment is less or equal than the sum of the radii.
        var penetrationDepth = sphere.shape.radius + capsule.shape.radius - distanceToClosestPoint;
        if ( penetrationDepth < 0 ) {
            return null;
        }

        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = sphere;
        contact.object_b = capsule;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return contact;
        }

        contact.penetration_depth = penetrationDepth;

        contact.contact_normal.subtractVectors( closestPointOnInnerSegment, sphere.position );
        var contactNormalLength = contact.contact_normal.length();
        if ( Math.abs( contactNormalLength ) < Goblin.EPSILON ) {
            // Shapes are coincident - set an arbitrary normal
            contact.contact_normal.set( 0, 1, 0 );
        } else {
            contact.contact_normal.scale( 1 / contactNormalLength );
        }

        // At this stage contact_point_in_a is a contact point in world's space
        contact.contact_point_in_a.copy( contact.contact_normal );
        contact.contact_point_in_a.scale( sphere.shape.radius );
        contact.contact_point_in_a.add( sphere.position );

        // contact_point_in_b is a contact point in capsule in world's space
        contact.contact_point_in_b.copy( contact.contact_normal );
        contact.contact_point_in_b.scale( -capsule.shape.radius );
        contact.contact_point_in_b.add( closestPointOnInnerSegment );

        contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
        contact.contact_point.scale( 0.5 );

        sphere.transform_inverse.transformVector3( contact.contact_point_in_a );
        capsule.transform_inverse.transformVector3( contact.contact_point_in_b );

        return contact;
    };
} )();