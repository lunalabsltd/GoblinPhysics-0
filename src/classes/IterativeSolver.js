/**
 * Adapted from BulletPhysics's btIterativeSolver
 *
 * @class IterativeSolver
 * @constructor
 */
Goblin.IterativeSolver = function() {
	this.existing_contact_ids = {};

	/**
	 * Holds contact constraints generated from contact manifolds
	 *
	 * @property contact_constraints
	 * @type {Array}
	 */
	this.contact_constraints = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @property friction_constraints
	 * @type {Array}
	 */
	this.friction_constraints = [];

	/**
	 * array of all constraints being solved
	 *
	 * @property all_constraints
	 * @type {Array}
	 */
	this.all_constraints = [];

	/**
	 * array of constraints on the system, excluding contact & friction
	 *
	 * @property constraints
	 * @type {Array}
	 */
	this.constraints = [];

	/**
	 * maximum solver iterations per time step
	 *
	 * @property max_iterations
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * maximum solver iterations per time step to resolve contacts
	 *
	 * @property penetrations_max_iterations
	 * @type {number}
	 */
	this.penetrations_max_iterations = 5;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 *
	 * @property relaxation
	 * @type {number}
	 * @default 0.9
	 */
	this.relaxation = 0.9;

	/**
	 * weighting used in the Gauss-Seidel successive over-relaxation solver
	 *
	 * @property sor_weight
	 * @type {number}
	 */
	this.sor_weight = 0.85;

	/**
	 * how much of the solution to start with on the next solver pass
	 *
	 * @property warmstarting_factor
	 * @type {number}
	 */
	this.warmstarting_factor = 0.95;

	/**
	 * The absolute value of jacobian determinant (row.D) under which the row is considered inactive.
	 *
	 * @property warmstarting_factor
	 * @type {number}
	 */
	this.min_row_response = 1e-5;
};

/**
 * used to remove contact constraints from the system when their contacts are destroyed
 *
 * @method onContactDeactivate
 * @private
 */
Goblin.IterativeSolver.prototype.onContactDeactivate = function( constraint ) {
	var idx = this.contact_constraints.indexOf( constraint );
	this.contact_constraints.splice( idx, 1 );

	delete this.existing_contact_ids[ constraint.contact.uid ];
};
/**
 * used to remove friction constraints from the system when their contacts are destroyed
 *
 * @method onFrictionDeactivate
 * @private
 */
Goblin.IterativeSolver.prototype.onFrictionDeactivate = function( constraint ) {
	var idx = this.friction_constraints.indexOf( constraint );
	this.friction_constraints.splice( idx, 1 );
};

