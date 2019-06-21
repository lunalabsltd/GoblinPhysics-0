/**
 * Structure which holds information about a contact between two objects
 *
 * @Class ContactDetails
 * @constructor
 */
Goblin.ContactDetails = function() {
	this.uid = Goblin.Utility.getUid();

	/**
	 * first body in the  contact
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this.object_a = null;

	/**
	 * second body in the  contact
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this.object_b = null;

	/**
	 * first body's version'
	 *
	 * @property object_a
	 * @type {Goblin.RigidBody}
	 */
	this.object_a_version = -1;

	/**
	 * second body's version
	 *
	 * @property object_b
	 * @type {Goblin.RigidBody}
	 */
	this.object_b_version = -1;

	/**
	 * first shape in the  contact
	 *
	 * @property shape_a
	 * @type {Goblin.Shape}
	 */
	this.shape_a = null;

	/**
	 * second shape in the  contact
	 *
	 * @property shape_b
	 * @type {Goblin.Shape}
	 */
	this.shape_b = null;

	/**
	 * point of contact in world coordinates
	 *
	 * @property contact_point
	 * @type {vec3}
	 */
	this.contact_point = new Goblin.Vector3();

	/**
	 * contact point in local frame of `object_a`
	 *
	 * @property contact_point_in_a
	 * @type {vec3}
	 */
	this.contact_point_in_a = new Goblin.Vector3();

	/**
	 * contact point in local frame of `object_b`
	 *
	 * @property contact_point_in_b
	 * @type {vec3}
	 */
	this.contact_point_in_b = new Goblin.Vector3();

	/**
	 * normal vector, in world coordinates, of the contact
	 *
	 * @property contact_normal
	 * @type {vec3}
	 */
	this.contact_normal = new Goblin.Vector3();

	/**
	 * how far the objects are penetrated at the point of contact
	 *
	 * @property penetration_depth
	 * @type {Number}
	 */
	this.penetration_depth = 0;

	/**
	 * amount of restitution between the objects in contact
	 *
	 * @property restitution
	 * @type {Number}
	 */
	this.restitution = 0;

	/**
	 * amount of friction between the objects in contact
	 *
	 * @property friction
	 * @type {*}
	 */
	this.friction = 0;

	/**
	 * general-purpose field to store axulary information.
	 *
	 * @private
	 * @property tag
	 * @type {*}
	 */
	this.tag = null;

	/**
	 * contact constraint associated with this contact.
	 *
	 * @private
	 * @property contactConstraint
	 * @type {*}
	 */
	this.contactConstraint = null;

	/**
	 * friction constraint associated with this contact.
	 *
	 * @private
	 * @property frictionConstraint
	 * @type {*}
	 */
	this.frictionConstraint = null;

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.ContactDetails );

Goblin.ContactDetails.prototype.destroy = function() {
	if ( this.contactConstraint !== null ) {
		this.contactConstraint.deactivate();
		this.contactConstraint = null;
	}

	if ( this.frictionConstraint !== null ) {
		this.frictionConstraint.deactivate();
		this.frictionConstraint = null;
	}

	Goblin.ObjectPool.freeObject( 'ContactDetails', this );
};