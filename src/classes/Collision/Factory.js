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
     * @type {Array<[object, object, getContact]>}
     */
    _collisionTable: null,

    _populateCollisionTable: function() {
        Goblin.Collision.Factory._collisionTable = [
            [ Goblin.SphereShape, Goblin.SphereShape, Goblin.Collision.sphereSphere ],
            [ Goblin.SphereShape, Goblin.BoxShape, Goblin.BoxSphere ],
            [ Goblin.SphereShape, Goblin.CapsuleShape, Goblin.Collision.sphereCapsule ],
            [ Goblin.SphereShape, Goblin.ConvexHullShape, Goblin.Collision.sphereConvexHull ],
        ];
    },

    /**
     * @param {object} shapeA
     * @param {object} shapeA.shape
     * @param {object} shapeB
     * @param {object} shapeB.shape
     * @returns {getContact}
     */
    getCollisionMethod: function( shapeA, shapeB ) {
        if ( !this._collisionTable ) {
            // We can't do this during initialization because some shapes might not be added to Goblin object.
            // Can be resolved with a help of a decent build tool.
            this._populateCollisionTable();
        }

        for ( var i = 0; i < this._collisionTable.length; i++ ) {
            var collisionTableEntry = this._collisionTable[ i ];
            var shapeMatchesEntry = ( collisionTableEntry[ 0 ] === shapeA.shape && collisionTableEntry[ 1 ] === shapeB.shape ) ||
                ( collisionTableEntry[ 0 ] === shapeB.shape && collisionTableEntry[ 1 ] === shapeA.shape );

            if ( shapeMatchesEntry ) {
                return collisionTableEntry[ 2 ];
            }
        }

        return Goblin.GjkEpa.findContact;
    }
};