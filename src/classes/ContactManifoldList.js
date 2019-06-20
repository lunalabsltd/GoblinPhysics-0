/**
 * List/Manager of ContactManifolds
 *
 * @Class ContactManifoldList
 * @constructor
 */
Goblin.ContactManifoldList = function() {
	/**
	 * The first ContactManifold in the list
	 *
	 * @property first
	 * @type {ContactManifold}
	 */
	this.first = null;

	/**
	 * Private manifold cache for faster search
	 *
	 * @private
	 * @property cache
	 * @type {object}
	 */
	this.cache = {};
};

/**
 * Inserts a ContactManifold into the list
 *
 * @method insert
 * @param {ContactManifold} contact_manifold contact manifold to insert into the list
 */
Goblin.ContactManifoldList.prototype.insert = function( contact_manifold ) {
	var idA = contact_manifold.object_a.id > contact_manifold.object_b.id ? contact_manifold.object_b.id : contact_manifold.object_a.id;
	var idB = ( contact_manifold.object_a.id + contact_manifold.object_b.id ) - idA;
	contact_manifold.uid = idA + ":" + idB;

	// cache the manifold
	this.cache[ contact_manifold.uid ] = contact_manifold;

	// The list is completely unordered, throw the manifold at the beginning
	contact_manifold.next_manifold = this.first;
	this.first = contact_manifold;
};

/**
 * Deletes the manifold from the lsit.
 *
 * @method delete
 * @param {ContactManifold} previous contact manifold before the one to be removed
 * @param {ContactManifold} current contact manifold to remove from the list
 */
Goblin.ContactManifoldList.prototype.delete = function( previous, current ) {
	if ( previous == null ) {
		this.first = current.next_manifold;
	} else {
		previous.next_manifold = current.next_manifold;
	}

	this.cache[ current.uid ] = null;
};

/**
 * Returns (and possibly creates) a ContactManifold for the two rigid bodies
 *
 * @param {RigidBody} object_a
 * @param {RigidBoxy} object_b
 * @returns {ContactManifold}
 */
Goblin.ContactManifoldList.prototype.getManifoldForObjects = function( object_a, object_b ) {
	var idA = object_a.id > object_b.id ? object_b.id : object_a.id;
	var idB = ( object_a.id + object_b.id ) - idA;

	var uid = idA + ":" + idB;
	var manifold = this.cache[ uid ];

	if ( !manifold ) {
		// A manifold for these two objects does not exist, create one
		manifold = Goblin.ObjectPool.getObject( 'ContactManifold' );
		manifold.object_a = object_a;
		manifold.object_b = object_b;
		this.insert( manifold );
	}

	return manifold;
};