/**
 * @param {object} shape
 * @param {Goblin.Vector3} local_position
 * @param {Goblin.Quaternion} rotation
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, local_position, rotation ) {
    /**
     * @type {Object}
     */
    this.shape = shape;
    /**
     * @type {Goblin.Vector3}
     */
    this.local_position = new Goblin.Vector3( local_position.x, local_position.y, local_position.z );
    /**
     * @type {Goblin.Vector3}
     */
    this.center_of_mass = new Goblin.Vector3();
    /**
     * @type {Goblin.Vector3}
     */
    this.position = new Goblin.Vector3();
    /**
     * @type {Goblin.Quaternion}
     */
    this.rotation = new Goblin.Quaternion( rotation.x, rotation.y, rotation.z, rotation.w );
    /**
     * @type {Goblin.Matrix4}
     */
    this.transform = new Goblin.Matrix4();
    /**
     * @type {Goblin.Matrix4}
     */
    this.transform_inverse = new Goblin.Matrix4();
    /**
     * @type {Goblin.AABB}
     */
    this.aabb = new Goblin.AABB();
    /**
     * @type {Array<Goblin.Vector3>}
     */
    this.faceNormals = [];

    this.updateDerived();
};

Goblin.CompoundShapeChild.prototype.updateDerived = function() {
    this.position.copy( this.local_position );
    this.position.subtract( this.center_of_mass );

    this.transform.makeTransform( this.rotation, this.position );
    this.transform.invertInto( this.transform_inverse );
    this.aabb.transform( this.shape.aabb, this.transform );

    for ( var i = 0; i < this.shape.faceNormals.length; i++ ) {
        var rotatedNormal = new Goblin.Vector3();
        this.rotation.transformVector3Into( this.shape.faceNormals[ i ], rotatedNormal );
        this.faceNormals.push( rotatedNormal );
    }
};