Goblin.CollisionUtils = {};

Goblin.CollisionUtils.canBodiesCollide = function( object_a, object_b ) {
	var matrix = object_a.world.collision_matrix;

	if ( matrix[ object_a.layer ] && matrix[ object_a.layer ][ object_b.layer ] === false ) {
		return false;
	} else {
		return true;
	}
};