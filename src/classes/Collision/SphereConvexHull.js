/**
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectA
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectB
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails[]|null}
 */
Goblin.Collision.sphereConvexHull = function( objectA, objectB, doLightweightCollision ) {
    var sphere;
    var convexHull;
    if ( objectA.shape.shapeType === Goblin.Shapes.Type.SphereShape ) {
        sphere = objectA;
        convexHull = objectB;
    } else {
        sphere = objectB;
        convexHull = objectA;
    }

    // If closestPointOnHull is not null then center of the sphere is lying outside the convex hull.
    // This can mean two things - either there is no collision at all or there is a shallow collision.
    var closestPointOnHull = Goblin.GjkEpa.findClosestPointOnObject( convexHull, sphere.position );
    return closestPointOnHull !== null ?
        Goblin.Collision.sphereConvexHull._shallowSphereConvexHull( sphere, convexHull, closestPointOnHull, doLightweightCollision ) :
        Goblin.Collision.sphereConvexHull._deepSphereConvexHull( sphere, convexHull, doLightweightCollision );
};

/**
 * Collision for shallow cases - center of the sphere is lying outside the convex hull.
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} sphere
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {Goblin.Vector3} closestPointOnHull
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails[]|null}
 */
Goblin.Collision.sphereConvexHull._shallowSphereConvexHull = ( function() {
    var directionToClosestPoint = new Goblin.Vector3();
    var collisionNormal = new Goblin.Vector3();

    return function( sphere, convexHull, closestPointOnHull, doLightweightCollision ) {
        directionToClosestPoint.subtractVectors( closestPointOnHull, sphere.position );
        var distance = collisionNormal.normalizeVector( directionToClosestPoint );
        if ( distance > sphere.shape.radius ) {
            return null;
        }

        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = sphere;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        contact.penetration_depth = sphere.shape.radius - distance;
        contact.contact_normal.copy( collisionNormal );

        contact.contact_point_in_a.scaleVector( collisionNormal, sphere.shape.radius );
        contact.contact_point_in_a.add( sphere.position );

        contact.contact_point_in_b.copy( closestPointOnHull );

        contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
        contact.contact_point.scale( 0.5 );

        sphere.transform_inverse.transformVector3( contact.contact_point_in_a );
        convexHull.transform_inverse.transformVector3( contact.contact_point_in_b );

        return [ contact ];
    };
} )();


/**
 * Collision for deep cases - center of the sphere is lying inside the convex hull.
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} sphere
 * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} convexHull
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails|null}
 */
Goblin.Collision.sphereConvexHull._deepSphereConvexHull = ( function() {
    return function( sphere, convexHull, doLightweightCollision ) {
        var minimumProjection = Goblin.Collision.SAT.performSat( sphere, convexHull );
        if ( minimumProjection === null ) {
            return null;
        }

        /**
         * @type {Goblin.ContactDetails}
         */
        var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
        contact.object_a = sphere;
        contact.object_b = convexHull;
        if ( doLightweightCollision ) {
            contact.is_lightweight = true;
            return [ contact ];
        }

        contact.penetration_depth = minimumProjection.overlap;
        contact.contact_normal.scaleVector( minimumProjection.normal, -1 );

        contact.contact_point_in_a.scaleVector( contact.contact_normal, sphere.shape.radius );
        contact.contact_point_in_a.add( sphere.position );

        contact.contact_point_in_b.scaleVector( minimumProjection.normal, minimumProjection.overlap - sphere.shape.radius );
        contact.contact_point_in_b.add( sphere.position );

        contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
        contact.contact_point.scale( 0.5 );

        sphere.transform_inverse.transformVector3( contact.contact_point_in_a );
        convexHull.transform_inverse.transformVector3( contact.contact_point_in_b );

        return [ contact ];
    };
} )();