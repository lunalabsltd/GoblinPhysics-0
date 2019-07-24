/**
 * Manages the physics simulation
 *
 * @class World
 * @param broadphase {Goblin.Broadphase} the broadphase used by the world to find possible contacts
 * @param narrowphase {Goblin.NarrowPhase} the narrowphase used by the world to generate valid contacts
 * @constructor
 */
Goblin.World = function( broadphase, narrowphase, solver ) {
	/**
	 * How many time steps have been simulated. If the steps are always the same length then total simulation time = world.ticks * time_step
	 *
	 * @property ticks
	 * @type {number}
	 */
	this.ticks = 0;

	/**
	 * The broadphase used by the world to find possible contacts
	 *
	 * @property broadphase
	 * @type {Goblin.Broadphase}
	 */
	this.broadphase = broadphase;

	/**
	 * The narrowphase used by the world to generate valid contacts
	 *
	 * @property narrowphasee
	 * @type {Goblin.NarrowPhase}
	 */
	this.narrowphase = narrowphase;

	/**
	 * The contact solver used by the world to calculate and apply impulses resulting from contacts
	 *
	 * @property solver
	 */
	this.solver = solver;
	solver.world = this;

	/**
	 * Array of rigid bodies in the world
	 *
	 * @property rigid_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.rigid_bodies = [];

	/**
	 * Array of ghost bodies in the world
	 *
	 * @property ghost_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.ghost_bodies = [];

	/**
	* the world's gravity, applied by default to all objects in the world
	*
	* @property gravity
	* @type {vec3}
	* @default [ 0, -9.8, 0 ]
	*/
	this.gravity = new Goblin.Vector3( 0, -9.8, 0 );

	/**
	 * array of force generators in the world
	 *
	 * @property force_generators
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.force_generators = [];

	/**
	 * An object containing the flags allowing / disallowing the objects to collide.
	 * If the entry is absent from the object, it's considered to be allowed.
	 *
	 * @property collision_matrix
	 * @type {object}
	 * @default {}
	 * @private
	 */
	this.collision_matrix = {};

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.World );

/**
* Steps the physics simulation according to the time delta
*
* @method step
* @param time_delta {Number} amount of time to simulate, in seconds
* @param [max_step] {Number} maximum time step size, in seconds
*/
Goblin.World.prototype.step = function( time_delta, max_step ) {
    max_step = max_step || time_delta;

	var x, delta, time_loops, i, loop_count, body;

    time_loops = time_delta / max_step;
    for ( x = 0; x < time_loops; x++ ) {
		this.ticks++;
		
        delta = Math.min( max_step, time_delta );
        time_delta -= max_step;

		this.emit( 'stepStart', this.ticks, delta );

		var bodies = this.rigid_bodies;
		//var bodies = this.broadphase.getDynamicBodies();

		// Apply gravity
        for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
            body = bodies[ i ];

            // kinematic bodies aren't affected by gravity or forces
            if ( body._is_kinematic ) {
            	continue;
            }

            // Objects of infinite mass don't move
            if ( ( body._mass !== Infinity ) && body.use_gravity ) {
				_tmp_vec3_1.scaleVector( body.gravity || this.gravity, body._mass * delta );
                body.accumulated_force.add( _tmp_vec3_1 );
            }

            if ( body._mass !== Infinity ) {
				_tmp_vec3_1.scaleVector( body.linear_acceleration, body._mass * delta );
                body.accumulated_force.add( _tmp_vec3_1 );

                _tmp_vec3_1.scaleVector( body.angular_acceleration, body._mass * delta );
                body.accumulated_torque.add( _tmp_vec3_1 );
            }
        }

        // Apply force generators
        for ( i = 0, loop_count = this.force_generators.length; i < loop_count; i++ ) {
            this.force_generators[ i ].applyForce();
        }

		for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
			bodies[ i ].updateDerived();
		}

		this.drawDebug();

        // Check for contacts, broadphase
        this.broadphase.update();

        // Find valid contacts, narrowphase
        this.narrowphase.generateContacts( this.broadphase.collision_pairs );

        // Process contact manifolds into contact and friction constraints
        this.solver.processContactManifolds( this.narrowphase.contact_manifolds );

        // Prepare the constraints by precomputing some values
        this.solver.prepareConstraints( delta );

        // Resolve contacts
        this.solver.resolveContacts();

        // Run the constraint solver
        this.solver.solveConstraints();

        // Apply the constraints
        this.solver.applyConstraints( delta );

		// Uppdate ghost bodies
		for ( i = 0; i < this.ghost_bodies.length; i++ ) {
			body = this.ghost_bodies[i];
			body.checkForEndedContacts();
		}

		// Integrate rigid bodies
		for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
			body = bodies[ i ];
			body.integrate( delta );
		}

		this.emit( 'stepEnd', this.ticks, delta );
    }
};

