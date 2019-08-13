/**
 * @param {Goblin.RigidBody} objectA
 * @param {Goblin.RigidBody} objectB
 * @param {boolean} doLightweightCollision
 * @returns {Goblin.ContactDetails[]|null}
 */
Goblin.Collision.sphereSphere = function( objectA, objectB, doLightweightCollision ) {
    // Cache positions of the spheres
    var positionA = objectA.position;
    var positionB = objectB.position;

    // Get the vector between the two objects
    _tmp_vec3_1.subtractVectors( positionB, positionA );
    var distanceBetweenCenters = _tmp_vec3_1.length();
    var radiiSum = objectA.shape.radius + objectB.shape.radius;

    // If the distance between the objects is greater than their combined radii
    // then they are not touching, continue processing the other possible contacts
    if ( distanceBetweenCenters > radiiSum ) {
        return null;
    }

    /**
     * @type {Goblin.ContactDetails}
     */
    var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
    contact.object_a = objectA;
    contact.object_b = objectB;

    if ( doLightweightCollision ) {
        contact.is_lightweight = true;
        return contact;
    }


    if ( distanceBetweenCenters < Goblin.EPSILON ) {
        // Spheres are coincident - set an arbitrary normal
        contact.contact_normal.set( 0, 1, 0 );
    } else {
        // Contact normal = the normalized difference of the center points
        // Because we already have the distance (vector magnitude), don't normalize
        // instead we will calculate this value manually
        contact.contact_normal.scaleVector( _tmp_vec3_1, 1 / distanceBetweenCenters );
    }

    // The penetration depth is simply the distance between center points minus the sum of sphere radii
    contact.penetration_depth = radiiSum - distanceBetweenCenters;

    // Contact points in both objects
    contact.contact_point_in_a.scaleVector( contact.contact_normal, contact.object_a.shape.radius );
    contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.object_b.shape.radius );

    // Actual contact point - between two surface points. We need to add objects' positions because contact points are in object's space.
    contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
    contact.contact_point.add( positionA );
    contact.contact_point.add( positionB );
    contact.contact_point.scale( 0.5 );

    return [ contact ];
};