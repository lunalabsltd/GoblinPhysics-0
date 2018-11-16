/**
 * @class CapsuleShape
 * @param radius {Number} capsule radius
 * @param half_height {Number} half height of the capsule
 * @constructor
 */
Goblin.CapsuleShape = function( radius, half_height ) {
	/**
	 * radius of the capsule
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the capsule
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = Math.abs(half_height);

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CapsuleShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.z = -this.radius;
	aabb.min.y = -this.half_height - this.radius;

	aabb.max.x = aabb.max.z = this.radius;
	aabb.max.y = this.half_height + this.radius;
};

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
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.CapsuleShape.prototype.findSupportPoint = (function(){
	var temp = new Goblin.Vector3();
	return function( direction, support_point ) {
		temp.normalizeVector( direction );
		support_point.scaleVector( temp, this.radius );
		support_point.y += direction.y < 0 ? -this.half_height : this.half_height;
	};
})();

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CapsuleShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		length,
		k, a, c,
		py,
		discr, discr_sqrt,
		y1, y2, y4,
		t1, t2, t3, t4,
		intersection;

	function getIntersectionFromPoint( x, y, z, scale ) {
		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.point.set( x, y, z );
		intersection.t = scale;
		return intersection;
	}

	function getIntersectionFromDirection( start, scale ) {
		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.point.scaleVector( direction, scale );
		intersection.point.add( start );
		intersection.t = scale;
		return intersection;
	}

	return function( start, end ) {

		direction.subtractVectors( end, start );
		length = direction.length();
		direction.scale( 1 / length  ); // normalize direction

		a = direction.x * direction.x + direction.z * direction.z;
		c = start.x * start.x + start.z * start.z - this.radius * this.radius;

		if ( a <= Goblin.EPSILON ) { // segment runs parallel to capsule y axis
			if ( -Goblin.EPSILON <= c && c <= Goblin.EPSILON ) { // segment is on the side surface
				if ( start.y > this.half_height ) { // segment starts above top
					if ( end.y > this.half_height ) { // segment ends above top, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, this.half_height, start.z, start.y - this.half_height );
				} else if ( start.y < -this.half_height ) { // segment starts below bottom
					if ( end.y < -this.half_height ) { // segment ends below bottom, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, -this.half_height, start.z, -start.y - this.half_height );
				} else if ( end.y >= this.half_height ) { // segment starts between top and bottom and ends above top
					intersection = getIntersectionFromPoint( start.x, this.half_height, start.z, this.half_height - start.y );
				} else if ( end.y <= -this.half_height ) { // segment starts between top and bottom and ends below bottom
					intersection = getIntersectionFromPoint( start.x, -this.half_height, start.z, start.y + this.half_height );
				} else { // segment is fully included into capsule side surface
					return null // segment is fully inside
				}
			} else if ( c > 0 ) { // segment runs parallel to the capsule and fully outside
				return null;
			} else {
				py = this.half_height + Math.sqrt( -c ); // intersection point y absolute value

				if ( start.y > py ) { // segment starts above top
					if ( end.y > py ) { // segment ends above top, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, py, start.z, start.y - py );
				} else if ( start.y < -py ) { // segment starts below bottom
					if ( end.y < -py ) { // segment ends below bottom, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, -py, start.z, -py - start.y );
				} else { // segment starts between top and bottom
					if ( end.y >= py ) { // segment ends above top
						intersection = getIntersectionFromPoint( start.x, py, start.z, py - start.y );
					} else if ( end.y <= -py ) { // segment ends below bottom
						intersection = getIntersectionFromPoint( start.x, -py, start.z, start.y + py );
					} else { // segment ends between top and bottom, it's fully inside
						return null;
					}
				}
			}
		} else { // segment is not parallel to capsule y axis
			k = start.x * direction.x + start.z * direction.z;
			discr = k * k - a * c;

			if ( -Goblin.EPSILON <= discr && discr <= Goblin.EPSILON ) { // there is only one line and cylinder intersection
				t1 = -k / a;
				y1 = start.y + t1 * direction.y;
				if ( -this.half_height <= y1 && y1 <= this.half_height ) { // segment intersects capsule in a single point
					intersection = getIntersectionFromDirection( start, t1 );
				} else { // no intersections with the capsule
					return null;
				}
			}
			else if ( discr < 0 ) { // no intersections with cylinder containing capsule
				return null;
			}

			discr_sqrt = Math.sqrt( discr );
			t2 = ( -k + discr_sqrt ) / a; // t2 is farther away from start point than t1
			if ( t2 < 0 ) { // segment is pointing away from the capsule, no intersections
				return null;
			}
			t1 = ( -k - discr_sqrt ) / a;

			y1 = start.y + t1 * direction.y;
			if ( y1 > this.half_height ) { // line intersects cylinder above capsule top
				a += direction.y * direction.y;
				c += start.y * start.y + this.half_height * ( this.half_height - 2 * start.y );
				k += direction.y * ( start.y - this.half_height );
				discr = k * k - a * c;

				if ( discr <= 0 ) { // line doesn't intersect top sphere
					return null;
				}

				discr_sqrt = Math.sqrt( discr );
				t3 = ( -k - discr_sqrt ) / a; // line and top sphere intersection closest to start point

				if ( t3 >= 0 ) {
					intersection = getIntersectionFromDirection( start, t3 );
				} else { // segment is pointing away from the line and top sphere first intersection
					t4 = ( -k + discr_sqrt ) / a; // line and top sphere second intersection point
					y4 = start.y + t4 * direction.y;
					if ( y4 > this.half_height ) { // line and top sphere intersection happens on capsule surface
						intersection = getIntersectionFromDirection( start, t4 );
					} else { // line intersects bottom hemisphere of the top sphere
						y2 = start.y + t2 * direction.y; // line and cylinder second intersection point
						if ( y2 < -this.half_height ) { // line intersects cylinder below capsule bottom

							c += 4 * this.half_height * start.y;
							k += 2 * direction.y * this.half_height;
							discr = k * k - a * c;

							if ( discr < 0 ) { // line doesn't intersect bottom sphere, that should never happen
								return null;
							}

							discr_sqrt = Math.sqrt( discr );
							t4 = ( -k + discr_sqrt ) / a;

							if ( t4 < 0 ) { // segment is pointing away from bottom sphere, no intersections
								return null;
							}

							intersection = getIntersectionFromDirection( start, t4 );
						} else { // line intersects cylinder inside of the capsule
							intersection = getIntersectionFromDirection( start, t2 );
						}
					}
				}
			} else if ( y1 < -this.half_height ) { // line intersects cylinder below capsule bottom
				a += direction.y * direction.y;
				c += start.y * start.y + this.half_height * ( this.half_height + 2 * start.y );
				k += direction.y * ( start.y + this.half_height );
				discr = k * k - a * c;

				if ( discr < 0 ) { // line doesn't intersect bottom sphere
					return null;
				}

				discr_sqrt = Math.sqrt( discr );
				t3 = ( -k - discr_sqrt ) / a; // line and bottom sphere intersection closest to start point

				if ( t3 >= 0 ) {
					intersection = getIntersectionFromDirection( start, t3 );
				} else { // segment is pointing away from the line and bottom sphere first intersection
					t4 = ( -k + discr_sqrt ) / a; // line and bottom sphere second intersection point
					y4 = start.y + t4 * direction.y;
					if ( y4 < -this.half_height ) { // line and bottom sphere intersection happens on capsule surface
						intersection = getIntersectionFromDirection( start, t4 );
					} else { // line intersects top hemisphere of the bottom sphere
						y2 = start.y + t2 * direction.y; // line and cylinder second intersection point
						if ( y2 > this.half_height ) { // line intersects cylinder above capsule top

							c -= 4 * this.half_height * start.y;
							k -= 2 * direction.y * this.half_height;
							discr = k * k - a * c;

							if ( discr <= 0 ) { // line doesn't intersect top sphere, that should never happen
								return null;
							}

							discr_sqrt = Math.sqrt( discr );
							t4 = ( -k + discr_sqrt ) / a;

							if ( t4 < 0 ) { // segment is pointing away from top sphere, no intersections
								return null;
							}

							intersection = getIntersectionFromDirection( start, t4 );
						} else { // line intersects cylinder inside of the capsule
							intersection = getIntersectionFromDirection( start, t2 );
						}
					}
				}

			} else if ( t1 >= 0 ) { // line intersects capsule between top and bottom (first intersection point)
				intersection = getIntersectionFromDirection( start, t1 );
			} else { // segment is pointing away from line and capsule first intersection point
				y2 = start.y + t2 * direction.y; // line and capsule second intersection point
				if ( y2 > this.half_height ) { // line intersects cylinder above capsule top

					a += direction.y * direction.y;
					c += start.y * start.y + this.half_height * ( this.half_height - 2 * start.y );
					k += direction.y * ( start.y - this.half_height );
					discr = k * k - a * c;

					if ( discr < 0 ) { // line doesn't intersect top sphere, that should never happen
						return null;
					}

					discr_sqrt = Math.sqrt( discr );
					t4 = ( -k + discr_sqrt ) / a; // line and top sphere intersection point, the most distant from the start point

					if ( t4 < 0 ) { // segment is pointing away from the top sphere
						return null;
					}

					intersection = getIntersectionFromDirection( start, t4 );
				} else if ( y2 < -this.half_height ) { // line intersects cylinder below capsule bottom

					a += direction.y * direction.y;
					c += start.y * start.y + this.half_height * ( this.half_height + 2 * start.y );
					k += direction.y * ( start.y + this.half_height );
					discr = k * k - a * c;

					if ( discr < 0 ) { // line doesn't intersect bottom sphere, that should never happen
						return null;
					}

					discr_sqrt = Math.sqrt( discr );
					t4 = ( -k + discr_sqrt ) / a; // line and bottom intersection point, the most distant from the start point

					if ( t4 < 0 ) { // segment is pointing away from the bottom sphere
						return null;
					}

					intersection = getIntersectionFromDirection( start, t4 );
				} else { // line intersects capsule side surface
					intersection = getIntersectionFromDirection( start, t2 );
				}
			}
		}

		intersection.normal.x = intersection.point.x;
		intersection.normal.z = intersection.point.z;
		if ( intersection.point.y < -this.half_height ) {
			intersection.normal.y = intersection.point.y + this.half_height;
		} else if ( intersection.point.y > this.half_height ) {
			intersection.normal.y = intersection.point.y - this.half_height;
		} else {
			intersection.normal.y = 0;
		}
		intersection.normal.scale( 1 / this.radius );

		return intersection;
	};
})();