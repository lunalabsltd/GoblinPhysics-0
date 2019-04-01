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

    /**
     * Holds kinematic collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.kinematic_bodies = [];

    /**
     * Holds 32 layers of objects
     *
     * @property _layers
     * @type {Array}
     * @private
     */
    this._layers = new Array(32);

    // set up empty arrays for each layer
    for ( var i = 0; i < 32; i++ ) {
        this._layers[ i ] = [];
    }
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
 * Updates body's collision layer
 *
 * @method updateObjectLayer
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param new_layer  {Number} New layer that is about to be set
 */
Goblin.BasicBroadphase.prototype.updateObjectLayer = function ( rigid_body, new_layer ) {
    if ( rigid_body._layer !== null && this._layers[ rigid_body._layer ] ) {
        this._removeBodyFrom( rigid_body, this._layers[ rigid_body._layer ] );
    }

    if ( new_layer !== null ) {
        this._layers[ new_layer ].push( rigid_body );
    }
};

/**
 * Returns the pool the object belongs to (dynamic, static or kinematic).
 *
 * @method _getBodyPool
 * @param rigid_body {Goblin.RigidBody} Rigid body to get the pool for
 */
Goblin.BasicBroadphase.prototype._getBodyPool = function ( rigid_body ) {
    if ( rigid_body._is_static ) {
        return this.static_bodies;
    } else if ( rigid_body._is_kinematic ) {
        return this.kinematic_bodies;
    } else {
        return this.dynamic_bodies;
    }
};

Goblin.BasicBroadphase.prototype.markDynamic = function ( rigid_body ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    this.dynamic_bodies.push( rigid_body );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectStaticFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object should belong to static phase
 */
Goblin.BasicBroadphase.prototype.updateObjectStaticFlag = function ( rigid_body, is_static ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    rigid_body._is_static = is_static;
    this._getBodyPool( rigid_body ).push( rigid_body );
};

/**
 * Updates body's kinematic flag
 *
 * @method updateObjectKinematicFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object should belong to kinematic phase
 */
Goblin.BasicBroadphase.prototype.updateObjectKinematicFlag = function ( rigid_body, is_kinematic ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    rigid_body._is_kinematic = is_kinematic;
    this._getBodyPool( rigid_body ).push( rigid_body );
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.addBody = function( body ) {
    // call inherited logic
    Goblin.BasicBroadphase.prototype.addBody.call( this, body );
    
    // add the body to a proper pool
    this._getBodyPool( body ).push( body );

    // if the layer is set, add the body to a proper layer
    if ( body._layer !== null ) {
        this._layers[ body._layer ].push( body );
    }
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @param start         {vec3}      Start point of the segment
 * @param end           {vec3}      End point of the segment
 * @param limit         {Number}    Limit the amount of intersections (i.e. 1)
 * @param layerMask     {Number}    The bitmask of layers to check
 * @return {Array<RayIntersection>} an unsorted array of intersections
 */
Goblin.BasicPooledBroadphase.prototype.rayIntersect = (function () {
    // FIXME EN-77 should eliminate the below
    var _start = new Goblin.Vector3();
    var _end = new Goblin.Vector3();

    return function( start, end, limit, layerMask ) {
        // copy vector values over to allow for duck typing
        _start.copy( start );
        _end.copy( end );

        var intersections = [];

        for ( var i = 0; i < this._layers.length; i++ ) {
            var objects = this._layers[ i ];

            if ( layerMask && ( layerMask & (1 << i) ) === 0 ) {
                continue;
            }

            for ( var j = 0; j < objects.length; j++ ) {
                var body = objects[ j ];

                // first test AABB intersection (~ broad phase)
                if ( body.aabb.testRayIntersect( _start, _end ) ) {
                    // if AABB intersects, as the body about inner intersections
                    body.rayIntersect( _start, _end, limit, intersections );
                }

                if ( limit && ( intersections.length >= limit ) ) {
                    return intersections.slice( 0, limit );
                }
            }
        }

        intersections.sort( function ( a, b ) {
            return a.t - b.t;
        } );

        return intersections;
    };
})();

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.removeBody = function( body ) {
    // call inherited logic
    Goblin.BasicBroadphase.prototype.removeBody.call( this, body );
    // remove body from a speicifc pool
    this._removeBodyFrom( body, this._getBodyPool( body ) );
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method update
 */
Goblin.BasicPooledBroadphase.prototype.update = function() {
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

        // check collisions with kinematic bodies
        // FIXME EN-84 to use BVH here
        for ( j = 0; j < this.kinematic_bodies.length; j++ ) {
            object_b = this.kinematic_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }
    }
};
