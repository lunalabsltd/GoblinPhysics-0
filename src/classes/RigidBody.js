/**
 * Represents a rigid body
 *
 * @constructor
 * @param {object} shape
 * @param {number} mass
 */
Goblin.RigidBody = function( shape, mass ) {
    /**
     * goblin ID of the body
     *
     * @property id
     * @type {Number}
     */
    this.id = Goblin.RigidBody._uid++;

    /**
     * body version that changes upon significant updates (collider movements,
     * additions and deletions)
     *
     * @property version
     * @type {Number}
     */
    this.version = 0;

    /**
     * shape definition for this rigid body
     *
     * @type {object}
     */
    this.shape = shape;

    /**
     * axis-aligned bounding box enclosing this body
     *
     * @property aabb
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();

    /**
     * the rigid body's mass
     *
     * @property mass
     * @type {Number}
     * @default Infinity
     */
    this._mass = mass || Infinity;
    this._mass_inverted = 1 / mass;

    /**
     * the flag indicating the body is static
     *
     * @private
     * @type {Boolean}
     * @default false
     */
    this._is_static = false;

    /**
     * the flag indicating the body is kinematic
     *
     * @property
     * @type {Boolean}
     * @default false
     */
    this._is_kinematic = false;

    /**
     * the flag indicating the body is affected by gravity
     *
     * @property
     * @type {Boolean}
     * @default false
     */
    this.use_gravity = true;

    /**
     * the rigid body's current position
     *
     * @property position
     * @type {Goblin.Vector3}
     * @default [ 0, 0, 0 ]
     */
    this.position = new Goblin.Vector3();

    /**
     * rotation of the rigid body
     *
     * @type {Goblin.Quaternion}
     */
    this.rotation = new Goblin.Quaternion( 0, 0, 0, 1 );

    /**
     * the rigid body's current linear velocity
     *
     * @property linear_velocity
     * @type {Goblin.Vector3}
     */
    this.linear_velocity = new Goblin.Vector3();

    /**
     * the rigid body's current angular velocity
     *
     * @property angular_velocity
     * @type {Goblin.Vector3}
     */
    this.angular_velocity = new Goblin.Vector3();

    /**
     * transformation matrix transforming points from object space to world space
     *
     * @property transform
     * @type {Goblin.Matrix4}
     */
    this.transform = new Goblin.Matrix4();
    this.transform.identity();

    /**
     * transformation matrix transforming points from world space to object space
     *
     * @property transform_inverse
     * @type {Goblin.Matrix4}
     */
    this.transform_inverse = new Goblin.Matrix4();
    this.transform_inverse.identity();

    this._computeInertiaTensor();

    this.inverseInertiaTensor = new Goblin.Matrix3();
    this.inertiaTensor.invertInto( this.inverseInertiaTensor );

    this.inertiaTensorWorldFrame = new Goblin.Matrix3();

    this.inverseInertiaTensorWorldFrame = new Goblin.Matrix3();

    /**
     * the rigid body's current acceleration
     *
     * @property acceleration
     * @type {Goblin.Vector3}
     */
    this.acceleration = new Goblin.Vector3();

    /**
     * amount of restitution this object has
     *
     * @property restitution
     * @type {Number}
     */
    this.restitution = 0.0;

    /**
     * amount of friction this object has
     *
     * @property friction
     * @type {Number}
     */
    this.friction = 0.6;

    /**
     * the rigid body's custom gravity
     *
     * @property gravity
     * @type {Goblin.Vector3}
     * @private
     */
    this.gravity = null;

    /**
     * the rigid body's custom linear acceleration
     *
     * @property acceleration
     * @type {Goblin.Vector3}
     * @private
     */
    this.linear_acceleration = new Goblin.Vector3();

    /**
     * the rigid body's custom angular acceleration
     *
     * @property acceleration
     * @type {Goblin.Vector3}
     * @private
     */
    this.angular_acceleration = new Goblin.Vector3();

    /**
     * proportion of linear velocity lost per second ( 0.0 - 1.0 )
     *
     * @property linear_damping
     * @type {Number}
     */
    this.linear_damping = 0;

    /**
     * proportion of angular velocity lost per second ( 0.0 - 1.0 )
     *
     * @property angular_damping
     * @type {Number}
     */
    this.angular_damping = 0;

    /**
     * multiplier of linear force applied to this body
     *
     * @property linear_factor
     * @type {Goblin.Vector3}
     */
    this.linear_factor = new Goblin.Vector3( 1, 1, 1 );

    /**
     * multiplier of angular force applied to this body
     *
     * @property angular_factor
     * @type {Goblin.Vector3}
     */
    this.angular_factor = new Goblin.Vector3( 1, 1, 1 );

    /**
     * Position of center of mass for this body
     *
     * @property center_of_mass
     * @type {Goblin.Vector3}
     */
    this.center_of_mass = new Goblin.Vector3( 0, 0, 0 );

    /**
     * the world to which the rigid body has been added,
     * this is set when the rigid body is added to a world
     *
     * @property world
     * @type {Goblin.World}
     * @default null
     */
    this.world = null;

    /**
     * the layer the object belongs to.
     *
     * @property layer
     * @type {any}
     * @default null
     * @private
     */
    this._layer = null;

    /**
     * all resultant force accumulated by the rigid body
     * this force is applied in the next occurring integration
     *
     * @property accumulated_force
     * @type {Goblin.Vector3}
     * @private
     */
    this.accumulated_force = new Goblin.Vector3();

    /**
     * All resultant torque accumulated by the rigid body
     * this torque is applied in the next occurring integration
     *
     * @property accumulated_force
     * @type {Goblin.Vector3}
     * @private
     */
    this.accumulated_torque = new Goblin.Vector3();

    /**
     * World transform of the body (which might differ from center-of-mass transform)
     */
    this._world_transform = new Goblin.Matrix4();

    // Used by the constraint solver to determine what impulse needs to be added to the body
    this.push_velocity = new Goblin.Vector3();
    this.turn_velocity = new Goblin.Vector3();
    this.solver_impulse = new Float64Array( 6 );

    // Speculative contact listener
    this.onSpeculativeContact = null;

    /**
     * @type {boolean}
     */
    this.is_trigger = false;

    this.listeners = {};

    // Callbacks for physics adapter
    /**
     * @type {Function}
     */
    this.onTriggerContactEnter = null;
    /**
     * @type {Function}
     */
    this.onCollisionContactEnter = null;
    /**
     * @type {Function}
     */
    this.onCollisionContactStay = null;
    /**
     * @type {Function}
     */
    this.onCollisionContactExit = null;
};