/**
 * adds a constraint to the solver
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.IterativeSolver.prototype.addConstraint = function( constraint ) {
	if ( this.constraints.indexOf( constraint ) === -1 ) {
		this.constraints.push( constraint );
	}
};

/**
 * removes a constraint from the solver
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.IterativeSolver.prototype.removeConstraint = function( constraint ) {
	var idx = this.constraints.indexOf( constraint );
	if ( idx !== -1 ) {
		this.constraints.splice( idx, 1 );
	}
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.IterativeSolver.prototype.processContactManifolds = function( contact_manifolds ) {
	var i, j,
		manifold,
		contacts_length,
		contact,
		constraint;

	manifold = contact_manifolds.first;

	while( manifold ) {
		contacts_length = manifold.points.length;

		for ( i = 0; i < contacts_length; i++ ) {
			contact = manifold.points[i];

			var existing_constraint = this.existing_contact_ids.hasOwnProperty( contact.uid );

			if ( !existing_constraint ) {
				this.existing_contact_ids[contact.uid] = true;

				// Build contact constraint
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				contact.constraint = constraint;
				this.contact_constraints.push( constraint );
				
				constraint.solver = this;

				if ( contact.friction > 0 ) {
					// Build friction constraint
					constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
					constraint.buildFromContact( contact );
					this.friction_constraints.push( constraint );

					constraint.solver = this;
				}
			}
		}

		manifold = manifold.next_manifold;
	}

	// @TODO just for now
	this.all_constraints.length = 0;
	Array.prototype.push.apply( this.all_constraints, this.friction_constraints );
	Array.prototype.push.apply( this.all_constraints, this.constraints );
	Array.prototype.push.apply( this.all_constraints, this.contact_constraints );
};

Goblin.IterativeSolver.prototype.prepareConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		constraint,
		row,
		i, j;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}

		constraint.update( time_delta );
		for ( j = 0; j < constraint.rows.length; j++ ) {
			row = constraint.rows[j];
			row.multiplier = 0;
			row.computeB( constraint ); // Objects' inverted mass & inertia tensors & Jacobian
			row.computeD();
			row.computeEta( constraint, time_delta ); // Amount of work needed for the constraint
		}
	}
};

Goblin.IterativeSolver.prototype.resolveContacts = function() {
	var iteration,
		constraint,
		jdot, row, i,
		delta_lambda,
		aabb,
		max_impulse = 0,
		invmass;

	var jacobian, linear_factor, angular_factor, push_velocity, turn_velocity, b, multiplier, am, m, relaxation = this.relaxation;

	// Solve penetrations
	for ( iteration = 0; iteration < this.penetrations_max_iterations; iteration++ ) {
		max_impulse = 0;
		
		for ( i = 0; i < this.contact_constraints.length; i++ ) {
			constraint = this.contact_constraints[i];
			
			row = constraint.rows[0];
			jacobian = row.jacobian;
			b = row.B;

			jdot = 0;
			if ( constraint.object_a_is_dynamic() ) {
				linear_factor = constraint.object_a.linear_factor;
				angular_factor = constraint.object_a.angular_factor;
				push_velocity = constraint.object_a.push_velocity;
				turn_velocity = constraint.object_a.turn_velocity;

				jdot += (
					jacobian[0] * linear_factor.x  * push_velocity.x +
					jacobian[1] * linear_factor.y  * push_velocity.y +
					jacobian[2] * linear_factor.z  * push_velocity.z +
					jacobian[3] * angular_factor.x * turn_velocity.x +
					jacobian[4] * angular_factor.y * turn_velocity.y +
					jacobian[5] * angular_factor.z * turn_velocity.z
				);
			}
			if ( constraint.object_b_is_dynamic() ) {
				linear_factor = constraint.object_b.linear_factor;
				angular_factor = constraint.object_b.angular_factor;
				push_velocity = constraint.object_b.push_velocity;
				turn_velocity = constraint.object_b.turn_velocity;

				jdot += (
					jacobian[6]  * linear_factor.x  * push_velocity.x +
					jacobian[7]  * linear_factor.y  * push_velocity.y +
					jacobian[8]  * linear_factor.z  * push_velocity.z +
					jacobian[9]  * angular_factor.x * turn_velocity.x +
					jacobian[10] * angular_factor.y * turn_velocity.y +
					jacobian[11] * angular_factor.z * turn_velocity.z
				);
			}

			delta_lambda = ( constraint.contact.penetration_depth - jdot ) / row.D || 0;
			var cache = row.multiplier;
			row.multiplier = Math.max(
				row.lower_limit,
				Math.min(
					cache + delta_lambda,
					row.upper_limit
				)
			);
			delta_lambda = row.multiplier - cache;
			max_impulse = Math.max( max_impulse, delta_lambda );

			if ( constraint.object_a_is_dynamic() ) {
				push_velocity = constraint.object_a.push_velocity;
				turn_velocity = constraint.object_a.turn_velocity;

				push_velocity.x += delta_lambda * b[0];
				push_velocity.y += delta_lambda * b[1];
				push_velocity.z += delta_lambda * b[2];

				turn_velocity.x += delta_lambda * b[3];
				turn_velocity.y += delta_lambda * b[4];
				turn_velocity.z += delta_lambda * b[5];
			}
			if ( constraint.object_b_is_dynamic() ) {
				push_velocity = constraint.object_b.push_velocity;
				turn_velocity = constraint.object_b.turn_velocity;

				push_velocity.x += delta_lambda * b[6];
				push_velocity.y += delta_lambda * b[7];
				push_velocity.z += delta_lambda * b[8];

				turn_velocity.x += delta_lambda * b[9];
				turn_velocity.y += delta_lambda * b[10];
				turn_velocity.z += delta_lambda * b[11];
			}
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}

	// Apply position/rotation solver
	for ( i = 0; i < this.contact_constraints.length; i++ ) {
		constraint = this.contact_constraints[i];
		row = constraint.rows[0];

		jacobian = row.jacobian;
		multiplier = row.multiplier;

		if ( constraint.object_a_is_dynamic() ) {
			linear_factor = constraint.object_b.linear_factor;
			angular_factor = constraint.object_b.angular_factor;

			am = multiplier * relaxation;
			m = constraint.object_a._mass_inverted * multiplier * relaxation;

			constraint.object_a.position.x += m * jacobian[0] * linear_factor.x;
			constraint.object_a.position.y += m * jacobian[1] * linear_factor.y;
			constraint.object_a.position.z += m * jacobian[2] * linear_factor.z;

			_tmp_vec3_1.x = am * jacobian[3] * angular_factor.x;
			_tmp_vec3_1.y = am * jacobian[4] * angular_factor.y;
			_tmp_vec3_1.z = am * jacobian[5] * angular_factor.z;

			constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
			constraint.object_a.integrateRotation( 1.0, _tmp_vec3_1 );
		}

		if ( constraint.object_b_is_dynamic() ) {
			linear_factor = constraint.object_b.linear_factor;
			angular_factor = constraint.object_b.angular_factor;

			am = multiplier * relaxation;
			m = constraint.object_b._mass_inverted * multiplier * relaxation;

			constraint.object_b.position.x += m * jacobian[6] * linear_factor.x;
			constraint.object_b.position.y += m * jacobian[7] * linear_factor.y;
			constraint.object_b.position.z += m * jacobian[8] * linear_factor.z;

			_tmp_vec3_1.x = am * jacobian[9]  * angular_factor.x;
			_tmp_vec3_1.y = am * jacobian[10] * angular_factor.y;
			_tmp_vec3_1.z = am * jacobian[11] * angular_factor.z;

			constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
			constraint.object_b.integrateRotation( 1.0, _tmp_vec3_1 );
		}

		row.multiplier = 0;
	}
};

Goblin.IterativeSolver.prototype.solveConstraints = function() {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		warmth,
		i, j, k;

	var iteration,
		delta_lambda,
		max_impulse = 0, // Track the largest impulse per iteration; if the impulse is <= EPSILON then early out
		jdot;

	var solver_impulse, b, linear_factor, angular_factor, jacobian;

	// Warm starting
	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}

		for ( j = 0; j < constraint.rows.length; j++ ) {
			row = constraint.rows[j];
			warmth = row.multiplier_cached * this.warmstarting_factor;
			row.multiplier = warmth;

			b = row.B;

			if ( Math.abs( row.D ) < this.min_row_response ) {
				continue;
			}

			if ( constraint.object_a_is_dynamic() ) {
				solver_impulse = constraint.object_a.solver_impulse;

				solver_impulse[0] += warmth * b[0];
				solver_impulse[1] += warmth * b[1];
				solver_impulse[2] += warmth * b[2];

				solver_impulse[3] += warmth * b[3];
				solver_impulse[4] += warmth * b[4];
				solver_impulse[5] += warmth * b[5];
			}
			if ( constraint.object_b_is_dynamic() ) {
				solver_impulse = constraint.object_b.solver_impulse;

				solver_impulse[0] += warmth * b[6];
				solver_impulse[1] += warmth * b[7];
				solver_impulse[2] += warmth * b[8];

				solver_impulse[3] += warmth * b[9];
				solver_impulse[4] += warmth * b[10];
				solver_impulse[5] += warmth * b[11];
			}
		}
	}

	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;

		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.all_constraints[i];
			if ( constraint.active === false ) {
				continue;
			}
			num_rows = constraint.rows.length;

			for ( j = 0; j < num_rows; j++ ) {
				row = constraint.rows[j];

				if ( Math.abs( row.D ) < this.min_row_response ) {
					continue;
				}

				jdot = 0;
				
				jacobian = row.jacobian;
				b = row.B;

				if ( constraint.object_a_is_dynamic() ) {
					linear_factor = constraint.object_a.linear_factor;
					angular_factor = constraint.object_a.angular_factor;
					solver_impulse = constraint.object_a.solver_impulse;

					jdot += (
						jacobian[0] * linear_factor.x  * solver_impulse[0] +
						jacobian[1] * linear_factor.y  * solver_impulse[1] +
						jacobian[2] * linear_factor.z  * solver_impulse[2] +
						jacobian[3] * angular_factor.x * solver_impulse[3] +
						jacobian[4] * angular_factor.y * solver_impulse[4] +
						jacobian[5] * angular_factor.z * solver_impulse[5]
					);
				}
				if ( constraint.object_b_is_dynamic() ) {
					linear_factor = constraint.object_b.linear_factor;
					angular_factor = constraint.object_b.angular_factor;
					solver_impulse = constraint.object_b.solver_impulse;

					jdot += (
						jacobian[6]  * linear_factor.x  * solver_impulse[0] +
						jacobian[7]  * linear_factor.y  * solver_impulse[1] +
						jacobian[8]  * linear_factor.z  * solver_impulse[2] +
						jacobian[9]  * angular_factor.x * solver_impulse[3] +
						jacobian[10] * angular_factor.y * solver_impulse[4] +
						jacobian[11] * angular_factor.z * solver_impulse[5]
					);
				}

				delta_lambda = ( ( row.eta - jdot ) / row.D || 0) * constraint.factor;
				var cache = row.multiplier,
					multiplier_target = cache + delta_lambda;

				// successive over-relaxation
				multiplier_target = this.sor_weight * multiplier_target + ( 1 - this.sor_weight ) * cache;

				// Clamp to row constraints
				row.multiplier = Math.max(
					row.lower_limit,
					Math.min(
						multiplier_target,
						row.upper_limit
					)
				);

				// Find final `delta_lambda`
				delta_lambda = row.multiplier - cache;

				var total_mass = ( constraint.object_a_is_dynamic() ? constraint.object_a._mass : 0 ) +
					( constraint.object_b_is_dynamic() ? constraint.object_b._mass : 0 );
				max_impulse = Math.max( max_impulse, Math.abs( delta_lambda ) / total_mass );

				if ( constraint.object_a_is_dynamic() ) {
					solver_impulse = constraint.object_a.solver_impulse;

					solver_impulse[0] += delta_lambda * b[0];
					solver_impulse[1] += delta_lambda * b[1];
					solver_impulse[2] += delta_lambda * b[2];

					solver_impulse[3] += delta_lambda * b[3];
					solver_impulse[4] += delta_lambda * b[4];
					solver_impulse[5] += delta_lambda * b[5];
				}
				if ( constraint.object_b_is_dynamic() ) {
					solver_impulse = constraint.object_b.solver_impulse;

					solver_impulse[0] += delta_lambda * b[6];
					solver_impulse[1] += delta_lambda * b[7];
					solver_impulse[2] += delta_lambda * b[8];

					solver_impulse[3] += delta_lambda * b[9];
					solver_impulse[4] += delta_lambda * b[10];
					solver_impulse[5] += delta_lambda * b[11];
				}
			}
		}

		if ( max_impulse <= 0.1 ) {
			break;
		}
	}
};

Goblin.IterativeSolver.prototype.applyConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		i, j;

	var jacobian, m, am, linear_factor, angular_factor;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}
		num_rows = constraint.rows.length;

		constraint.last_impulse.x = constraint.last_impulse.y = constraint.last_impulse.z = 0;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];

			row.multiplier_cached = row.multiplier;
			jacobian = row.jacobian;

			if ( Math.abs( row.D ) < this.min_row_response ) {
				continue;
			}

			if ( constraint.object_a_is_dynamic() ) {
				m = constraint.object_a._mass_inverted * time_delta * row.multiplier;
				am = time_delta * row.multiplier;
				linear_factor = constraint.object_a.linear_factor;
				angular_factor = constraint.object_a.angular_factor;

				_tmp_vec3_2.x = m * jacobian[0] * linear_factor.x;
				_tmp_vec3_2.y = m * jacobian[1] * linear_factor.y;
				_tmp_vec3_2.z = m * jacobian[2] * linear_factor.z;
				constraint.object_a.linear_velocity.add( _tmp_vec3_2 );
				constraint.last_impulse.add( _tmp_vec3_2 );

				_tmp_vec3_1.x = am * jacobian[3] * angular_factor.x;
				_tmp_vec3_1.y = am * jacobian[4] * angular_factor.y;
				_tmp_vec3_1.z = am * jacobian[5] * angular_factor.z;
				constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
				constraint.object_a.angular_velocity.add( _tmp_vec3_1 );
				constraint.last_impulse.add( _tmp_vec3_1 );
			}

			if ( constraint.object_b_is_dynamic() ) {
				m = constraint.object_b._mass_inverted * time_delta * row.multiplier;
				am = time_delta * row.multiplier;
				linear_factor = constraint.object_b.linear_factor;
				angular_factor = constraint.object_b.angular_factor;

				_tmp_vec3_2.x = m * jacobian[6] * linear_factor.x;
				_tmp_vec3_2.y = m * jacobian[7] * linear_factor.y;
				_tmp_vec3_2.z = m * jacobian[8] * linear_factor.z;
				constraint.object_b.linear_velocity.add(_tmp_vec3_2 );
				constraint.last_impulse.add( _tmp_vec3_2 );

				_tmp_vec3_1.x = am * jacobian[9]  * angular_factor.x;
				_tmp_vec3_1.y = am * jacobian[10] * angular_factor.y;
				_tmp_vec3_1.z = am * jacobian[11] * angular_factor.z;
				constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
				constraint.object_b.angular_velocity.add( _tmp_vec3_1 );
				constraint.last_impulse.add( _tmp_vec3_1 );
			}
		}

		if ( constraint.breaking_threshold > 0 ) {
			if ( constraint.last_impulse.lengthSquared() >= constraint.breaking_threshold * constraint.breaking_threshold ) {
				constraint.active = false;
			}
		}
	}
};