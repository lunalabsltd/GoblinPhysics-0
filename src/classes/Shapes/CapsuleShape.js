/**
 * @param {number} radius capsule radius
 * @param {number} half_height half height of the capsule
 * @param {Goblin.PhysicMaterial|null} material physics material of the capsule
 * @constructor
 */
Goblin.CapsuleShape = function( radius, half_height, material ) {
    this.shape = Goblin.CapsuleShape;
    /**
     * radius of the capsule
     *
     * @type {number}
     */
    this.radius = radius;
    /**
     * half height of the capsule
     *
     * @type {number}
     */
    this.half_height = Math.abs( half_height );
    /**
     * @type {Goblin.PhysicMaterial|null}
     */
    this.material = material || null;
    /**
     * @type {Array<Goblin.Vector3>}
     */
    this.faceNormals = [];
    /**
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @param {Goblin.AABB} aabb
 */
Goblin.CapsuleShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = aabb.min.z = -this.radius;
    aabb.min.y = -this.half_height - this.radius;

    aabb.max.x = aabb.max.z = this.radius;
    aabb.max.y = this.half_height + this.radius;
};

/**
 * @param {number} mass
 * @returns {Goblin.Matrix3}
 */
Goblin.CapsuleShape.prototype.getInertiaTensor = function( mass ) {
    if ( -Goblin.EPSILON <= this.half_height && this.half_height <= Goblin.EPSILON ) {
        if ( -Goblin.EPSILON <= this.radius && this.radius <= Goblin.EPSILON ) {
            return new Goblin.Matrix3();
        }
        var element = 0.4 * mass * this.radius * this.radius;
        return new Goblin.Matrix3(
            element, 0, 0,
            0, element, 0,
            0, 0, element
        );
    }

    var k = 1.5 * this.half_height / this.radius;
    var ms = mass / ( 1 + k );
    var mc = mass / ( 1 + 1 / k );
    var r2 = this.radius * this.radius;
    var is = 0.4 * ms * r2;
    var ic = 0.0833 * mc * ( 3 * r2 + 4 * this.half_height * this.half_height );
    var i = is + ic + ms * ( 3 * this.radius + 4 * this.half_height ) * this.half_height / 4;

    return new Goblin.Matrix3(
        i, 0, 0,
        0, is + 0.5 * mc * r2, 0,
        0, 0, i
    );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param {Goblin.Vector3} direction - direction to use in finding the support point
 * @param {Goblin.Vector3} support_point - vec3 variable which will contain the supporting point after calling this method
 */
Goblin.CapsuleShape.prototype.findSupportPoint = function( direction, support_point ) {
    _tmp_vec3_1.normalizeVector( direction );
    support_point.scaleVector( _tmp_vec3_1, this.radius );
    support_point.y += Math.sign( direction.y ) * this.half_height;
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property {Goblin.Vector3} start - start point of the segment
 * @property {Goblin.Vector3} end - end point of the segment
 * @return {Goblin.RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CapsuleShape.prototype.rayIntersect = ( function() {
    var pa = new Goblin.Vector3();
    var pb = new Goblin.Vector3();
    var rd = new Goblin.Vector3();

    var ba = new Goblin.Vector3();
    var oa = new Goblin.Vector3();
    var oc = new Goblin.Vector3();

    /**
     * Copied from https://www.iquilezles.org/www/articles/intersectors/intersectors.htm, all variable names are preserved.
     * @param {Goblin.Vector3} ro - ray origin
     * @param {Goblin.Vector3} rd - ray direction
     * @param {Goblin.Vector3} pa - center point of the first sphere
     * @param {Goblin.Vector3} pb - center point of the second sphere
     * @param {Goblin.Vector3} ra - radius of spheres
     * @returns {number} t - such as ro + rd * t === intersection point
     */
    var rayIntersectInternal = function( ro, rd, pa, pb, ra ) {
        ba.subtractVectors( pb, pa );
        oa.subtractVectors( ro, pa );
        var baba = ba.dot( ba );
        var bard = ba.dot( rd );
        var baoa = ba.dot( oa );
        var rdoa = rd.dot( oa );
        var oaoa = oa.dot( oa );
        var a = baba - bard * bard;
        var b = baba * rdoa - baoa * bard;
        var c = baba * oaoa - baoa * baoa - ra * ra * baba;
        var h = b * b - a * c;

        if ( h >= 0 ) {
            var t = ( -b - Math.sqrt( h ) ) / a;
            var y = baoa + t * bard;
            // body
            if ( y > 0.0 && y < baba ) {
                return t;
            }

            // caps
            y <= 0 ? oc.copy( oa ) : oc.subtractVectors( ro, pb );
            b = rd.dot( oc );
            c = oc.dot( oc ) - ra * ra;
            h = b * b - c;
            if ( h > 0 ) {
                return -b - Math.sqrt( h );
            }
        }
        return -1;
    };

    /**
     * Calculates intersection normal given intersection point and params of the sphere.
     * @param {Goblin.Vector3} intersectionPoint
     * @param {Goblin.Vector3} pa - center point of the first sphere
     * @param {Goblin.Vector3} pb - center point of the the sphere
     * @param {number} ra - radius of spheres
     * @param {Goblin.Vector3} normal output variable
     */
    var calculateIntersectionNormal = function( intersectionPoint, pa, pb, ra, normal ) {
        ba.subtractVectors( pb, pa );
        pa.subtractVectors( intersectionPoint, pa );
        var h = Goblin.Math.Utils.clamp( pa.dot( ba ) / ba.dot( ba ), 0, 1 );

        normal.scaleVector( ba, -h );
        normal.add( pa );
        normal.scale( 1 / ra );
    };

    return function( start, end ) {
        pa.set( 0, this.half_height, 0 );
        pb.set( 0, -this.half_height, 0 );

        rd.subtractVectors( end, start );
        var tMax = rd.normalize();
        if ( Math.abs( tMax ) < Goblin.EPSILON ) {
            return null;
        }

        var t = rayIntersectInternal( start, rd, pa, pb, this.radius );
        if ( t < 0 || t > tMax ) {
            return null;
        }

        var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
        intersection.object = this;
        intersection.point.scaleVector( rd, t );
        intersection.point.add( start );
        intersection.t = t;
        calculateIntersectionNormal( intersection.point, pa, pb, this.radius, intersection.normal );

        return intersection;
    };
} )();