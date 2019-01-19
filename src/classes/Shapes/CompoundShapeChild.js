/**
 * @class CompoundShapeChild
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, local_position, rotation ) {
	this.shape = shape;

	this.local_position = new Goblin.Vector3( local_position.x, local_position.y, local_position.z );
    this.center_of_mass = new Goblin.Vector3();
    this.position = new Goblin.Vector3();
	this.rotation = new Goblin.Quaternion( rotation.x, rotation.y, rotation.z, rotation.w );

	this.transform = new Goblin.Matrix4();
	this.transform_inverse = new Goblin.Matrix4();
	
	this.aabb = new Goblin.AABB();

    this.updateDerived();
};

Goblin.CompoundShapeChild.prototype.updateDerived = function () {
    this.position.copy( this.local_position );
    this.position.subtract( this.center_of_mass );

    this.transform.makeTransform( this.rotation, this.position );
    this.transform.invertInto( this.transform_inverse );
    this.aabb.transform( this.shape.aabb, this.transform );
};