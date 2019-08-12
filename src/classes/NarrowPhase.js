/**
 * Takes possible contacts found by a broad phase and determines if they are legitimate contacts
 *
 * @class NarrowPhase
 * @constructor
 */
Goblin.NarrowPhase = function() {
    /**
     * holds all contacts which currently exist in the scene
     *
     * @property contact_manifolds
     * @type Goblin.ContactManifoldList
     */
    this.contact_manifolds = new Goblin.ContactManifoldList();
};

/**
 * Iterates over all contact manifolds, updating penetration depth & contact locations
 *
 * @method updateContactManifolds
 */
Goblin.NarrowPhase.prototype.updateContactManifolds = function() {
    var current = this.contact_manifolds.first,
        prev = null;

    while ( current !== null ) {
        current.update();

        if ( current.points.length === 0 ) {
            Goblin.ObjectPool.freeObject( 'ContactManifold', current );
            this.contact_manifolds.delete( prev, current );
            current = current.next_manifold;
        } else {
            prev = current;
            current = current.next_manifold;
        }
    }
};

Goblin.NarrowPhase.prototype.midPhase = function( object_a, object_b ) {
    var compound,
        other,
        permuted;

    if ( object_a.shape.shapeType === Goblin.Shapes.Type.CompoundShape ) {
        compound = object_a;
        other = object_b;
        permuted = !false;
    } else {
        compound = object_b;
        other = object_a;
        permuted = !true;
    }

    var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' ),
        child_shape, contact, result_contact;

    for ( var i = 0; i < compound.shape.child_shapes.length; i++ ) {
        child_shape = compound.shape.child_shapes[ i ];
        proxy.setFrom( compound, child_shape );

        if ( proxy.shape.shapeType === Goblin.Shapes.Type.CompoundShape || other.shape.shapeType === Goblin.Shapes.Type.CompoundShape ) {
            contact = this.midPhase( proxy, other );
        } else {
            contact = this.getContact( proxy, other );

            if ( contact != null && !contact.tag ) {
                var parent_a, parent_b;

                if ( contact.object_a === proxy ) {
                    contact.object_a = compound;
                    parent_a = proxy;
                    parent_b = other;
                } else {
                    contact.object_b = compound;
                    parent_a = other;
                    parent_b = proxy;

                    permuted = !permuted;
                }

                contact.object_a = parent_a;
                contact.object_b = parent_b;

                contact.shape_a = permuted ? other.shape : proxy.shape;
                contact.shape_b = permuted ? proxy.shape : other.shape;

                this.addContact( parent_a, parent_b, contact );
            }
        }

        result_contact = result_contact || contact;
    }

    Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );

    return result_contact;
};

