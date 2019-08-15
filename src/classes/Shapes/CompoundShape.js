/**
 * @constructor
 */
Goblin.CompoundShape = function() {
    this.shapeType = Goblin.Shapes.Type.CompoundShape;

    /**
     * @type {Goblin.CompoundShapeChild[]}
     */
    this.child_shapes = [];

    this.aabb = new Goblin.AABB();
    /**
     * @type {Array<Goblin.Vector3>}
     */
    this.faceNormals = [];

    // holds shape's center
    this.center_of_mass = new Goblin.Vector3();
    this.center_of_mass_override = null;

    this.updateAABB();
};

/**
 * Adds the child shape at `position` and `rotation` relative to the compound shape
 *
 * @method addChildShape
 * @param shape
 * @param position
 * @param rotation
 */
Goblin.CompoundShape.prototype.addChildShape = function( shape, position, rotation ) {
    this.child_shapes.push( new Goblin.CompoundShapeChild( shape, position, rotation ) );
    this.updateCenterOfMass();
    this.updateAABB();
    this.updateFaceNormals();
};

/**
 * Removes child shape from shapes collection and updates all values. Returns true if shape was actually removed and false otherwise.
 *
 * @method removeChildShape
 * @param shape
 * @returns {boolean}
 */
Goblin.CompoundShape.prototype.removeChildShape = function( shape ) {
    var shapeWasRemoved = false;

    for ( var i = 0; i < this.child_shapes.length; i++ ) {
        if ( this.child_shapes[ i ].shape === shape ) {
            this.child_shapes[ i ] = this.child_shapes[ this.child_shapes.length - 1 ];
            this.child_shapes.pop();
            shapeWasRemoved = true;

            break;
        }
    }

    if ( !shapeWasRemoved ) {
        return false;
    }

    this.updateCenterOfMass();
    this.updateAABB();
    this.updateFaceNormals();
    return true;
};

/**
 * Updates shape's AABB to account for changes in nested shapes.
 *
 * @method updateAABB
 */
Goblin.CompoundShape.prototype.updateAABB = function() {
    this.calculateLocalAABB( this.aabb );
};

/**
 * Recomputes shape's center of mass.
 *
 * @method updateCenterOfMass
 */
Goblin.CompoundShape.prototype.updateCenterOfMass = function() {
    var i;

    if ( this.center_of_mass_override ) {
        this.center_of_mass.copy( this.center_of_mass_override );
    } else {
        this.center_of_mass.set( 0, 0, 0 );

        for ( i = 0; i < this.child_shapes.length; i++ ) {
            this.center_of_mass.add( this.child_shapes[ i ].local_position );
        }

        // watch out for NaN because of 0/0
        if ( this.child_shapes.length > 0 ) {
            this.center_of_mass.scale( 1.0 / this.child_shapes.length );
        }
    }

    for ( i = 0; i < this.child_shapes.length; i++ ) {
        this.child_shapes[ i ].center_of_mass.copy( this.center_of_mass );
        this.child_shapes[ i ].updateDerived();
    }
};

/**
 * Combines face normals from all child shapes
 */
Goblin.CompoundShape.prototype.updateFaceNormals = function() {
    this.faceNormals.length = 0;
    for ( var i = 0; i < this.child_shapes.length; i++ ) {
        this.faceNormals.push.apply( this.faceNormals, this.child_shapes[ i ].faceNormals );
    }

    Goblin.Collision.SAT.sanitizeAndRemoveDuplicatedVectors( this.faceNormals );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param {Goblin.AABB} aabb
 */
Goblin.CompoundShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = aabb.min.y = aabb.min.z = Infinity;
    aabb.max.x = aabb.max.y = aabb.max.z = -Infinity;

    if ( this.child_shapes.length === 0 ) {
        return;
    }

    var i, shape;

    for ( i = 0; i < this.child_shapes.length; i++ ) {
        shape = this.child_shapes[ i ];

        aabb.min.x = Math.min( aabb.min.x, shape.aabb.min.x );
        aabb.min.y = Math.min( aabb.min.y, shape.aabb.min.y );
        aabb.min.z = Math.min( aabb.min.z, shape.aabb.min.z );

        aabb.max.x = Math.max( aabb.max.x, shape.aabb.max.x );
        aabb.max.y = Math.max( aabb.max.y, shape.aabb.max.y );
        aabb.max.z = Math.max( aabb.max.z, shape.aabb.max.z );
    }
};

