/**
 * Works exactly like basic broadphase (and inherits from it), but keeps objects
 * in separate pools: static and moving ones. Static objects never collide with
 * each other.
 *
 * @class BasicPooledBroadphase
 * @constructor
 */
Goblin.BasicPooledBroadphase = function() {
    Goblin.BasicBroadphase.call( this );

    /**
     * Holds static collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.static_bodies = [];

    /**
     * Holds dynamic collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.dynamic_bodies = [];
};

// Set up inheritance
Goblin.BasicPooledBroadphase.prototype = Object.create( Goblin.BasicBroadphase.prototype );

/**
 * Gets the bodies that might be affected by physics (and thus need to be
 * integrated).
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.getDynamicBodies = function() {
    return this.dynamic_bodies;
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.addBody = function( body ) {
    Goblin.BasicBroadphase.prototype.addBody.call( this, body );
    
    if ( body.static ) {
        this.static_bodies.push( body );
    } else {
        this.dynamic_bodies.push( body );
    }
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.removeBody = function( body ) {
    Goblin.BasicBroadphase.prototype.addBody.call( this, body );

    if ( body.static ) {
        this._removeBodyFrom( body, this.static_bodies );
    } else {
        this._removeBodyFrom( body, this.dynamic_bodies );
    }
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method update
 */
Goblin.BasicBroadphase.prototype.update = function() {
    // local variables to make linter happy
    var i, j, object_a, object_b;

    // Clear any old contact pairs
    this.collision_pairs.length = 0;

    for ( i = 0; i < this.dynamic_bodies.length; i++ ) {
        object_a = this.dynamic_bodies[ i ];

        // check dynamic-dynamic collisions
        for ( j = i + 1; j < this.dynamic_bodies.length; j++ ) {
            object_b = this.dynamic_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }

        // check collisions with static bodies
        // FIXME EN-84 to use BVH here
        for ( j = 0; j < this.static_bodies.length; j++ ) {
            object_b = this.static_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }
    }
};
