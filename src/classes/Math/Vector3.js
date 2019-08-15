/**
 * @param {number=} x
 * @param {number=} y
 * @param {number=} z
 * @constructor
 */
Goblin.Vector3 = function( x, y, z ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

Goblin.Vector3.prototype = {
    set: function( x, y, z ) {
        this.x = x;
        this.y = y;
        this.z = z;
    },

    copy: function( v ) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    },

    add: function( v ) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    },

    addVectors: function( a, b ) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
    },

    subtract: function( v ) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
    },

    subtractVectors: function( a, b ) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
    },

    multiply: function( v ) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
    },

    multiplyVectors: function( a, b ) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
    },

    scale: function( scalar ) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
    },

    scaleVector: function( v, scalar ) {
        this.x = v.x * scalar;
        this.y = v.y * scalar;
        this.z = v.z * scalar;
    },

    lengthSquared: function() {
        return this.dot( this );
    },

    length: function() {
        return Math.sqrt( this.lengthSquared() );
    },

    normalize: function() {
        var length = this.length();
        if ( length === 0 ) {
            this.x = this.y = this.z = 0;
        } else {
            this.scale( 1 / length );
        }

        return length;
    },

    normalizeVector: function( v ) {
        this.copy( v );
        return this.normalize();
    },

    dot: function( v ) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    },

    cross: function( v ) {
        var x = this.x, y = this.y, z = this.z;

        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;
    },

    crossVectors: function( a, b ) {
        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;
    },

    distanceTo: function( v ) {
        var x = v.x - this.x,
            y = v.y - this.y,
            z = v.z - this.z;
        return Math.sqrt( x * x + y * y + z * z );
    },

    findOrthogonal: function( o1, o2 ) {
        var a, k;
        if ( Math.abs( this.z ) > 0.7071067811865476 ) {
            // choose p in y-z plane
            a = -this.y * this.y + this.z * this.z;
            k = 1 / Math.sqrt( a );
            o1.set( 0, -this.z * k, this.y * k );
            // set q = n x p
            o2.set( a * k, -this.x * o1.z, this.x * o1.y );
        } else {
            // choose p in x-y plane
            a = this.x * this.x + this.y * this.y;
            k = 1 / Math.sqrt( a );
            o1.set( -this.y * k, this.x * k, 0 );
            // set q = n x p
            o2.set( -this.z * o1.y, this.z * o1.x, a * k );
        }
    },

    /**
     * @param {Goblin.Vector3} another
     * @param {number=} epsilon
     * @returns {boolean}
     */
    equals: function( another, epsilon ) {
        epsilon = epsilon || Goblin.EPSILON;

        if ( this.x !== another.x && Math.abs( this.x - another.x ) > epsilon ) {
            return false;
        }
        if ( this.y !== another.y && Math.abs( this.y - another.y ) > epsilon ) {
            return false;
        }
        if ( this.z !== another.z && Math.abs( this.z - another.z ) > epsilon ) {
            return false;
        }

        return true;
    },

    /*
     * Whether all components of this vector are zero or close to zero
     * @returns {boolean}
     */
    isZero: function() {
        return ( this.x === 0 || Math.abs( this.x ) < Goblin.EPSILON ) &&
            ( this.y === 0 || Math.abs( this.y ) < Goblin.EPSILON ) &&
            ( this.z === 0 || Math.abs( this.z ) < Goblin.EPSILON );
    },

    /**
     * Checks if this vector is parallel to `other` (but not necessary have the same direction).
     * There is no need to normalize those vectors.
     *
     * @param {Goblin.Vector3} other
     * @return {boolean}
     */
    isParallelTo: ( function() {
        var cross = new Goblin.Vector3();

        return function( another ) {
            cross.crossVectors( this, another );
            return cross.isZero();
        };
    } )(),

    /**
     * Checks if this vector is parallel to `other` (but not necessary have the same direction).
     * This method works only if both vectors are normalized.
     *
     * @param {Goblin.Vector3} another
     * @returns {boolean}
     */
    isParallelToNormalized: function( another ) {
        var dotProduct = Math.abs( this.dot( another ) );
        return dotProduct > 1 - Goblin.EPSILON && dotProduct < 1 + Goblin.EPSILON;
    }
};