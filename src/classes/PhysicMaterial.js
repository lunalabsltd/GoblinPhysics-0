/**
 * Manages the physics simulation
 *
 * @class PhysicMaterial
 * @constructor
 */
Goblin.PhysicMaterial = function( attributes ) {

	attributes = attributes || [];

	this.bounciness = attributes.bounciness;

	this.dynamicFriction = attributes.dynamicFriction;

	this.staticFriction = attributes.staticFriction;

	/**
	 * Friction combine type
	 * Average = 0,
	 * Multiply = 1,
	 * Minimum = 2,
	 * Maximum = 3
	 *
	 * @property frictionCombine
	 * @type {number}
	 */
	this.frictionCombine = attributes.frictionCombine;

	/**
	 * Bounce combine type
	 * Average = 0,
	 * Multiply = 1,
	 * Minimum = 2,
	 * Maximum = 3
	 *
	 * @property bounceCombine
	 * @type {number}
	 */
	this.bounceCombine = attributes.bounceCombine;
};

Goblin.PhysicMaterial.prototype.combineFriction = function (body) {
	if (body.material === null) {
		return ( this.friction + body.friction ) / 2;
	}

	switch (this.frictionCombine) {
		case 1:
			return this.friction * body.friction;
		case 2:
			return Math.min(this.friction, body.friction);
		case 3:
			return Math.max(this.friction, body.friction);
		default:
			return ( this.friction + body.friction ) / 2;
	}
};

Goblin.PhysicMaterial.prototype.combineRestitution = function (body) {
	if (body.material === null) {
		return ( this.bounciness + body.bounciness ) / 2;
	}

	switch (this.bounceCombine) {
		case 1:
			return this.bounciness * body.bounciness;
		case 2:
			return Math.min(this.bounciness, body.bounciness);
		case 3:
			return Math.max(this.bounciness, body.bounciness);
		default:
			return ( this.bounciness + body.bounciness ) / 2;
	}
};