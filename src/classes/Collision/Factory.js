Goblin.Collision.Factory = {
    /**
     * returns a contact if objects collide with each other and null otherwise.
     *
     * @callback getContact
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectA
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectB
     * @param {boolean} doLightweightCollision - if true then only basic collision information will be returned (w/o normal, penetration depth, etc).
     * @returns {Goblin.ContactDetails|null}
     */

    /**
     * @type {Object<[number, getContact]>}
     */
    _collisionTable: null,

    _populateCollisionTable: function() {
        var table = {};
        table[ Goblin.Shapes.Type.SphereShape ] = Goblin.Collision.sphereSphere;
        table[ Goblin.Shapes.Type.SphereShape | Goblin.Shapes.Type.BoxShape ] = Goblin.BoxSphere;
        table[ Goblin.Shapes.Type.SphereShape | Goblin.Shapes.Type.CapsuleShape ] = Goblin.Collision.sphereCapsule;
        table[ Goblin.Shapes.Type.SphereShape | Goblin.Shapes.Type.ConvexHullShape ] = Goblin.Collision.sphereConvexHull;
        Goblin.Collision.Factory._collisionTable = table;
    },

    /**
     * @param {object} shapeA
     * @param {number} shapeA.shapeType
     * @param {object} shapeB
     * @param {number} shapeB.shapeType
     * @returns {getContact}
     */
    getCollisionMethod: function( shapeA, shapeB ) {
        if ( !this._collisionTable ) {
            // We can't do this during initialization because some shapes might not be added to Goblin object.
            // Can be resolved with a help of a decent build tool.
            this._populateCollisionTable();
        }

        return this._collisionTable[ shapeA.shapeType | shapeB.shapeType ] || Goblin.GjkEpa.findContact;
    }
};