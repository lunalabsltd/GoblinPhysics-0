/**
 * Performs a n^2 check of all collision objects to see if any could be in contact
 *
 * @class BasicBroadphase
 * @constructor
 */
Goblin.BasicBroadphase = function() {
	/**
	 * Holds all of the collision objects that the broadphase is responsible for
	 *
	 * @property bodies
	 * @type {Array}
	 */
	this.bodies = [];

	/**
	 * Array of all (current) collision pairs between the broadphases' bodies
	 *
	 * @property collision_pairs
	 * @type {Array}
	 */
	this.collision_pairs = [];
};

/**
 * Gets the bodies that might be affected by physics (and thus need to be
 * integrated).
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.getDynamicBodies = function() {
	return this.bodies;
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.addBody = function( body ) {
	this.bodies.push( body );
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.removeBody = function( body ) {
	this._removeBodyFrom( body, this.bodies );
};

/**
 * Removes a body from the the given array.
 *
 * @method removeBody
 * @param body {RigidBody} body to remove
 */
Goblin.BasicBroadphase.prototype._removeBodyFrom = function ( body, bodies ) {
	var i, body_count = bodies.length;

	for ( i = 0; i < body_count; i++ ) {
		if ( bodies[ i ] === body ) {
			// we don't care about the order, so just copy last element into
			// body's slot and call pop (which is fastest way to remove the element
			// from an array as per https://jsperf.com/pop-vs-shift-to-remove-elements-from-array)
			bodies[ i ] = bodies[ bodies.length - 1 ];
			bodies.pop();
			break;
		}
	}
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method update
 */
Goblin.BasicBroadphase.prototype.update = function() {
	var i, j,
		object_a, object_b,
		bodies_count = this.bodies.length;

	// Clear any old contact pairs
	this.collision_pairs.length = 0;

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_a = this.bodies[i];

		for ( j = 0; j < bodies_count; j++ ) {
			if ( i <= j ) {
				// if i < j then we have already performed this check
				// if i === j then the two objects are the same and can't be in contact
				continue;
			}

			object_b = this.bodies[j];

			if( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
				if ( object_a.aabb.intersects( object_b.aabb ) ) {
					this.collision_pairs.push( [ object_b, object_a ] );
				}
			}
		}
	}
};

/**
 * Returns an array of objects the given body may be colliding with
 *
 * @method intersectsWith
 * @param object_a {RigidBody}
 * @return Array<RigidBody>
 */
Goblin.BasicBroadphase.prototype.intersectsWith = function( object_a ) {
	var i, object_b,
		bodies_count = this.bodies.length,
		intersections = [];

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_b = this.bodies[i];

		if ( object_a === object_b ) {
			continue;
		}

		if ( object_a.aabb.intersects( object_b.aabb ) ) {
			intersections.push( object_b );
		}
	}

	return intersections;
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {Array<RayIntersection>} an unsorted array of intersections
 */
Goblin.BasicBroadphase.prototype.rayIntersect = function( start, end ) {
	var bodies_count = this.bodies.length,
		i, body,
		intersections = [];
	for ( i = 0; i < bodies_count; i++ ) {
		body = this.bodies[i];
		if ( body.aabb.testRayIntersect( start, end ) ) {
			body.rayIntersect( start, end, intersections );
		}
	}

	return intersections;
};