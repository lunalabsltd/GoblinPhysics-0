/**
 * Structure which holds information about a contact between two objects
 *
 * @constructor
 */
Goblin.ContactDetails = function() {
    this.uid = Goblin.Utility.getUid();

    /**
     * first body in the  contact
     *
     * @type {Goblin.RigidBody|Goblin.RigidBodyProxy}
     */
    this.object_a = null;

    /**
     * second body in the  contact
     *
     * @type {Goblin.RigidBody|Goblin.RigidBodyProxy}
     */
    this.object_b = null;

    /**
     * first body's version'
     *
     * @type {number}
     */
    this.object_a_version = -1;

    /**
     * second body's version
     *
     * @type {number}
     */
    this.object_b_version = -1;

    /**
     * first shape in the  contact
     *
     * @type {object}
     */
    this.shape_a = null;

    /**
     * second shape in the  contact
     *
     * @type {object}
     */
    this.shape_b = null;

    /**
     * if true then collision details (such as contact points / normals / etc) aren't calculated and set to theirs default values
     *
     * @type {boolean}
     */
    this.is_lightweight = false;

    /**
     * point of contact in world coordinates
     *
     * @type {Goblin.Vector3}
     */
    this.contact_point = new Goblin.Vector3();

    /**
     * contact point in local frame of `object_a`
     *
     * @type {Goblin.Vector3}
     */
    this.contact_point_in_a = new Goblin.Vector3();

    /**
     * contact point in local frame of `object_b`
     *
     * @type {Goblin.Vector3}
     */
    this.contact_point_in_b = new Goblin.Vector3();

    /**
     * normal vector, in world coordinates, of the contact
     *
     * @type {Goblin.Vector3}
     */
    this.contact_normal = new Goblin.Vector3();

    /**
     * how far the objects are penetrated at the point of contact
     *
     * @type {number}
     */
    this.penetration_depth = 0;

    /**
     * amount of restitution between the objects in contact
     *
     * @type {number}
     */
    this.restitution = 0;

    /**
     * amount of friction between the objects in contact
     *
     * @type {number}
     */
    this.friction = 0;

    /**
     * contact constraint
     */
    this.constraint = null;

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