Goblin.RigidBody._uid = 0;

Goblin.EventEmitter.apply( Goblin.RigidBody );

Object.defineProperty(
    Goblin.RigidBody.prototype,
    'mass',
    {
        get: function() {
            return this._mass;
        },
        set: function( n ) {
            this._mass = n;
            this._mass_inverted = 1 / n;
            this.updateShapeDerivedValues();
        }
    }
);

/**
 * Gets or sets body's kinematic flag hinting the solver the body doesn't obey
 * physics forces, but can be moved externally.
 *
 * @property is_kinematic
 */
Object.defineProperty(
    Goblin.RigidBody.prototype,
    'is_kinematic',
    {
        get: function() {
            return this._is_kinematic;
        },
        set: function( value ) {
            if ( value !== this._is_kinematic ) {
                if ( this.world ) {
                    this.world.updateObjectKinematicFlag( this, value );
                }

                this._is_kinematic = value;
            }

            this.updateShapeDerivedValues();
        }
    }
);

/**
 * Gets or sets body's layer, which allows for fine-tuning collisions.
 *
 * @property layer
 */
Object.defineProperty(
    Goblin.RigidBody.prototype,
    'layer',
    {
        get: function() {
            return this._layer;
        },
        set: function( value ) {
            if ( value !== this._layer ) {
                if ( this.world ) {
                    this.world.updateObjectLayer( this, value );
                }

                this.version++;
                this._layer = value;
            }
        }
    }
);

/**
 * Gets or sets body's static flag indicating it should be considered
 * "rarely" moved and can be excluded from static-static collision pairs.
 *
 * @property is_static
 */
