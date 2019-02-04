/**
 * Manages the physics simulation
 *
 * @class PhysicMaterial
 * @constructor
 */
Goblin.PhysicMaterial = function( attributes ) {

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