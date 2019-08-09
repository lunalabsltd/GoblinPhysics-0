/**
 * @param {number} radius sphere radius
 * @param {Goblin.PhysicMaterial|null} material
 * @constructor
 */
Goblin.SphereShape = function( radius, material ) {
    this.shape = Goblin.SphereShape;
    /**
     * @type {number}
     */
    this.radius = radius;
    /**
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();
    /**
     * @type {Goblin.PhysicMaterial|null}
     */
    this.material = material || null;
    /**
     * @type {Array<Goblin.Vector3>}
     */
    this.faceNormals = [];

    this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @param {Goblin.AABB} aabb
 */
Goblin.SphereShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = aabb.min.y = aabb.min.z = -this.radius;
    aabb.max.x = aabb.max.y = aabb.max.z = this.radius;
};

/**
 * @param {number} mass
 * @returns {Goblin.Matrix3}
 */
Goblin.SphereShape.prototype.getInertiaTensor = function( mass ) {
    var element = 0.4 * mass * this.radius * this.radius;
    return new Goblin.Matrix3(
        element, 0, 0,
        0, element, 0,
        0, 0, element
    );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @param {Goblin.Vector3} direction direction to use in finding the support point
 * @param {Goblin.Vector3} support_point vec3 variable which will contain the supporting point after calling this method
 */
Goblin.SphereShape.prototype.findSupportPoint = function( direction, support_point ) {
    _tmp_vec3_1.normalizeVector( direction );
    support_point.scaleVector( _tmp_vec3_1, this.radius );
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @param {Goblin.Vector3} start - start point of the segment
 * @param {Goblin.Vector3} end - end point of the segment
 * @return {Goblin.RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.SphereShape.prototype.rayIntersect = ( function() {
    var direction = new Goblin.Vector3();
    var length;

    return function( start, end ) {
        direction.subtractVectors( end, start );
        length = direction.length();
        if ( Math.abs( length ) < Goblin.EPSILON ) {
            return null;
        }

        direction.scale( 1 / length ); // normalize direction

        var a = start.dot( direction );
        var b = start.lengthSquared() - this.radius * this.radius;

        // if ray starts outside of sphere and points away, exit
        if ( a >= 0 && b >= 0 ) {
            return null;
        }

        var discr = a * a - b;

        // Check for ray miss
        if ( discr < 0 ) {
            return null;
        }

        // ray intersects, find closest intersection point
        var discr_sqrt = Math.sqrt( discr );
        var t = -a - discr_sqrt;
        if ( t < 0 ) {
            t = -a + discr_sqrt;
        }

        // verify the segment intersects
        if ( t > length ) {
            return null;
        }

        var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
        intersection.object = this;
        intersection.point.scaleVector( direction, t );
        intersection.point.add( start );
        intersection.t = t;
        intersection.normal.normalizeVector( intersection.point );

        return intersection;
    };
} )();