Goblin.NarrowPhase.prototype.meshCollision = ( function() {
    var b_to_a = new Goblin.Matrix4(),
        tri_b = new Goblin.TriangleShape( new Goblin.Vector3(), new Goblin.Vector3(), new Goblin.Vector3() ),
        b_aabb = new Goblin.AABB(),
        b_right_aabb = new Goblin.AABB(),
        b_left_aabb = new Goblin.AABB();

    function meshMesh( object_a, object_b, context ) {
        // get matrix which converts from object_b's space to object_a
        b_to_a.copy( object_a.transform_inverse );
        b_to_a.multiply( object_b.transform );

        var contact;

        var shape_a = object_a.shape;
        var shape_b = object_b.shape;

        // traverse both objects' AABBs while they overlap, if two overlapping leaves are found then perform Triangle/Triangle intersection test
        var nodes = [ object_a.shape.hierarchy, object_b.shape.hierarchy ];
        //debugger;
        while ( nodes.length ) {
            var a_node = nodes.shift(),
                b_node = nodes.shift();

            if ( a_node.isLeaf() && b_node.isLeaf() ) {
                // Both sides are triangles, do intersection test
                // convert node_b's triangle into node_a's frame
                b_to_a.transformVector3Into( b_node.object.a, tri_b.a );
                b_to_a.transformVector3Into( b_node.object.b, tri_b.b );
                b_to_a.transformVector3Into( b_node.object.c, tri_b.c );
                _tmp_vec3_1.subtractVectors( tri_b.b, tri_b.a );
                _tmp_vec3_2.subtractVectors( tri_b.c, tri_b.a );
                tri_b.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
                tri_b.normal.normalize();

                var do_lightweight_collision = context._shouldPerformLightweightCollisionBetween( object_a, object_b );
                contact = Goblin.TriangleTriangle( a_node.object, tri_b, do_lightweight_collision );

                if ( contact != null ) {
                    object_a.transform.rotateVector3( contact.contact_normal );
                    object_a.transform.transformVector3( contact.contact_point );

                    object_a.transform.transformVector3( contact.contact_point_in_b );
                    object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

                    contact.shape_a = shape_a;
                    contact.shape_b = shape_b;

                    contact.object_a = object_a;
                    contact.object_b = object_b;

                    context.addContact( object_a, object_b, contact );
                }
            } else if ( a_node.isLeaf() ) {
                // just a_node is a leaf
                b_left_aabb.transform( b_node.left.aabb, b_to_a );
                if ( a_node.aabb.intersects( b_left_aabb ) ) {
                    nodes.push( a_node, b_node.left );
                }
                b_right_aabb.transform( b_node.right.aabb, b_to_a );
                if ( a_node.aabb.intersects( b_right_aabb ) ) {
                    nodes.push( a_node, b_node.right );
                }
            } else if ( b_node.isLeaf() ) {
                // just b_node is a leaf
                b_aabb.transform( b_node.aabb, b_to_a );
                if ( b_aabb.intersects( a_node.left.aabb ) ) {
                    nodes.push( a_node.left, b_node );
                }
                if ( b_aabb.intersects( a_node.right.aabb ) ) {
                    nodes.push( a_node.right, b_node );
                }
            } else {
                // neither node is a branch
                b_left_aabb.transform( b_node.left.aabb, b_to_a );
                b_right_aabb.transform( b_node.right.aabb, b_to_a );
                if ( a_node.left.aabb.intersects( b_left_aabb ) ) {
                    nodes.push( a_node.left, b_node.left );
                }
                if ( a_node.left.aabb.intersects( b_right_aabb ) ) {
                    nodes.push( a_node.left, b_node.right );
                }
                if ( a_node.right.aabb.intersects( b_left_aabb ) ) {
                    nodes.push( a_node.right, b_node.left );
                }
                if ( a_node.right.aabb.intersects( b_right_aabb ) ) {
                    nodes.push( a_node.right, b_node.right );
                }
            }
        }

        return contact;
    }

    function triangleConvex( triangle, mesh, convex, do_lightweight_collision ) {
        // Create proxy to convert convex into mesh's space
        var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' );

        var child_shape = new Goblin.CompoundShapeChild( triangle, new Goblin.Vector3(), new Goblin.Quaternion() );
        proxy.setFrom( mesh, child_shape );

        var contact = Goblin.GjkEpa.findContact( proxy, convex, do_lightweight_collision );

        Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );

        return contact;
    }

    var meshConvex = ( function() {
        var convex_to_mesh = new Goblin.Matrix4(),
            convex_aabb_in_mesh = new Goblin.AABB();

        return function meshConvex( mesh, convex, context ) {
            // Find matrix that converts convex into mesh space
            convex_to_mesh.copy( convex.transform );
            convex_to_mesh.multiply( mesh.transform_inverse );

            convex_aabb_in_mesh.transform( convex.aabb, mesh.transform_inverse );

            // Traverse the BHV in mesh
            var pending_nodes = [ mesh.shape.hierarchy ],
                contact, result_contact,
                node;
            while ( ( node = pending_nodes.shift() ) ) {
                if ( node.aabb.intersects( convex_aabb_in_mesh ) ) {
                    if ( node.isLeaf() ) {
                        // Check node for collision
                        var do_lightweight_collision = context._shouldPerformLightweightCollisionBetween( mesh, convex );
                        contact = triangleConvex( node.object, mesh, convex, do_lightweight_collision );
                        if ( contact != null ) {
                            contact.shape_a = mesh.shape;
                            contact.shape_b = convex.shape;

                            context.addContact( contact.object_a, contact.object_b, contact );
                        }

                        result_contact = result_contact || contact;
                    } else {
                        pending_nodes.push( node.left, node.right );
                    }
                }
            }

            return result_contact;
        };
    } )();

    return function meshCollision( object_a, object_b ) {
        var a_is_mesh = object_a.shape.shapeType === Goblin.Shapes.Type.MeshShape,
            b_is_mesh = object_b.shape.shapeType === Goblin.Shapes.Type.MeshShape;

        if ( a_is_mesh && b_is_mesh ) {
            return meshMesh( object_a, object_b, this );
        } else {
            if ( a_is_mesh ) {
                return meshConvex( object_a, object_b, this );
            } else {
                return meshConvex( object_b, object_a, this );
            }
        }
    };
} )();

