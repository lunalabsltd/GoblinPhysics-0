/**
 * @class ConeShape
 * @param radius {Number} radius of the cylinder
 * @param half_height {Number} half height of the cylinder
 * @constructor
 */
Goblin.ConeShape = function( radius, half_height ) {
	/**
	 * radius of the cylinder
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the cylinder
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );

	/**
	 * sin of the cone's angle
	 *
	 * @property _sinagle
	 * @type {Number}
	 * @private
	 */
	this._sinangle = this.radius / Math.sqrt( this.radius * this.radius + Math.pow( 2 * this.half_height, 2 ) );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.ConeShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min[0] = aabb.min[2] = -this.radius;
    aabb.min[1] = -this.half_height;

    aabb.max[0] = aabb.max[2] = this.radius;
    aabb.max[1] = this.half_height;
};

Goblin.ConeShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.1 * mass * Math.pow( this.half_height * 2, 2 ) + 0.15 * mass * this.radius * this.radius;

	return mat3.createFrom(
		element, 0, 0,
		0, 0.3 * mass * this.radius * this.radius, 0,
		0, 0, element
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
Goblin.ConeShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	 support_point = [

	 ]
	 */

	// Calculate the support point in the local frame
	//var w = direction - ( direction[1] )
	var sigma = Math.sqrt( direction[0] * direction[0] + direction[2] * direction[2] );

	if ( direction[1] > vec3.length( direction ) * this._sinangle ) {
		support_point[0] = support_point[2] = 0;
		support_point[1] = this.half_height;
	} else if ( sigma > 0 ) {
		var r_s = this.radius / sigma;
		support_point[0] = r_s * direction[0];
		support_point[1] = -this.half_height;
		support_point[2] = r_s * direction[2];
	} else {
		support_point[0] = support_point[2] = 0;
		support_point[1] = -this.half_height;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.ConeShape.prototype.rayIntersect = (function(){
	var direction = vec3.create(),
		length;

	return function( start, end ) {
		vec3.subtract( end, start, direction );
		length = vec3.length( direction );
		vec3.scale( direction, 1 / length ); // normalize direction

		var cosangle = Math.cos( Math.asin( this._sinangle ) ),
			point = null,
			points = [];

		var A = vec3.createFrom( 0, -1, 0 );

		var AdD = vec3.dot( A, direction ),
			cosSqr = cosangle * cosangle;

		var E = vec3.create();
		E[0] = start[0];
		E[1] = start[1] - this.half_height;
		E[2] = start[2];

		var AdE = vec3.dot( A, E ),
			DdE = vec3.dot( direction, E ),
			EdE = vec3.dot( E, E ),
			c2 = AdD * AdD - cosSqr,
			c1 = AdD * AdE - cosSqr * DdE,
			c0 = AdE * AdE - cosSqr * EdE,
			dot, t;

		if ( Math.abs( c2 ) >= Goblin.EPSILON ) {
			var discr = c1 * c1 - c0 * c2;
			if ( discr < 0 ) {
				return null;
			} else if ( discr > Goblin.EPSILON ) {
				var root = Math.sqrt( discr ),
					invC2 = 1 / c2,
					quantity = 0;

				t = ( -c1 - root ) * invC2;
				point = vec3.create();
				vec3.scale( direction, t, point );
				vec3.add( point, start );
				E[1] = point[1] - this.half_height;
				dot = vec3.dot( E, A );
				if ( dot >= 0 ) {
					points.push( point );
				}

				t = ( -c1 + root ) * invC2;
				point = vec3.create();
				vec3.scale( direction, t, point );
				vec3.add( point, start );
				E[1] = point[1] - this.half_height;
				dot = vec3.dot( E, A );
				if ( dot >= 0 ) {
					points.push( point );
				}

				if ( points.length === 0 ) {
					return null;
				}
			} else {
				t = c1 / c2;
				point = vec3.create();
				vec3.scale( direction, t, point );
				vec3.subtract( start, point, point );
				E[1] = point[1] - this.half_height;
				dot = vec3.dot( E, A );
				if ( dot >= 0 ) {
					points.push( point );
				} else {
					return null;
				}
			}
		} else if ( Math.abs( c1 ) >= Goblin.EPSILON ) {
			t = 0.5 * c0 / c1;
			point = vec3.create();
			vec3.scale( direction, t, point );
			vec3.add( point, start );
			E[1] = point[1] - this.half_height;
			dot = vec3.dot( E, A );
			if ( dot >= 0 ) {
				points.push( point );
			} else {
				return null;
			}
		} else if ( Math.abs( c0 ) >= Goblin.EPSILON) {
			return null;
		} else {
			point = vec3.create();
			point[1] = this.half_height;
			points.push( point );
		}

		console.log( points );

		/*var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		vec3.scale( direction, t, intersection.point );
		vec3.add( intersection.point, start );

		return intersection;*/
	};
})();