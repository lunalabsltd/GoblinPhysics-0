Goblin.CollisionUtils = {};

Goblin.CollisionUtils.canBodiesCollide = function( object_a, object_b ) {
    var matrix = object_a.world.collision_matrix;

    if ( matrix[ object_a.layer ] && matrix[ object_a.layer ][ object_b.layer ] === false ) {
        return false;
    } else {
        return true;
    }

    if ( object_a._is_static && object_b._is_static ) {
        // static bodies should never collide
        return false;
    }

    if ( matrix[ object_a.layer ] && matrix[ object_a.layer ][ object_b.layer ] === false ) {
        return false;
    } else {
        return true;
    }
};

/**
 * Calculate the friction of two colliding objects
 *
 * @method combineFrictions
 * @param object_a {object} First object
 * @param object_b {object} Second object
 * @param shape_a {object} First shape
 * @param shape_b {object} Second shape
 */
Goblin.CollisionUtils.combineFrictions = function( object_a, object_b, shape_a, shape_b ) {
    if ( shape_a.material === null && shape_b.material === null ) {
        return ( object_a.friction + object_b.friction ) / 2;
    } else if ( shape_a.material === null ) {
        return this.combineValues( 0, shape_b.material.frictionCombine, object_a.friction || 0, shape_b.material.dynamicFriction );
    } else if ( shape_b.material === null ) {
        return this.combineValues( shape_a.material.frictionCombine, 0, shape_a.material.dynamicFriction, shape_b.friction || 0 );
    }

    return this.combineValues( shape_a.material.frictionCombine, shape_b.material.frictionCombine, shape_a.material.dynamicFriction, shape_b.material.dynamicFriction );
};

/**
 * Calculate the restriction of two colliding objects
 *
 * @method combineRestitutions
 * @param object_a {object} First object
 * @param object_b {object} Second object
 * @param shape_a {object} First shape
 * @param shape_b {object} Second shape
 */
Goblin.CollisionUtils.combineRestitutions = function( object_a, object_b, shape_a, shape_b ) {
    if ( shape_a.material === null && shape_b.material === null ) {
        return ( object_a.restitution + object_b.restitution ) / 2;
    } else if ( shape_a.material === null ) {
        return this.combineValues( 0, shape_b.material.bounceCombine, object_a.restitution || 0, shape_b.material.bounciness );
    } else if ( shape_b.material === null ) {
        return this.combineValues( shape_a.material.bounceCombine, 0, shape_a.material.bounciness, object_b.restitution || 0 );
    }

    return this.combineValues( shape_a.material.bounceCombine, shape_b.material.bounceCombine, shape_a.material.bounciness, shape_b.material.bounciness );
};

/**
 * Combine two friction/restriction values by combination mode.
 * Average = 0,
 * Multiply = 1,
 * Minimum = 2,
 * Maximum = 3
 *
 * @method combineValues
 * @param combine_a {Number} First combination mode
 * @param combine_b {Number} Second combination mode
 * @param value_a {Number} First value
 * @param value_b {Number} Second value
 */
Goblin.CollisionUtils.combineValues = function( combine_a, combine_b, value_a, value_b ) {
    switch ( Math.max( combine_a, combine_b ) ) {
        case 1:
            return value_a * value_b;
        case 2:
            return Math.min( value_a, value_b );
        case 3:
            return Math.max( value_a, value_b );
        default:
            return ( value_a + value_b ) / 2;
    }
};