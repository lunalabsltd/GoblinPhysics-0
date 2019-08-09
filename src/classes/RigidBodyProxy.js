Goblin.RigidBodyProxy = function() {
    this.parent = null;
    this.id = null;

    this.shape = null;

    this.aabb = new Goblin.AABB();

    this._mass = null;
    this._mass_inverted = null;

    this.position = new Goblin.Vector3();
    this.rotation = new Goblin.Quaternion();

    this.transform = new Goblin.Matrix4();
    this.transform_inverse = new Goblin.Matrix4();

    this.restitution = null;
    this.friction = null;

    this.is_kinematic = false;
    this.is_trigger = false;
};

Object.defineProperty(
    Goblin.RigidBodyProxy.prototype,
    'mass',
    {
        get: function() {
            return this._mass;
        },
        set: function( n ) {
            this._mass = n;
            this._mass_inverted = 1 / n;
            this.inertiaTensor = this.shape.getInertiaTensor( this.is_kinematic ? Infinity : n );
        }
    }
);

Goblin.RigidBodyProxy.prototype.setFrom = function( parent, shape_data ) {
    this.parent = parent;

    this.id = parent.id;

    this.shape = shape_data.shape;
    this.shape_data = shape_data;

    this._mass = parent._mass;
    this.is_kinematic = parent.is_kinematic;

    parent.transform.transformVector3Into( shape_data.position, this.position );
    this.rotation.multiplyQuaternions( parent.rotation, shape_data.rotation );

    this.transform.makeTransform( this.rotation, this.position );
    this.transform.invertInto( this.transform_inverse );

    this.aabb.transform( this.shape.aabb, this.transform );

    this.restitution = parent.restitution;
    this.friction = parent.friction;
    this.is_trigger = parent.is_trigger;
    this.faceNormals = parent.faceNormals;
};

Goblin.RigidBodyProxy.prototype.findSupportPoint = Goblin.RigidBody.prototype.findSupportPoint;

Goblin.RigidBodyProxy.prototype.getRigidBody = function() {
    var body = this.parent;
    while ( body.parent ) {
        body = this.parent;
    }
    return body;
};