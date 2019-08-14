/**
 * @param half_width {Number} half width of the cube ( X axis )
 * @param half_height {Number} half height of the cube ( Y axis )
 * @param half_depth {Number} half depth of the cube ( Z axis )
 * @constructor
 */
Goblin.BoxShape = function( half_width, half_height, half_depth, material ) {
    this.shapeType = Goblin.Shapes.Type.BoxShape;
    /**
     * Half width of the cube ( X axis )
     *
     * @type {number}
     */
    this.half_width = half_width;
    /**
     * Half height of the cube ( Y axis )
     *
     * @type {number}
     */
    this.half_height = half_height;
    /**
     * Half width of the cube ( Z axis )
     *
     * @property half_height
     * @type {number}
     */
    this.half_depth = half_depth;
    /**
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );

    /**
     * @type {Goblin.Vector3[]}
     */
    this.faceNormals = [
        new Goblin.Vector3( 1, 0, 0 ),
        new Goblin.Vector3( -1, 0, 0 ),
        new Goblin.Vector3( 0, 1, 0 ),
        new Goblin.Vector3( 0, -1, 0 ),
        new Goblin.Vector3( 0, 0, 1 ),
        new Goblin.Vector3( 0, 0, -1 ),
    ];

    this.material = material || null;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param {Goblin.AABB} aabb
 */
Goblin.BoxShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = -this.half_width;
    aabb.min.y = -this.half_height;
    aabb.min.z = -this.half_depth;

    aabb.max.x = this.half_width;
    aabb.max.y = this.half_height;
    aabb.max.z = this.half_depth;
};

Goblin.BoxShape.prototype.getInertiaTensor = function( mass ) {
    var height_squared = this.half_height * this.half_height * 4,
        width_squared = this.half_width * this.half_width * 4,
        depth_squared = this.half_depth * this.half_depth * 4,
        element = 0.0833 * mass;
    return new Goblin.Matrix3(
        element * ( height_squared + depth_squared ), 0, 0,
        0, element * ( width_squared + depth_squared ), 0,
        0, 0, element * ( height_squared + width_squared )
    );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.BoxShape.prototype.findSupportPoint = function( direction, support_point ) {
    /*
    support_point = [
        sign( direction.x ) * half_width,
        sign( direction.y ) * half_height,
        sign( direction.z ) * half_depth
    ]
    */

    support_point.x = Math.sign( direction.x ) * this.half_width;
    support_point.y = Math.sign( direction.y ) * this.half_height;
    support_point.z = Math.sign( direction.z ) * this.half_depth;
};

/**
 * Checks if a ray segment intersects with the shape.
 * Inspired by https://medium.com/@bromanz/another-view-on-the-classic-ray-aabb-intersection-algorithm-for-bvh-traversal-41125138b525
 *
 * @property {Goblin.Vector3} start - start point of the segment
 * @property {Goblin.Vector3} end - end point of the segment
 * @return {Goblin.RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.BoxShape.prototype.rayIntersect = ( function() {
    var direction = new Goblin.Vector3();
    var invD = new Goblin.Vector3();
    var t0s = new Goblin.Vector3();
    var t1s = new Goblin.Vector3();
    var tSmaller = new Goblin.Vector3();
    var tBigger = new Goblin.Vector3();
    var tMin = 0;
    var tMax = 0;

    return function( start, end ) {
        direction.subtractVectors( end, start );
        tMin = 0;
        tMax = direction.normalize();
        invD.reciprocalOfVector( direction );

        t0s.subtractVectors( this.aabb.min, start );
        t0s.multiply( invD );

        t1s.subtractVectors( this.aabb.max, start );
        t1s.multiply( invD );

        tSmaller.pairwiseMinBetween( t0s, t1s );
        tBigger.pairwiseMaxBetween( t0s, t1s );

        tMin = Math.max( tMin, Math.max( tSmaller.x, Math.max( tSmaller.y, tSmaller.z ) ) );
        tMax = Math.min( tMax, Math.min( tBigger.x, Math.min( tBigger.y, tBigger.z ) ) );

        if ( tMin > tMax || tMax < 0 ) {
            return null;
        }

        var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
        intersection.object = this;
        intersection.t = tMin;
        intersection.point.scaleVector( direction, tMin );
        intersection.point.add( start );

        var max = Infinity;
        if ( this.half_width - Math.abs( intersection.point.x ) < max ) {
            intersection.normal.set( Math.sign( intersection.point.x ), 0, 0 );
            max = this.half_width - Math.abs( intersection.point.x );
        }
        if ( this.half_height - Math.abs( intersection.point.y ) < max ) {
            intersection.normal.set( 0, Math.sign( intersection.point.y ), 0 );
            max = this.half_height - Math.abs( intersection.point.y );
        }
        if ( this.half_depth - Math.abs( intersection.point.z ) < max ) {
            intersection.normal.set( 0, 0, Math.sign( intersection.point.z ) );
        }

        return intersection;
    };
} )();