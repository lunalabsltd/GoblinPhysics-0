Goblin.ConstraintRow = function() {
	this.jacobian = new Float64Array( 12 );
	this.B = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this.D = 0; // Length of the jacobian

	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;

	this.bias = 0;
	this.multiplier = 0;
	this.multiplier_cached = 0;
	this.cfm = 0;
	this.eta = 0;
	this.eta_row = new Float64Array( 12 );
};

Goblin.ConstraintRow.createConstraintRow = function() {
	var row =  Goblin.ObjectPool.getObject( 'ConstraintRow' );
	row.lower_limit = -Infinity;
	row.upper_limit = Infinity;
	row.bias = 0;

	row.jacobian[0] = row.jacobian[1] = row.jacobian[2] =
	row.jacobian[3] = row.jacobian[4] = row.jacobian[5] =
	row.jacobian[6] = row.jacobian[7] = row.jacobian[8] =
	row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;

	return row;
};

/**
 * Resets row's jacobian to 0 effectively disabling the constrain for corresponding
 * bodies.
 *
 * @param {boolean} nullify_a Whether to nullify first object's jacobian
 * @param {boolean} nullify_b Whether to nullify second object's jacobian
 */
Goblin.ConstraintRow.prototype.nullify = function( nullify_a, nullify_b ) {
	var i = 0;

	for ( i = 0; nullify_a && ( i < 6 ); i++ ) {
		this.jacobian[ i ] = 0;
	}

	for ( i = 6; nullify_b && ( i < 12 ); i++ ) {
		this.jacobian[ i ] = 0;
	}
};

/**
 * Resets row to "blank state" (zero jacobian, no limits and zero bias).
 */
Goblin.ConstraintRow.prototype.reset = function() {
	this.nullify( true, true );
	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;
	this.bias = 0;
};


Goblin.ConstraintRow.prototype.computeB = function( constraint ) {
	var invmass;
	var jacobian = this.jacobian;
	var b = this.B;

	if ( constraint.object_a_is_dynamic() ) {
		invmass = constraint.object_a._mass_inverted;

		b[0] = invmass * jacobian[0];
		b[1] = invmass * jacobian[1];
		b[2] = invmass * jacobian[2];

		_tmp_vec3_1.x = jacobian[3];
		_tmp_vec3_1.y = jacobian[4];
		_tmp_vec3_1.z = jacobian[5];
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		b[3] = _tmp_vec3_1.x;
		b[4] = _tmp_vec3_1.y;
		b[5] = _tmp_vec3_1.z;
	} else {
		b[0] = b[1] = b[2] = 0;
		b[3] = b[4] = b[5] = 0;
	}

	if ( constraint.object_b_is_dynamic() ) {
		invmass = constraint.object_b._mass_inverted;
		b[6] = invmass * jacobian[6];
		b[7] = invmass * jacobian[7];
		b[8] = invmass * jacobian[8];

		_tmp_vec3_1.x = jacobian[9];
		_tmp_vec3_1.y = jacobian[10];
		_tmp_vec3_1.z = jacobian[11];
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		b[9] =  _tmp_vec3_1.x;
		b[10] = _tmp_vec3_1.y;
		b[11] = _tmp_vec3_1.z;
	} else {
		b[6] = b[7] =  b[8] = 0;
		b[9] = b[10] = b[11] = 0;
	}
};

Goblin.ConstraintRow.prototype.computeD = function() {
	var jacobian = this.jacobian;
	var b = this.B;

	this.D = (
		jacobian[0]  * b[0] +
		jacobian[1]  * b[1] +
		jacobian[2]  * b[2] +
		jacobian[3]  * b[3] +
		jacobian[4]  * b[4] +
		jacobian[5]  * b[5] +
		jacobian[6]  * b[6] +
		jacobian[7]  * b[7] +
		jacobian[8]  * b[8] +
		jacobian[9]  * b[9] +
		jacobian[10] * b[10] +
		jacobian[11] * b[11]
	);
};

Goblin.ConstraintRow.prototype.computeEta = function( constraint, time_delta ) {
	var invmass,
		inverse_time_delta = 1 / time_delta;

	var eta_row = this.eta_row;
	var jacobian = this.jacobian;
	var linear_factor, linear_velocity, angular_factor, angular_velocity, accumulated_force;

	if ( !constraint.object_a_is_dynamic() ) {
		eta_row[0] = eta_row[1] = eta_row[2] = eta_row[3] = eta_row[4] = eta_row[5] = 0;
	} else {
		invmass = constraint.object_a._mass_inverted;

		linear_factor = constraint.object_a.linear_factor;
		linear_velocity = constraint.object_a.linear_velocity;
		angular_factor = constraint.object_a.angular_factor;
		angular_velocity = constraint.object_a.angular_velocity;
		accumulated_force = constraint.object_a.accumulated_force;

		eta_row[0] = linear_factor.x * ( linear_velocity.x + ( invmass * accumulated_force.x ) ) * inverse_time_delta;
		eta_row[1] = linear_factor.y * ( linear_velocity.y + ( invmass * accumulated_force.y ) ) * inverse_time_delta;
		eta_row[2] = linear_factor.z * ( linear_velocity.z + ( invmass * accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_a.accumulated_torque );
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		eta_row[3] = angular_factor.x * ( angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		eta_row[4] = angular_factor.y * ( angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		eta_row[5] = angular_factor.z * ( angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
	}

	if ( !constraint.object_b_is_dynamic() ) {
		eta_row[6] = eta_row[7] = eta_row[8] = eta_row[9] = eta_row[10] = eta_row[11] = 0;
	} else {
		invmass = constraint.object_b._mass_inverted;

		linear_factor = constraint.object_b.linear_factor;
		linear_velocity = constraint.object_b.linear_velocity;
		angular_factor = constraint.object_b.angular_factor;
		angular_velocity = constraint.object_b.angular_velocity;
		accumulated_force = constraint.object_b.accumulated_force;

		eta_row[6] = linear_factor.x * ( linear_velocity.x + ( invmass * accumulated_force.x ) ) * inverse_time_delta;
		eta_row[7] = linear_factor.y * ( linear_velocity.y + ( invmass * accumulated_force.y ) ) * inverse_time_delta;
		eta_row[8] = linear_factor.z * ( linear_velocity.z + ( invmass * accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_b.accumulated_torque );
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		eta_row[9] =  angular_factor.x * ( angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		eta_row[10] = angular_factor.y * ( angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		eta_row[11] = angular_factor.z * ( angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
	}

	var jdotv = jacobian[0]  * eta_row[0] +
				jacobian[1]  * eta_row[1] +
				jacobian[2]  * eta_row[2] +
				jacobian[3]  * eta_row[3] +
				jacobian[4]  * eta_row[4] +
				jacobian[5]  * eta_row[5] +
				jacobian[6]  * eta_row[6] +
				jacobian[7]  * eta_row[7] +
				jacobian[8]  * eta_row[8] +
				jacobian[9]  * eta_row[9] +
				jacobian[10] * eta_row[10] +
				jacobian[11] * eta_row[11];

	this.eta = ( this.bias * inverse_time_delta ) - jdotv;

	var total_mass = ( constraint.object_a_is_dynamic() ? constraint.object_a._mass : 0 ) +
					 ( constraint.object_b_is_dynamic() ? constraint.object_b._mass : 0 );

	this.eta = this.eta / ( 1.0 + this.cfm * total_mass );
};