Object.defineProperty(
    Goblin.RigidBody.prototype,
    'is_static',
    {
        get: function() {
            return this._is_static;
        },
        set: function( value ) {
            if ( value !== this._is_static ) {
                if ( this.world ) {
                    this.world.updateObjectStaticFlag( this, value );
                }

                this._is_static = value;
            }
        }
    }
);

Goblin.RigidBody.prototype.markDynamic = function() {
    this.world.broadphase.markDynamic( this );
};

/**
 * Updates body's position and rotation from arguments supplied.
 *
 * @method setTransform
 * @param position {Goblin.Vector3} position variable to set
 * @param rotation {Goblin.Quaternion} rotation variable to set
 */
Goblin.RigidBody.prototype.setTransform = function( position, rotation ) {
    // thanks god it's rigid - rotation is the same across any point
    this.rotation.copy( rotation );

    // but, center of mass can be offset - we need to account for that
    this.rotation.transformVector3Into( this.center_of_mass, _tmp_vec3_1 );
    this.position.copy( position );
    this.position.add( _tmp_vec3_1 );
};

/**
 * Extracts body's position and rotation into arguments supplied.
 *
 * @method getTransform
 * @param position {Goblin.Vector3} position variable to update
 * @param rotation {Goblin.Quaternion} rotation variable to update
 */
Goblin.RigidBody.prototype.getTransform = function( position, rotation ) {
    this.updateDerived();

    // thanks god it's rigid - rotation is the same across any point
    rotation.copy( this.rotation );

    // but, center of mass can be offset - we need to account for that
    this.rotation.transformVector3Into( this.center_of_mass, _tmp_vec3_1 );
    position.copy( this.position );
    position.sub( _tmp_vec3_1 );
};

/**
 * Updates bodies' derived values to reflect changes in shape (i.e. new children in compound shape).
 *
 * @method updateShapeDerivedValues
 */
Goblin.RigidBody.prototype.updateShapeDerivedValues = function() {
    // update body version
    this.version++;

    if ( !this.shape.center_of_mass ) {
        this._computeInertiaTensor();
        return;
    }

    // re-calc center of mass
    this.shape.updateCenterOfMass();

    // Update AABB
    this.shape.updateAABB();
    this.aabb.transform( this.shape.aabb, this.transform );

    this._computeInertiaTensor();

    // compute the vector of CoM offset
    _tmp_vec3_1.copy( this.shape.center_of_mass );
    _tmp_vec3_1.subtract( this.center_of_mass );

    // rotate the vector with body's rotation
    this.rotation.transformVector3Into( _tmp_vec3_1, _tmp_vec3_2 );

    // shift the position by the vector of CoM movement
    this.position.add( _tmp_vec3_2 );

    // update CoM
    this.center_of_mass.copy( this.shape.center_of_mass );
};

/**
 * Updates body's tensor of inertia.
 *
 * @private
 * @method _computeInertiaTensor
 */
