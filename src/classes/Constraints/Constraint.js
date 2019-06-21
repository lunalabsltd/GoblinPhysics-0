Goblin.Constraint = (function() {
	var constraint_count = 0;

	return function() {
		this.id = constraint_count++;

		this.active = true;

		this.object_a = null;

		this.object_b = null;

		this.limit = new Goblin.ConstraintLimit();

		this.motor = new Goblin.ConstraintMotor();

		this.rows = [];

		this.factor = 1;

		this.last_impulse = new Goblin.Vector3();

		this.breaking_threshold = 0;

		this.listeners = {};

		this.solver = null;
	};
})();
Goblin.EventEmitter.apply( Goblin.Constraint );

Goblin.Constraint.prototype.deactivate = function() {
	this.active = false;
};

Goblin.Constraint.prototype.update = function(){};

Goblin.Constraint.prototype.object_a_is_dynamic = function() {
	return this.object_a !== null && !this.object_a._is_kinematic && this.object_a._mass !== Infinity;
};

Goblin.Constraint.prototype.object_b_is_dynamic = function() {
	return this.object_b !== null && !this.object_b._is_kinematic && this.object_b._mass !== Infinity;
};