/**
 * Draws AABBs of objects and colliders when enabled for the world.
 *
 * @method drawDebug
 */
Goblin.World.prototype.drawDebug = function() {
	if ( !this.debug ) {
		return;
	}

	var i, j, body, aabb, shapes, shape;

	for ( i = 0; i < this.rigid_bodies.length; i++ ) {
		body = this.rigid_bodies[ i ];

		if ( body.debug ) {
			aabb = body.aabb;

			pc.Application.getApplication().renderWireCube( 
				new pc.Mat4().setTRS( 
					new pc.Vec3( aabb.min.x + aabb.max.x, aabb.min.y + aabb.max.y, aabb.min.z + aabb.max.z ).scale( 0.5 ), 
					pc.Quat.IDENTITY, 
					new pc.Vec3( aabb.min.x - aabb.max.x, aabb.min.y - aabb.max.y, aabb.min.z - aabb.max.z ).scale( -1 ) 
				), 

				new pc.Color( 1, 0, 0, 1 ),

				pc.LINEBATCH_OVERLAY
			);
		}

		shapes = body.shape.child_shapes || [];

		for ( j = 0; j < shapes.length; j++ ) {
			shape = shapes[ j ].shape;

			if ( shape.debug ) {
				aabb = new Goblin.AABB();
				aabb.transform( shapes[ j ].aabb, body.transform );

				pc.Application.getApplication().renderWireCube( 
					new pc.Mat4().setTRS( 
						new pc.Vec3( aabb.min.x + aabb.max.x, aabb.min.y + aabb.max.y, aabb.min.z + aabb.max.z ).scale( 0.5 ), 
						pc.Quat.IDENTITY, 
						new pc.Vec3( aabb.min.x - aabb.max.x, aabb.min.y - aabb.max.y, aabb.min.z - aabb.max.z ).scale( -1 ) 
					), 

					new pc.Color( 0, 1, 0, 1 ),

					pc.LINEBATCH_OVERLAY
				);
			}
		}
	}
};

/**
 * Adds a rigid body to the world
 *
 * @method addRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to add to the world
 */
Goblin.World.prototype.addRigidBody = function( rigid_body ) {
	if ( rigid_body.world ) {
		throw new Error( "The body already belongs to a physics world!" );
	}

	rigid_body.world = this;
	rigid_body.updateDerived();
	this.rigid_bodies.push( rigid_body );
	this.broadphase.addBody( rigid_body );
};

/**
 * Removes a rigid body from the world
 *
 * @method removeRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to remove from the world
 */
Goblin.World.prototype.removeRigidBody = function( rigid_body ) {
	var i;

	for ( i = 0; i < this.rigid_bodies.length; i++ ) {
		if ( this.rigid_bodies[i] === rigid_body ) {
			this.rigid_bodies.splice( i, 1 );
			this.broadphase.removeBody( rigid_body );
			break;
		}
	}

	rigid_body.world = null;

	// remove any contact & friction constraints associated with this body
	// this calls contact.destroy() for all relevant contacts
	// which in turn cleans up the iterative solver
	this.narrowphase.removeBody( rigid_body );
};

/**
 * Updates body's collision layer
 *
 * @method updateObjectLayer
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param new_layer  {Number} New layer that is about to be set
 */