Goblin.CompoundShape.prototype.computeSteiner = function( vector, mass, tensor ) {
    tensor.e00 = mass * -( vector.y * vector.y + vector.z * vector.z );
    tensor.e10 = mass * vector.x * vector.y;
    tensor.e20 = mass * vector.x * vector.z;

    tensor.e01 = mass * vector.x * vector.y;
    tensor.e11 = mass * -( vector.x * vector.x + vector.z * vector.z );
    tensor.e21 = mass * vector.y * vector.z;

    tensor.e02 = mass * vector.x * vector.z;
    tensor.e12 = mass * vector.y * vector.z;
    tensor.e22 = mass * -( vector.x * vector.x + vector.y * vector.y );
};

Goblin.CompoundShape.prototype.getInertiaTensor = function( _mass ) {
    var tensor = new Goblin.Matrix3(),
        j = new Goblin.Matrix3(),
        i,
        child,
        child_tensor;

    if ( this.child_shapes.length === 0 || _mass === Infinity ) {
        // let's fall back to spherical shape in this case to avoid
        // nullifying inverse tensors
        tensor.e00 = tensor.e11 = tensor.e22 = _mass;
        return tensor;
    }

    var mass = _mass / this.child_shapes.length;

    // our origin is current center
    _tmp_vec3_1.copy( this.center_of_mass );

    for ( i = 0; i < this.child_shapes.length; i++ ) {
        child = this.child_shapes[ i ];

        _tmp_vec3_1.subtract( child.local_position );
        this.computeSteiner( _tmp_vec3_1, mass, j );

        _tmp_mat3_1.fromMatrix4( child.transform );
        child_tensor = child.shape.getInertiaTensor( mass );
        _tmp_mat3_1.transposeInto( _tmp_mat3_2 );
        _tmp_mat3_1.multiply( child_tensor );
        _tmp_mat3_1.multiply( _tmp_mat3_2 );

        tensor.e00 += _tmp_mat3_1.e00 - j.e00;
        tensor.e10 += _tmp_mat3_1.e10 - j.e10;
        tensor.e20 += _tmp_mat3_1.e20 - j.e20;
        tensor.e01 += _tmp_mat3_1.e01 - j.e01;
        tensor.e11 += _tmp_mat3_1.e11 - j.e11;
        tensor.e21 += _tmp_mat3_1.e21 - j.e21;
        tensor.e02 += _tmp_mat3_1.e02 - j.e02;
        tensor.e12 += _tmp_mat3_1.e12 - j.e12;
        tensor.e22 += _tmp_mat3_1.e22 - j.e22;

        _tmp_vec3_1.copy( child.local_position );
    }

    // move tensor "into" center of mass
    // because we don't "rotate" the shape around itself,
    // we only need to do a parallel transfer to get a proper inertia tensor
    // for the whole shape
    _tmp_vec3_1.subtract( this.center_of_mass );
    this.computeSteiner( _tmp_vec3_1, mass, j );

    tensor.e00 += -j.e00;
    tensor.e10 += -j.e10;
    tensor.e20 += -j.e20;
    tensor.e01 += -j.e01;
    tensor.e11 += -j.e11;
    tensor.e21 += -j.e21;
    tensor.e02 += -j.e02;
    tensor.e12 += -j.e12;
    tensor.e22 += -j.e22;

    return tensor;
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @param {Goblin.Vector3} ray_start - Start point of the segment
 * @param {Goblin.Vector3} ray_end - End point of the segment
 * @param {Goblin.Vector3} limit - Limit the amount of intersections (i.e. 1)
 * @return {Goblin.RayIntersection[]} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CompoundShape.prototype.rayIntersect = function( ray_start, ray_end, limit ) {
    var intersections = [],
        local_start = new Goblin.Vector3(),
        local_end = new Goblin.Vector3(),
        intersection,
        i, child;

    for ( i = 0; i < this.child_shapes.length; i++ ) {
        child = this.child_shapes[ i ];

        child.transform_inverse.transformVector3Into( ray_start, local_start );
        child.transform_inverse.transformVector3Into( ray_end, local_end );

        intersection = child.shape.rayIntersect( local_start, local_end );

        if ( intersection != null ) {
            intersection.shape = child.shape;

            child.transform.transformVector3( intersection.point );
            intersections.push( intersection );
        }

        if ( intersections.length >= limit ) {
            break;
        }
    }

    return intersections;
};