/**
 * Tests two objects for contact
 *
 * @method getContact
 * @param {Goblin.RigidBody} object_a
 * @param {Goblin.RigidBody} object_b
 */
Goblin.NarrowPhase.prototype.getContact = function( object_a, object_b ) {
    if ( !object_a.aabb.intersects( object_b.aabb ) ) {
        return null;
    }

    if ( object_a.shape.shapeType === Goblin.Shapes.Type.CompoundShape || object_b.shape.shapeType === Goblin.Shapes.Type.CompoundShape ) {
        return this.midPhase( object_a, object_b );
    }

    if ( object_a.shape.shapeType === Goblin.Shapes.Type.MeshShape || object_b.shape.shapeType === Goblin.Shapes.Type.MeshShape ) {
        return this.meshCollision( object_a, object_b );
    }

    var doLightweightCollision = this._shouldPerformLightweightCollisionBetween( object_a, object_b );
    var collisionMethod = Goblin.Collision.Factory.getCollisionMethod( object_a.shape, object_b.shape );
    var contact = collisionMethod( object_a, object_b, doLightweightCollision );

    // store original shapes that collided on the objects
    // so that it's possible to deduce which actual colliders
    // were involved
    if ( contact ) {
        contact.shape_a = object_a.shape;
        contact.shape_b = object_b.shape;
    }

    return contact;
};

Goblin.NarrowPhase.prototype.addContact = function( object_a, object_b, contact ) {
    // check if both objects have a world; if they don't it means we are raycasting
    if ( object_a.world === null || object_b.world === null ) {
        return;
    }

    // check if already saw this contact
    // FIXME EN-206 to revise the below
    if ( contact.tag ) {
        return;
    }

    contact.tag = true;

    while ( contact.object_a.parent != null ) {
        contact.object_a.shape_data.transform.transformVector3( contact.contact_point_in_a );
        contact.object_a = contact.object_a.parent;
    }

    while ( contact.object_b.parent != null ) {
        contact.object_b.shape_data.transform.transformVector3( contact.contact_point_in_b );
        contact.object_b = contact.object_b.parent;
    }

    // "Lightweight" contacts aka contacts for triggers are used only to generate events and don't need to be stored or processed.
    if ( contact.is_lightweight ) {
        contact.object_a.onTriggerContactEnter && contact.object_a.onTriggerContactEnter( contact );
        return;
    }

    contact.restitution = Goblin.CollisionUtils.combineRestitutions( contact.object_a, contact.object_b, contact.shape_a, contact.shape_b );
    contact.friction = Goblin.CollisionUtils.combineFrictions( contact.object_a, contact.object_b, contact.shape_a, contact.shape_b );

    this.contact_manifolds.getManifoldForObjects( contact.object_a, contact.object_b ).addContact( contact );
};

/**
 * Loops over the passed array of object pairs which may be in contact
 * valid contacts are put in this object's `contacts` property
 *
 * @param possible_contacts {Array}
 */
Goblin.NarrowPhase.prototype.generateContacts = function( possible_contacts ) {
    var i,
        contact,
        possible_contacts_length = possible_contacts.length;

    // Make sure all of the manifolds are up to date
    this.updateContactManifolds();

    for ( i = 0; i < possible_contacts_length; i++ ) {
        contact = this.getContact( possible_contacts[ i ][ 0 ], possible_contacts[ i ][ 1 ] );

        if ( contact ) {
            this.addContact( contact.object_a, contact.object_b, contact );
        }
    }
};

Goblin.NarrowPhase.prototype.removeBody = function( body ) {
    var manifold = this.contact_manifolds.first;

    while ( manifold != null ) {
        if ( manifold.object_a === body || manifold.object_b === body ) {
            for ( var i = 0; i < manifold.points.length; i++ ) {
                manifold.points[ i ].destroy();
            }
            manifold.points.length = 0;
        }

        manifold = manifold.next;
    }
};

/**
 *
 * @param body_a {Goblin.RigidBody|Goblin.RigidBodyProxy}
 * @param body_b {Goblin.RigidBody|Goblin.RigidBodyProxy}
 * @returns {boolean}
 * @private
 */
Goblin.NarrowPhase.prototype._shouldPerformLightweightCollisionBetween = function( body_a, body_b ) {
    return body_a.is_trigger || body_b.is_trigger;
};