Goblin.World.prototype.updateObjectLayer = function ( rigid_body, new_layer ) {
	this.broadphase.updateObjectLayer( rigid_body, new_layer );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectStaticFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object is marked as static
 */
Goblin.World.prototype.updateObjectStaticFlag = function ( rigid_body, is_static ) {
	this.broadphase.updateObjectStaticFlag( rigid_body, is_static );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectKinematicFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_kinematic  {Boolean} Whether the object is marked as static
 */
Goblin.World.prototype.updateObjectKinematicFlag = function ( rigid_body, is_kinematic ) {
	this.broadphase.updateObjectKinematicFlag( rigid_body, is_kinematic );
};

/**
 * Adds a force generator to the world
 *
 * @method addForceGenerator
 * @param force_generator {Goblin.ForceGenerator} force generator object to be added
 */
Goblin.World.prototype.addForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	// Make sure this generator isn't already in the world
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			return;
		}
	}

	this.force_generators.push( force_generator );
};

/**
 * removes a force generator from the world
 *
 * @method removeForceGenerator
 * @param force_generatorv {Goblin.ForceGenerator} force generator object to be removed
 */
Goblin.World.prototype.removeForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			this.force_generators.splice( i, 1 );
			return;
		}
	}
};

/**
 * adds a constraint to the world
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.World.prototype.addConstraint = function( constraint ) {
	this.solver.addConstraint( constraint );
};

/**
 * removes a constraint from the world
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.World.prototype.removeConstraint = function( constraint ) {
	this.solver.removeConstraint( constraint );
};

(function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
		}
	};

	/**
	 * Checks if a ray segment intersects with objects in the world
	 *
	 * @param {Goblin.Vector3} 			start 		Start of the ray
	 * @param {Goblin.Vector3} 			end 		End of the ray
	 * @param {Number} 					limit 		Maximum amount of objects to return
	 * @param {Number} 					layer_mask 	Layer mask to use
	 * @return {Array<RayIntersection>} 			Array of intersections, sorted by distance from `start`
	 */
	Goblin.World.prototype.rayIntersect = function( start, end, limit, layer_mask ) {
		// we cannot afford to bail out early from broadphase as we need to get closest intersections
		var intersections = this.broadphase.rayIntersect( start, end, 0, layer_mask );
		intersections.sort( tSort );
		return intersections.slice( 0, limit );
	};

	Goblin.World.prototype.shapeIntersect = function( center, shape ) {
		var body = new Goblin.RigidBody( shape, 0 );

		body.position.copy( center );
		body.updateDerived();

		var possibilities = this.broadphase.intersectsWith( body ),
			intersections = [];

		for ( var i = 0; i < possibilities.length; i++ ) {
			var contact = this.narrowphase.getContact( body, possibilities[i] );

			if ( contact != null ) {
				var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );

				// check which (A or B) object & shape are actually an intersection
				intersection.object = contact.object_b;
				intersection.shape = contact.shape_b;

				intersections.push( intersection );
			}
		}

		return intersections;
	};

	/**
	 * Checks if a line-swept shape intersects with objects in the world. Please note
	 * that passing a limit different from 0 will not guarantee any order of the hit - 
	 * i.e. asking for a single hit might return a more remote hit.
	 *
	 * @param {Goblin.Shape} 			shape 		Shape to sweep
	 * @param {Goblin.Vector3} 			start 		Start of the ray
	 * @param {Goblin.Vector3} 			end 		End of the ray
	 * @param {Number} 					limit 		Maximum amount of objects to return
	 * @param {Number} 					layer_mask 	Layer mask to use
	 * @return {Array<RayIntersection>} 			Array of intersections, sorted by distance from `start`
	 */
	Goblin.World.prototype.shapeIntersect = function( shape, start, end, limit, layer_mask ){
		var swept_shape = new Goblin.LineSweptShape( start, end, shape ),
			swept_body = new Goblin.RigidBody( swept_shape, 0 );

		swept_body.updateDerived();

		var possibilities = this.broadphase.intersectsWith( swept_body, layer_mask );
		var intersections = [];

		for ( var i = 0; i < possibilities.length; i++ ) {
			var contact = this.narrowphase.getContact( swept_body, possibilities[i] );

			if ( contact != null ) {
				var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
				intersection.normal.copy( contact.contact_normal );

				// compute point
				intersection.point.scaleVector( contact.contact_normal, -contact.penetration_depth );
				intersection.point.add( contact.contact_point );

				// compute time
				intersection.t = intersection.point.distanceTo( start );

				intersection.object = contact.object_b;
				intersection.shape = contact.shape_b;

				intersections.push( intersection );
			}

			if ( limit <= intersections.length ) {
				break;
			}
		}

		intersections.sort( tSort );
		
		return intersections;
	};
})();