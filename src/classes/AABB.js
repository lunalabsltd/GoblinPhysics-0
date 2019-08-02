/**
 * @param {Goblin.Vector3=} min
 * @param {Goblin.Vector3=} max
 * @constructor
 */
Goblin.AABB = function( min, max ) {
    /**
     * @type {Goblin.Vector3}
     */
	this.min = min || new Goblin.Vector3();

    /**
     * @type {Goblin.Vector3}
     */
	this.max = max || new Goblin.Vector3();
};

Goblin.AABB.prototype.copy = function( aabb ) {
	this.min.x = aabb.min.x;
	this.min.y = aabb.min.y;
	this.min.z = aabb.min.z;

	this.max.x = aabb.max.x;
	this.max.y = aabb.max.y;
	this.max.z = aabb.max.z;
};

Goblin.AABB.prototype.combineAABBs = function( a, b ) {
	this.min.x = Math.min( a.min.x, b.min.x );
	this.min.y = Math.min( a.min.y, b.min.y );
	this.min.z = Math.min( a.min.z, b.min.z );

	this.max.x = Math.max( a.max.x, b.max.x );
	this.max.y = Math.max( a.max.y, b.max.y );
	this.max.z = Math.max( a.max.z, b.max.z );
};

Goblin.AABB.prototype.transform = (function(){
	var local_center = new Goblin.Vector3(),
        center = new Goblin.Vector3();

    // the algorithm for AABB (min-max variant) is taken from
    // Graphics Gems, 1999 (example at https://github.com/erich666/GraphicsGems/blob/master/gems/TransBox.c)
	return function( local_aabb, matrix ) {
        local_center.set( 0, 0, 0 );
        matrix.transformVector3Into( local_center, center );

        var amin = [ local_aabb.min.x, local_aabb.min.y, local_aabb.min.z ];
        var amax = [ local_aabb.max.x, local_aabb.max.y, local_aabb.max.z ];

        var bmin = [ center.x, center.y, center.z ];
        var bmax = [ center.x, center.y, center.z ];

        var m = [ matrix.e00, matrix.e01, matrix.e02, matrix.e10, matrix.e11, matrix.e12, matrix.e20, matrix.e21, matrix.e22 ];

        for( var i = 0; i < 3; i++ ) {
            for( var j = 0; j < 3; j++ ) {
                var a = m[ i * 3 + j ] * amin[j];
                var b = m[ i * 3 + j ] * amax[j];

                if ( a < b ) { 
                    bmin[i] += a; 
                    bmax[i] += b;
                } else { 
                    bmin[i] += b; 
                    bmax[i] += a;
                }
            }
        }

        this.min.set( bmin[0], bmin[1], bmin[2] );
        this.max.set( bmax[0], bmax[1], bmax[2] );
    };
})();

Goblin.AABB.prototype.intersects = function( aabb ) {
    if (
        this.max.x < aabb.min.x ||
        this.max.y < aabb.min.y ||
        this.max.z < aabb.min.z ||
        this.min.x > aabb.max.x ||
        this.min.y > aabb.max.y ||
        this.min.z > aabb.max.z
    )
    {
        return false;
    }

    return true;
};

/**
 * Checks if a ray segment intersects with this AABB
 *
 * @method testRayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {boolean}
 */
Goblin.AABB.prototype.testRayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		tmin, tmax,
		ood, t1, t2;

	return function AABB_testRayIntersect( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		var extent_min, extent_max;

        // Check X axis
        extent_min = this.min.x;
        extent_max = this.max.x;
        if ( Math.abs( direction.x ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.x < extent_min || start.x > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.x;
            t1 = ( extent_min - start.x ) * ood;
            t2 = ( extent_max - start.x ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Y axis
        extent_min = this.min.y;
        extent_max = this.max.y;
        if ( Math.abs( direction.y ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.y < extent_min || start.y > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.y;
            t1 = ( extent_min - start.y ) * ood;
            t2 = ( extent_max - start.y ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Z axis
        extent_min = this.min.z;
        extent_max = this.max.z;
        if ( Math.abs( direction.z ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.z < extent_min || start.z > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.z;
            t1 = ( extent_min - start.z ) * ood;
            t2 = ( extent_max - start.z ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

		return true;
	};
})();