Goblin.RigidBody.prototype._computeInertiaTensor = function() {
    this.inertiaTensor = this.shape.getInertiaTensor( this._is_kinematic ? Infinity : this._mass );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.RigidBody.prototype.findSupportPoint = ( function() {
    var local_direction = new Goblin.Vector3();

    return function( direction, support_point ) {
        // Convert direction into local frame for the shape
        this.transform_inverse.rotateVector3Into( direction, local_direction );

        this.shape.findSupportPoint( local_direction, support_point );

        // Convert from the shape's local coordinates to world coordinates
        this.transform.transformVector3( support_point );
    };
} )();

/**
 * Checks if a ray segment intersects with the object
 *
 * @method rayIntersect
 * @param ray_start {vec3} start point of the segment
 * @param ray_end {vec3} end point of the segment
 * @param limit {Number} Limit the amount of intersections by this number
 * @param intersection_list {Array} array to append intersection to
 */
Goblin.RigidBody.prototype.rayIntersect = ( function() {
    var local_start = new Goblin.Vector3(),
        local_end = new Goblin.Vector3();

    return function( ray_start, ray_end, limit, intersection_list ) {
        // transform start & end into local coordinates
        this.transform_inverse.transformVector3Into( ray_start, local_start );
        this.transform_inverse.transformVector3Into( ray_end, local_end );

        // Intersect with shape
        var intersections = this.shape.rayIntersect( local_start, local_end, limit - intersection_list.length );

        if ( intersections !== null && !Array.isArray( intersections ) ) {
            intersections = [ intersections ];
        }

        for ( var i = 0; i < intersections.length; i++ ) {
            var intersection = intersections[ i ];

            intersection.object = this;

            this.transform.transformVector3( intersection.point );
            this.transform.rotateVector3( intersection.normal );

            intersection_list.push( intersection );
        }
    };
} )();

/**
 * Updates the rigid body's position, velocity, and acceleration
 *
 * @method integrate
 * @param timestep {Number} time, in seconds, to use in integration
 */
Goblin.RigidBody.prototype.integrate = function( timestep ) {
    if ( this._mass === Infinity ) {
        return;
    }

    // Add accumulated linear force
    _tmp_vec3_1.scaleVector( this.accumulated_force, this._mass_inverted );
    _tmp_vec3_1.multiply( this.linear_factor );
    this.linear_velocity.add( _tmp_vec3_1 );

    // Add accumulated angular force
    this.inverseInertiaTensorWorldFrame.transformVector3Into( this.accumulated_torque, _tmp_vec3_1 );
    _tmp_vec3_1.multiply( this.angular_factor );
    this.angular_velocity.add( _tmp_vec3_1 );

    // Apply damping
    this.linear_velocity.scale( Math.max( 0, 1.0 - this.linear_damping * timestep ) );
    this.angular_velocity.scale( Math.max( 0, 1.0 - this.angular_damping * timestep ) );

    // Update position & rotation
    this.integratePosition( timestep, this.linear_velocity );
    this.integrateRotation( timestep, this.angular_velocity );

    // Clear accumulated forces
    this.accumulated_force.x = this.accumulated_force.y = this.accumulated_force.z = 0;
    this.accumulated_torque.x = this.accumulated_torque.y = this.accumulated_torque.z = 0;
    this.solver_impulse[ 0 ] = this.solver_impulse[ 1 ] = this.solver_impulse[ 2 ] = this.solver_impulse[ 3 ] = this.solver_impulse[ 4 ] = this.solver_impulse[ 5 ] = 0;
    this.push_velocity.x = this.push_velocity.y = this.push_velocity.z = 0;
    this.turn_velocity.x = this.turn_velocity.y = this.turn_velocity.z = 0;
};

/**
 * Updates the rigid body's position being given timestamp and linear_velocity.
 *
 * @method integratePosition
 * @param timestep            {Number}            time, in seconds, to use in integration
 * @param linear_velocity    {Goblin.Vector3}    linear velocity, m/s
 */
Goblin.RigidBody.prototype.integratePosition = function( timestep, linear_velocity ) {
    _tmp_vec3_1.scaleVector( linear_velocity, timestep );
    this.position.add( _tmp_vec3_1 );
};

/**
 * Updates the rigid body's rotation being given timestamp and angular_velocity.
 *
 * @method integratePosition
 * @param timestep            {Number}            time, in seconds, to use in integration
 * @param angular_velocity    {Goblin.Vector3}    angular velocity (torque vector, rad/s)
 */
Goblin.RigidBody.prototype.integrateRotation = function( timestep, angular_velocity ) {
    // Update rotation
    _tmp_vec3_1.copy( angular_velocity );
    var fAngle = _tmp_vec3_1.length();

    // limit the angular motion per time step
    if ( fAngle * timestep > ( Math.PI / 4 ) ) {
        fAngle = ( Math.PI / 4 ) / timestep;
    }

    // choose integration based on angular value
    if ( fAngle < 0.001 ) {
        // use Taylor's expansions of sync function
        _tmp_vec3_1.scale( 0.5 * timestep - ( timestep * timestep * timestep ) * 0.020833333333 * fAngle * fAngle );
    } else {
        // sync(fAngle) = sin(c*fAngle)/t
        _tmp_vec3_1.scale( Math.sin( 0.5 * fAngle * timestep ) / fAngle );
    }

    // compose rotational quaternion
    _tmp_quat4_1.x = _tmp_vec3_1.x;
    _tmp_quat4_1.y = _tmp_vec3_1.y;
    _tmp_quat4_1.z = _tmp_vec3_1.z;
    _tmp_quat4_1.w = Math.cos( fAngle * timestep * 0.5 );

    // rotate the body
    _tmp_quat4_1.multiply( this.rotation );
    //_tmp_quat4_1.normalize();

    this.rotation.copy( _tmp_quat4_1 );
};

/**
 * Sets a custom gravity value for this rigid_body
 *
 * @method setGravity
 * @param x {Number} gravity to apply on x axis
 * @param y {Number} gravity to apply on y axis
 * @param z {Number} gravity to apply on z axis
 */
Goblin.RigidBody.prototype.setGravity = function( x, y, z ) {
    if ( this.gravity ) {
        this.gravity.x = x;
        this.gravity.y = y;
        this.gravity.z = z;
    } else {
        this.gravity = new Goblin.Vector3( x, y, z );
    }
};

/**
 * Directly adds linear velocity to the body
 *
 * @method applyImpulse
 * @param impulse {vec3} linear velocity to add to the body
 */
Goblin.RigidBody.prototype.applyImpulse = function( impulse ) {
    _tmp_vec3_1.multiplyVectors( impulse, this.linear_factor );
    this.linear_velocity.add( _tmp_vec3_1 );
};

/**
 * Adds linear acceleration to the body, ignoring its mass.
 *
 * @method addLinearAcceleration
 * @param impulse {vec3} acceleration to add to the body
 */
Goblin.RigidBody.prototype.addLinearAcceleration = function( a ) {
    this.linear_acceleration.add( a );
};

/**
 * Adds linear acceleration to the body, ignoring its mass.
 *
 * @method addLinearAcceleration
 * @param impulse {vec3} acceleration to add to the body
 */
Goblin.RigidBody.prototype.addAngularAcceleration = function( a ) {
    this.angular_acceleration.add( a );
};

/**
 * Adds a linear force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyForce = function( force ) {
    this.accumulated_force.add( force );
};

/**
 * Adds a angular force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyTorque = function( torque ) {
    this.accumulated_torque.add( torque );
};

/**
 * Applies the vector `force` at world coordinate `point`
 *
 * @method applyForceAtWorldPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} world coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtWorldPoint = function( force, point ) {
    _tmp_vec3_1.copy( point );
    _tmp_vec3_1.subtract( this.position );
    _tmp_vec3_1.cross( force );

    this.accumulated_force.add( force );
    this.accumulated_torque.add( _tmp_vec3_1 );
};

/**
 * Applies vector `force` to body at position `point` in body's frame
 *
 * @method applyForceAtLocalPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} local frame coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtLocalPoint = function( force, point ) {
    this.transform.transformVector3Into( point, _tmp_vec3_2 );
    this.applyForceAtWorldPoint( force, _tmp_vec3_2 );
};

Goblin.RigidBody.prototype.getVelocityInLocalPoint = function( point, out ) {
    if ( this._mass === Infinity ) {
        out.set( 0, 0, 0 );
    } else {
        out.copy( this.angular_velocity );
        out.cross( point );
        out.add( this.linear_velocity );
    }
};

/**
 * Sets the rigid body's transformation matrix to the current position and rotation
 *
 * @method updateDerived
 */
Goblin.RigidBody.prototype.updateDerived = function() {
    // normalize rotation
    this.rotation.normalize();

    // update this.transform and this.transform_inverse
    this.transform.makeTransform( this.rotation, this.position );
    this.transform.invertInto( this.transform_inverse );

    // Update the world frame inertia tensor and inverse
    if ( this._mass !== Infinity ) {
        _tmp_mat3_1.fromMatrix4( this.transform_inverse );
        _tmp_mat3_1.transposeInto( _tmp_mat3_2 );
        _tmp_mat3_2.multiply( this.inertiaTensor );
        this.inertiaTensorWorldFrame.multiplyFrom( _tmp_mat3_2, _tmp_mat3_1 );

        this.inertiaTensorWorldFrame.invertInto( this.inverseInertiaTensorWorldFrame );
    }

    // Update AABB
    this.aabb.transform( this.shape.aabb, this.transform );
};