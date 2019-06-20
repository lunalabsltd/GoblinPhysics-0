/**
* Goblin Physics
*
* @module Goblin
*/
(function(){
	var Goblin = {};
Goblin.Matrix3 = function( e00, e01, e02, e10, e11, e12, e20, e21, e22 ) {
	this.e00 = e00 || 0;
	this.e01 = e01 || 0;
	this.e02 = e02 || 0;

	this.e10 = e10 || 0;
	this.e11 = e11 || 0;
	this.e12 = e12 || 0;

	this.e20 = e20 || 0;
	this.e21 = e21 || 0;
	this.e22 = e22 || 0;
};

Goblin.Matrix3.prototype = {
	identity: function() {
		this.e00 = 1;
		this.e01 = 0;
		this.e02 = 0;

		this.e10 = 0;
		this.e11 = 1;
		this.e12 = 0;

		this.e20 = 0;
		this.e21 = 0;
		this.e22 = 1;
	},

	fromMatrix4: function( m ) {
		this.e00 = m.e00;
		this.e01 = m.e01;
		this.e02 = m.e02;

		this.e10 = m.e10;
		this.e11 = m.e11;
		this.e12 = m.e12;

		this.e20 = m.e20;
		this.e21 = m.e21;
		this.e22 = m.e22;
	},

	fromQuaternion: function( q ) {
		var x2 = q.x + q.x,
			y2 = q.y + q.y,
			z2 = q.z + q.z,

			xx = q.x * x2,
			xy = q.x * y2,
			xz = q.x * z2,
			yy = q.y * y2,
			yz = q.y * z2,
			zz = q.z * z2,
			wx = q.w * x2,
			wy = q.w * y2,
			wz = q.w * z2;

		this.e00 = 1 - (yy + zz);
		this.e10 = xy + wz;
		this.e20 = xz - wy;

		this.e01 = xy - wz;
		this.e11 = 1 - (xx + zz);
		this.e21 = yz + wx;

		this.e02 = xz + wy;
		this.e12 = yz - wx;
		this.e22 = 1 - (xx + yy);
	},

	transformVector3: function( v ) {
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z;
	},

	transformVector3Into: function( v, dest ) {
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z;
	},

	transposeInto: function( m ) {
		m.e00 = this.e00;
		m.e10 = this.e01;
		m.e20 = this.e02;
		m.e01 = this.e10;
		m.e11 = this.e11;
		m.e21 = this.e12;
		m.e02 = this.e20;
		m.e12 = this.e21;
		m.e22 = this.e22;
	},

	invert: function() {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b01 = a22 * a11 - a12 * a21,
			b11 = -a22 * a10 + a12 * a20,
			b21 = a21 * a10 - a11 * a20,

			d = a00 * b01 + a01 * b11 + a02 * b21,
			id;

		if ( !d ) {
			return true;
		}
		id = 1 / d;

		this.e00 = b01 * id;
		this.e01 = (-a22 * a01 + a02 * a21) * id;
		this.e02 = (a12 * a01 - a02 * a11) * id;
		this.e10 = b11 * id;
		this.e11 = (a22 * a00 - a02 * a20) * id;
		this.e12 = (-a12 * a00 + a02 * a10) * id;
		this.e20 = b21 * id;
		this.e21 = (-a21 * a00 + a01 * a20) * id;
		this.e22 = (a11 * a00 - a01 * a10) * id;

		return true;
	},

	invertInto: function( m ) {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b01 = a22 * a11 - a12 * a21,
			b11 = -a22 * a10 + a12 * a20,
			b21 = a21 * a10 - a11 * a20,

			d = a00 * b01 + a01 * b11 + a02 * b21,
			id;

		if ( !d ) {
			return false;
		}
		id = 1 / d;

		m.e00 = b01 * id;
		m.e01 = (-a22 * a01 + a02 * a21) * id;
		m.e02 = (a12 * a01 - a02 * a11) * id;
		m.e10 = b11 * id;
		m.e11 = (a22 * a00 - a02 * a20) * id;
		m.e12 = (-a12 * a00 + a02 * a10) * id;
		m.e20 = b21 * id;
		m.e21 = (-a21 * a00 + a01 * a20) * id;
		m.e22 = (a11 * a00 - a01 * a10) * id;

		return true;
	},

	multiply: function( m ) {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02,
			a10 = this.e10, a11 = this.e11, a12 = this.e12,
			a20 = this.e20, a21 = this.e21, a22 = this.e22,

			b00 = m.e00, b01 = m.e01, b02 = m.e02,
			b10 = m.e10, b11 = m.e11, b12 = m.e12,
			b20 = m.e20, b21 = m.e21, b22 = m.e22;

		this.e00 = b00 * a00 + b10 * a01 + b20 * a02;
		this.e10 = b00 * a10 + b10 * a11 + b20 * a12;
		this.e20 = b00 * a20 + b10 * a21 + b20 * a22;

		this.e01 = b01 * a00 + b11 * a01 + b21 * a02;
		this.e11 = b01 * a10 + b11 * a11 + b21 * a12;
		this.e21 = b01 * a20 + b11 * a21 + b21 * a22;

		this.e02 = b02 * a00 + b12 * a01 + b22 * a02;
		this.e12 = b02 * a10 + b12 * a11 + b22 * a12;
		this.e22 = b02 * a20 + b12 * a21 + b22 * a22;
	},

	multiplyFrom: function( a, b ) {
		var a00 = a.e00, a01 = a.e01, a02 = a.e02,
			a10 = a.e10, a11 = a.e11, a12 = a.e12,
			a20 = a.e20, a21 = a.e21, a22 = a.e22,

			b00 = b.e00, b01 = b.e01, b02 = b.e02,
			b10 = b.e10, b11 = b.e11, b12 = b.e12,
			b20 = b.e20, b21 = b.e21, b22 = b.e22;

		this.e00 = b00 * a00 + b10 * a01 + b20 * a02;
		this.e10 = b00 * a10 + b10 * a11 + b20 * a12;
		this.e20 = b00 * a20 + b10 * a21 + b20 * a22;

		this.e01 = b01 * a00 + b11 * a01 + b21 * a02;
		this.e11 = b01 * a10 + b11 * a11 + b21 * a12;
		this.e21 = b01 * a20 + b11 * a21 + b21 * a22;

		this.e02 = b02 * a00 + b12 * a01 + b22 * a02;
		this.e12 = b02 * a10 + b12 * a11 + b22 * a12;
		this.e22 = b02 * a20 + b12 * a21 + b22 * a22;
	}
};
Goblin.Matrix4 = function() {
	this.e00 = 0;
	this.e01 = 0;
	this.e02 = 0;
	this.e03 = 0;

	this.e10 = 0;
	this.e11 = 0;
	this.e12 = 0;
	this.e13 = 0;

	this.e20 = 0;
	this.e21 = 0;
	this.e22 = 0;
	this.e23 = 0;

	this.e30 = 0;
	this.e31 = 0;
	this.e32 = 0;
	this.e33 = 0;
};

Goblin.Matrix4.prototype = {
	identity: function() {
		this.e00 = 1;
		this.e01 = 0;
		this.e02 = 0;
		this.e03 = 0;

		this.e10 = 0;
		this.e11 = 1;
		this.e12 = 0;
		this.e13 = 0;

		this.e20 = 0;
		this.e21 = 0;
		this.e22 = 1;
		this.e23 = 0;

		this.e30 = 0;
		this.e31 = 0;
		this.e32 = 0;
		this.e33 = 1;
	},

	copy: function( m ) {
		this.e00 = m.e00;
		this.e01 = m.e01;
		this.e02 = m.e02;
		this.e03 = m.e03;

		this.e10 = m.e10;
		this.e11 = m.e11;
		this.e12 = m.e12;
		this.e13 = m.e13;

		this.e20 = m.e20;
		this.e21 = m.e21;
		this.e22 = m.e22;
		this.e23 = m.e23;

		this.e30 = m.e30;
		this.e31 = m.e31;
		this.e32 = m.e32;
		this.e33 = m.e33;
	},

	getTranslation: function (result) {
		result = result || new Goblin.Vector3();
		result.set( this.e03, this.e13, this.e23 );

        return result;
    },

    getRotation: function (rotation) {
        rotation = rotation || new Goblin.Quaternion();
        rotation.setFromMat4( this );

        return rotation;
    },

	makeTransform: function( rotation, translation ) {
		// Setup rotation
		var x2 = rotation.x + rotation.x,
			y2 = rotation.y + rotation.y,
			z2 = rotation.z + rotation.z,
			xx = rotation.x * x2,
			xy = rotation.x * y2,
			xz = rotation.x * z2,
			yy = rotation.y * y2,
			yz = rotation.y * z2,
			zz = rotation.z * z2,
			wx = rotation.w * x2,
			wy = rotation.w * y2,
			wz = rotation.w * z2;

		this.e00 = 1 - ( yy + zz );
		this.e10 = xy + wz;
		this.e20 = xz - wy;
		this.e30 = 0;
		this.e01 = xy - wz;
		this.e11 = 1 - (xx + zz);
		this.e21 = yz + wx;
		this.e31 = 0;
		this.e02 = xz + wy;
		this.e12 = yz - wx;
		this.e22 = 1 - (xx + yy);
		this.e32 = 0;

		// Translation
		this.e03 = translation.x;
		this.e13 = translation.y;
		this.e23 = translation.z;
		this.e33 = 1;
	},

	transformVector3: function( v ) {
		// Technically this should compute the `w` term and divide the resulting vector
		// components by `w` to homogenize but we don't scale so `w` is just `1`
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z + this.e03;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z + this.e13;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z + this.e23;
	},

	transformVector3Into: function( v, dest ) {
		// Technically this should compute the `w` term and divide the resulting vector
		// components by `w` to homogenize but we don't scale so `w` is just `1`
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z + this.e03;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z + this.e13;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z + this.e23;
	},

	rotateVector3: function( v ) {
		var x = v.x,
			y = v.y,
			z = v.z;
		v.x = this.e00 * x + this.e01 * y + this.e02 * z;
		v.y = this.e10 * x + this.e11 * y + this.e12 * z;
		v.z = this.e20 * x + this.e21 * y + this.e22 * z;
	},

	rotateVector3Into: function( v, dest ) {
		dest.x = this.e00 * v.x + this.e01 * v.y + this.e02 * v.z;
		dest.y = this.e10 * v.x + this.e11 * v.y + this.e12 * v.z;
		dest.z = this.e20 * v.x + this.e21 * v.y + this.e22 * v.z;
	},

	invert: function() {
		var a00 = this.e00, a01 = this.e01, a02 = this.e02, a03 = this.e03,
			a10 = this.e10, a11 = this.e11, a12 = this.e12, a13 = this.e13,
			a20 = this.e20, a21 = this.e21, a22 = this.e22, a23 = this.e23,
			a30 = this.e30, a31 = this.e31, a32 = this.e32, a33 = this.e33,

			b00 = a00 * a11 - a01 * a10,
			b01 = a00 * a12 - a02 * a10,
			b02 = a00 * a13 - a03 * a10,
			b03 = a01 * a12 - a02 * a11,
			b04 = a01 * a13 - a03 * a11,
			b05 = a02 * a13 - a03 * a12,
			b06 = a20 * a31 - a21 * a30,
			b07 = a20 * a32 - a22 * a30,
			b08 = a20 * a33 - a23 * a30,
			b09 = a21 * a32 - a22 * a31,
			b10 = a21 * a33 - a23 * a31,
			b11 = a22 * a33 - a23 * a32,

			d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
			invDet;

		// Calculate the determinant
		if ( !d ) {
			return false;
		}
		invDet = 1 / d;

		this.e00 = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
		this.e01 = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
		this.e02 = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
		this.e03 = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
		this.e10 = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
		this.e11 = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
		this.e12 = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
		this.e13 = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
		this.e20 = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
		this.e21 = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
		this.e22 = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
		this.e23 = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
		this.e30 = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
		this.e31 = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
		this.e32 = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
		this.e33 = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

		return true;
	},

	invertInto: function( m ) {
		var a00 = this.e00, a01 = this.e10, a02 = this.e20, a03 = this.e30,
			a10 = this.e01, a11 = this.e11, a12 = this.e21, a13 = this.e31,
			a20 = this.e02, a21 = this.e12, a22 = this.e22, a23 = this.e32,
			a30 = this.e03, a31 = this.e13, a32 = this.e23, a33 = this.e33,

			b00 = a00 * a11 - a01 * a10,
			b01 = a00 * a12 - a02 * a10,
			b02 = a00 * a13 - a03 * a10,
			b03 = a01 * a12 - a02 * a11,
			b04 = a01 * a13 - a03 * a11,
			b05 = a02 * a13 - a03 * a12,
			b06 = a20 * a31 - a21 * a30,
			b07 = a20 * a32 - a22 * a30,
			b08 = a20 * a33 - a23 * a30,
			b09 = a21 * a32 - a22 * a31,
			b10 = a21 * a33 - a23 * a31,
			b11 = a22 * a33 - a23 * a32,

			d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
			invDet;

		// Calculate the determinant
		if ( !d ) {
			return false;
		}
		invDet = 1 / d;

		m.e00 = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
		m.e10 = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
		m.e20 = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
		m.e30 = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
		m.e01 = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
		m.e11 = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
		m.e21 = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
		m.e31 = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
		m.e02 = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
		m.e12 = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
		m.e22 = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
		m.e32 = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
		m.e03 = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
		m.e13 = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
		m.e23 = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
		m.e33 = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
	},

	multiply: function( m ) {
		// Cache the matrix values (makes for huge speed increases!)
		var a00 = this.e00, a01 = this.e10, a02 = this.e20, a03 = this.e30;
		var a10 = this.e01, a11 = this.e11, a12 = this.e21, a13 = this.e31;
		var a20 = this.e02, a21 = this.e12, a22 = this.e22, a23 = this.e32;
		var a30 = this.e03, a31 = this.e13, a32 = this.e23, a33 = this.e33;

		// Cache only the current line of the second matrix
		var b0  = m.e00, b1 = m.e10, b2 = m.e20, b3 = m.e30;
		this.e00 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e10 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e20 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e30 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e01;
		b1 = m.e11;
		b2 = m.e21;
		b3 = m.e31;
		this.e01 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e11 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e21 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e31 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e02;
		b1 = m.e12;
		b2 = m.e22;
		b3 = m.e32;
		this.e02 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e12 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e22 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e32 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

		b0 = m.e03;
		b1 = m.e13;
		b2 = m.e23;
		b3 = m.e33;
		this.e03 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
		this.e13 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
		this.e23 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
		this.e33 = b0*a03 + b1*a13 + b2*a23 + b3*a33;
	}
};

Object.defineProperty( Goblin.Matrix4.prototype, 'data', {
	
	/**
	 * FIXME EN-77 to remove the below
	 * Gets the matrix data as float array.
	 */
	get: function () {
		return [
			this.e00,
			this.e10,
			this.e20,
			this.e30,

			this.e01,
			this.e11,
			this.e21,
			this.e31,

			this.e02,
			this.e12,
			this.e22,
			this.e32,

			this.e03,
			this.e13,
			this.e23,
			this.e33
		];
	}

} );
Goblin.Quaternion = function( x, y, z, w ) {
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.z = z != null ? z : 0;
	this.w = w != null ? w : 1;
	this.normalize();
};

Goblin.Quaternion.prototype = {
	set: function( x, y, z, w ) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	},

	copy: function( q ) {
		this.x = q.x;
		this.y = q.y;
		this.z = q.z;
		this.w = q.w;
	},

	toString: function () {
		return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
	},

	multiply: function( q ) {
		var x = this.x, y = this.y, z = this.z, w = this.w,
			qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		this.x = x * qw + w * qx + y * qz - z * qy;
		this.y = y * qw + w * qy + z * qx - x * qz;
		this.z = z * qw + w * qz + x * qy - y * qx;
		this.w = w * qw - x * qx - y * qy - z * qz;
	},

	multiplyQuaternions: function( a, b ) {
		this.x = a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y;
		this.y = a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z;
		this.z = a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x;
		this.w = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
	},

	normalize: function() {
		var x = this.x, y = this.y, z = this.z, w = this.w,
			length = Math.sqrt( x * x + y * y + z * z + w * w );

		if ( length === 0) {
			this.x = this.y = this.z = this.w = 0;
		} else {
			length = 1 / length;
			this.x *= length;
			this.y *= length;
			this.z *= length;
			this.w *= length;
		}
	},

	invertQuaternion: function( q ) {
		var x = q.x, y = q.y, z = q.z, w = q.w,
			dot = x * x + y * y + z * z + w * w;

		if ( dot === 0 ) {
			this.x = this.y = this.z = this.w = 0;
		} else {
			var inv_dot = -1 / dot;
			this.x = q.x * inv_dot;
			this.y = q.y *  inv_dot;
			this.z = q.z *  inv_dot;
			this.w = q.w *  -inv_dot;
		}
	},

	transformVector3: function( v ) {
		var x = v.x, y = v.y, z = v.z,
			qx = this.x, qy = this.y, qz = this.z, qw = this.w,

		// calculate quat * vec
			ix = qw * x + qy * z - qz * y,
			iy = qw * y + qz * x - qx * z,
			iz = qw * z + qx * y - qy * x,
			iw = -qx * x - qy * y - qz * z;

		// calculate result * inverse quat
		v.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		v.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		v.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	},

	transformVector3Into: function( v, dest ) {
		var x = v.x, y = v.y, z = v.z,
			qx = this.x, qy = this.y, qz = this.z, qw = this.w,

		// calculate quat * vec
			ix = qw * x + qy * z - qz * y,
			iy = qw * y + qz * x - qx * z,
			iz = qw * z + qx * y - qy * x,
			iw = -qx * x - qy * y - qz * z;

		// calculate result * inverse quat
		dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	},

	setFromMat4: function (m) {
        var m00, m01, m02, m10, m11, m12, m20, m21, m22,
            tr, s, rs, lx, ly, lz;

        // Cache matrix values for super-speed
        m00 = m.e00;
        m01 = m.e10;
        m02 = m.e20;
        m10 = m.e01;
        m11 = m.e11;
        m12 = m.e21;
        m20 = m.e02;
        m21 = m.e12;
        m22 = m.e22;

        // Remove the scale from the matrix
        lx = 1 / Math.sqrt(m00 * m00 + m01 * m01 + m02 * m02);
        ly = 1 / Math.sqrt(m10 * m10 + m11 * m11 + m12 * m12);
        lz = 1 / Math.sqrt(m20 * m20 + m21 * m21 + m22 * m22);

        m00 *= lx;
        m01 *= lx;
        m02 *= lx;
        m10 *= ly;
        m11 *= ly;
        m12 *= ly;
        m20 *= lz;
        m21 *= lz;
        m22 *= lz;

        // http://www.cs.ucr.edu/~vbz/resources/quatut.pdf

        tr = m00 + m11 + m22;
        if (tr >= 0) {
            s = Math.sqrt(tr + 1);
            this.w = s * 0.5;
            s = 0.5 / s;
            this.x = (m12 - m21) * s;
            this.y = (m20 - m02) * s;
            this.z = (m01 - m10) * s;
        } else {
            if (m00 > m11) {
                if (m00 > m22) {
                    // XDiagDomMatrix
                    rs = (m00 - (m11 + m22)) + 1;
                    rs = Math.sqrt(rs);

                    this.x = rs * 0.5;
                    rs = 0.5 / rs;
                    this.w = (m12 - m21) * rs;
                    this.y = (m01 + m10) * rs;
                    this.z = (m02 + m20) * rs;
                } else {
                    // ZDiagDomMatrix
                    rs = (m22 - (m00 + m11)) + 1;
                    rs = Math.sqrt(rs);

                    this.z = rs * 0.5;
                    rs = 0.5 / rs;
                    this.w = (m01 - m10) * rs;
                    this.x = (m20 + m02) * rs;
                    this.y = (m21 + m12) * rs;
                }
            } else if (m11 > m22) {
                // YDiagDomMatrix
                rs = (m11 - (m22 + m00)) + 1;
                rs = Math.sqrt(rs);

                this.y = rs * 0.5;
                rs = 0.5 / rs;
                this.w = (m20 - m02) * rs;
                this.z = (m12 + m21) * rs;
                this.x = (m10 + m01) * rs;
            } else {
                // ZDiagDomMatrix
                rs = (m22 - (m00 + m11)) + 1;
                rs = Math.sqrt(rs);

                this.z = rs * 0.5;
                rs = 0.5 / rs;
                this.w = (m01 - m10) * rs;
                this.x = (m20 + m02) * rs;
                this.y = (m21 + m12) * rs;
            }
        }

        return this;
    },

	angleBetween: function( q ) {
		/*_tmp_quat4_1.invertQuaternion( this );
		_tmp_quat4_1.multiply( q );
		_tmp_vec3_1.set( _tmp_quat4_1.x, _tmp_quat4_1.y, _tmp_quat4_1.z );
		return 2 * Math.atan2( _tmp_vec3_1.length(), Math.abs( _tmp_quat4_1.w ) );*/

		return 2 * Math.acos( this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w );
	},

	signedAngleBetween: function( q, normal ) {
		if ( Math.abs(x_axis.dot( normal )) < 0.5 ) {
			_tmp_vec3_1.set( 1, 0, 0 );
		} else {
			_tmp_vec3_1.set( 0, 0, 1 );
		}
		this.transformVector3Into( _tmp_vec3_1, _tmp_vec3_2 );
		q.transformVector3Into( _tmp_vec3_1, _tmp_vec3_3 );

		_tmp_vec3_1.crossVectors( _tmp_vec3_2, _tmp_vec3_3 );
		return Math.atan2(
			normal.dot( _tmp_vec3_1 ),
			_tmp_vec3_2.dot( _tmp_vec3_3 )
		);
	}
};

Goblin.Quaternion.IDENTITY = new Goblin.Quaternion();
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
	},

	normalizeVector: function( v ) {
		this.copy( v );
		this.normalize();
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
		return Math.sqrt( x*x + y*y + z*z );
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
		}
		else {
			// choose p in x-y plane
			a = this.x * this.x + this.y * this.y;
			k = 1 / Math.sqrt( a );
			o1.set( -this.y * k, this.x * k, 0 );
			// set q = n x p
			o2.set( -this.z * o1.y, this.z * o1.x, a * k );
		}
	}
};
Goblin.EPSILON = 0.00001;

var _tmp_vec3_1 = new Goblin.Vector3(),
	_tmp_vec3_2 = new Goblin.Vector3(),
	_tmp_vec3_3 = new Goblin.Vector3(),

	x_axis = new Goblin.Vector3( 1, 0, 0 ),
	y_axis = new Goblin.Vector3( 0, 1, 0 ),
	z_axis = new Goblin.Vector3( 0, 0, 1 ),

	_tmp_quat4_1 = new Goblin.Quaternion(),
	_tmp_quat4_2 = new Goblin.Quaternion(),

	_tmp_mat3_1 = new Goblin.Matrix3(),
	_tmp_mat3_2 = new Goblin.Matrix3(),

    _tmp_mat4_1 = new Goblin.Matrix4();
Goblin.EventEmitter = function(){};

Goblin.EventEmitter.prototype = {
	addListener: function( event, listener ) {
		if ( this.listeners[event] == null ) {
			this.listeners[event] = [];
		}

		if ( this.listeners[event].indexOf( listener ) === -1 ) {
			this.listeners[event].push( listener );
		}
	},

	removeListener: function( event, listener ) {
		if ( this.listeners[event] == null ) {
			this.listeners[event] = [];
		}

		var index = this.listeners[event].indexOf( listener );
		if ( index !== -1 ) {
			this.listeners[event].splice( index, 1 );
		}
	},

	removeAllListeners: function() {
		var listeners = Object.keys( this.listeners );
		for ( var i = 0; i < listeners.length; i++ ) {
			this.listeners[listeners[i]].length = 0;
		}
	},

	emit: function( event ) {
		var event_arguments = Array.prototype.slice.call( arguments, 1 ),
			ret_value;

		if ( this.listeners[event] instanceof Array ) {
			var listeners = this.listeners[event].slice();
			for ( var i = 0; i < listeners.length; i++ ) {
				ret_value = listeners[i].apply( this, event_arguments );
				if ( ret_value === false ) {
					return false;
				}
			}
		}
	}
};

Goblin.EventEmitter.apply = function( klass ) {
	klass.prototype.addListener = Goblin.EventEmitter.prototype.addListener;
	klass.prototype.removeListener = Goblin.EventEmitter.prototype.removeListener;
	klass.prototype.removeAllListeners = Goblin.EventEmitter.prototype.removeAllListeners;
	klass.prototype.emit = Goblin.EventEmitter.prototype.emit;
};
/**
 * Represents a rigid body
 *
 * @class RigidBody
 * @constructor
 * @param shape
 * @param mass {Number}
 */
Goblin.RigidBody = (function() {
	var body_count = 0;

	return function( shape, mass ) {
		/**
		 * goblin ID of the body
		 *
		 * @property id
		 * @type {Number}
		 */
		this.id = body_count++;

		/**
		 * body version that changes upon significant updates (collider movements,
		 * additions and deletions)
		 *
		 * @property version
		 * @type {Number}
		 */
		this.version = 0;

		/**
		 * shape definition for this rigid body
		 *
		 * @property shape
		 */
		this.shape = shape;

        /**
         * axis-aligned bounding box enclosing this body
         *
         * @property aabb
         * @type {AABB}
         */
        this.aabb = new Goblin.AABB();

		/**
		 * the rigid body's mass
		 *
		 * @property mass
		 * @type {Number}
		 * @default Infinity
		 */
		this._mass = mass || Infinity;
		this._mass_inverted = 1 / mass;

		/**
		 * the flag indicating the body is static
		 *
		 * @private
		 * @type {Boolean}
		 * @default false
		 */
		this._is_static = false;

		/**
		 * the flag indicating the body is kinematic
		 *
		 * @property
		 * @type {Boolean}
		 * @default false
		 */
		this._is_kinematic = false;

		/**
		 * the flag indicating the body is affected by gravity
		 *
		 * @property
		 * @type {Boolean}
		 * @default false
		 */
		this.use_gravity = true;

		/**
		 * the rigid body's current position
		 *
		 * @property position
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.position = new Goblin.Vector3();

		/**
		 * rotation of the rigid body
		 *
		 * @type {quat4}
		 */
		this.rotation = new Goblin.Quaternion( 0, 0, 0, 1 );

		/**
		 * the rigid body's current linear velocity
		 *
		 * @property linear_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.linear_velocity = new Goblin.Vector3();

		/**
		 * the rigid body's current angular velocity
		 *
		 * @property angular_velocity
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.angular_velocity = new Goblin.Vector3();

		/**
		 * transformation matrix transforming points from object space to world space
		 *
		 * @property transform
		 * @type {mat4}
		 */
		this.transform = new Goblin.Matrix4();
		this.transform.identity();

		/**
		 * transformation matrix transforming points from world space to object space
		 *
		 * @property transform_inverse
		 * @type {mat4}
		 */
		this.transform_inverse = new Goblin.Matrix4();
		this.transform_inverse.identity();

		this._computeInertiaTensor();

		this.inverseInertiaTensor = new Goblin.Matrix3();
		this.inertiaTensor.invertInto( this.inverseInertiaTensor );

		this.inertiaTensorWorldFrame = new Goblin.Matrix3();

		this.inverseInertiaTensorWorldFrame = new Goblin.Matrix3();

		/**
		 * the rigid body's current acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 */
		this.acceleration = new Goblin.Vector3();

		/**
		 * amount of restitution this object has
		 *
		 * @property restitution
		 * @type {Number}
		 * @default 0.1
		 */
		this.restitution = 0.0;

		/**
		 * amount of friction this object has
		 *
		 * @property friction
		 * @type {Number}
		 * @default 0.5
		 */
		this.friction = 0.6;

		/**
		 * the rigid body's custom gravity
		 *
		 * @property gravity
		 * @type {vec3}
		 * @default null
		 * @private
		 */
		this.gravity = null;

		/**
		 * the rigid body's custom linear acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default null
		 * @private
		 */
		this.linear_acceleration = new Goblin.Vector3();

		/**
		 * the rigid body's custom angular acceleration
		 *
		 * @property acceleration
		 * @type {vec3}
		 * @default null
		 * @private
		 */
		this.angular_acceleration = new Goblin.Vector3();

		/**
		 * proportion of linear velocity lost per second ( 0.0 - 1.0 )
		 *
		 * @property linear_damping
		 * @type {Number}
		 */
		this.linear_damping = 0;

		/**
		 * proportion of angular velocity lost per second ( 0.0 - 1.0 )
		 *
		 * @property angular_damping
		 * @type {Number}
		 */
		this.angular_damping = 0;

		/**
		 * multiplier of linear force applied to this body
		 *
		 * @property linear_factor
		 * @type {Goblin.Vector3}
		 */
		this.linear_factor = new Goblin.Vector3( 1, 1, 1 );

		/**
		 * multiplier of angular force applied to this body
		 *
		 * @property angular_factor
		 * @type {Goblin.Vector3}
		 */
		this.angular_factor = new Goblin.Vector3( 1, 1, 1 );

		/**
		 * Position of center of mass for this body
		 *
		 * @property center_of_mass
		 * @type {Goblin.Vector3}
		 */
		this.center_of_mass = new Goblin.Vector3( 0, 0, 0 );

		/**
		 * the world to which the rigid body has been added,
		 * this is set when the rigid body is added to a world
		 *
		 * @property world
		 * @type {Goblin.World}
		 * @default null
		 */
		this.world = null;

		/**
		 * the layer the object belongs to.
		 *
		 * @property layer
		 * @type {any}
		 * @default null
		 * @private
		 */
		this._layer = null;

		/**
		 * all resultant force accumulated by the rigid body
		 * this force is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_force = new Goblin.Vector3();

		/**
		 * All resultant torque accumulated by the rigid body
		 * this torque is applied in the next occurring integration
		 *
		 * @property accumulated_force
		 * @type {vec3}
		 * @default [ 0, 0, 0 ]
		 * @private
		 */
		this.accumulated_torque = new Goblin.Vector3();

		/**
		 * World transform of the body (which might differ from center-of-mass transform)
		 */
		this._world_transform = new Goblin.Matrix4();

		// Used by the constraint solver to determine what impulse needs to be added to the body
		this.push_velocity = new Goblin.Vector3();
		this.turn_velocity = new Goblin.Vector3();
		this.solver_impulse = new Float64Array( 6 );

		this.listeners = {};
	};
})();
Goblin.EventEmitter.apply( Goblin.RigidBody );

Object.defineProperty(
	Goblin.RigidBody.prototype,
	'mass',
	{
		get: function() {
			return this._mass;
		},
		set: function( n ) {
			this._mass = n;
			this._mass_inverted = 1 / n;
			this.updateShapeDerivedValues();
		}
	}
);

/**
 * Gets or sets body's kinematic flag hinting the solver the body doesn't obey
 * physics forces, but can be moved externally.
 *
 * @property is_kinematic
 */
Object.defineProperty(
	Goblin.RigidBody.prototype,
	'is_kinematic',
	{
		get: function() {
			return this._is_kinematic;
		},
		set: function( value ) {
			if ( value !== this._is_kinematic ) {
				if ( this.world ) {
					this.world.updateObjectKinematicFlag( this, value );
				}

				this._is_kinematic = value;
			}

			this.updateShapeDerivedValues();
		}
	}
);

/**
 * Gets or sets body's layer, which allows for fine-tuning collisions.
 *
 * @property layer
 */
Object.defineProperty(
	Goblin.RigidBody.prototype,
	'layer',
	{
		get: function() {
			return this._layer;
		},
		set: function( value ) {
			if ( value !== this._layer ) {
				if ( this.world ) {
					this.world.updateObjectLayer( this, value );
				}

				this.version++;
				this._layer = value;
			}
		}
	}
);

/**
 * Gets or sets body's static flag indicating it should be considered
 * "rarely" moved and can be excluded from static-static collision pairs.
 *
 * @property is_static
 */
Object.defineProperty(
	Goblin.RigidBody.prototype,
	'is_static',
	{
		get: function() {
			return this._is_static;
		},
		set: function( value ) {
			if ( value !== this._is_static ) {
				if ( this.world ) {
					this.world.updateObjectStaticFlag( this, value );
				}

				this._is_static = value;
			}
		}
	}
);

Goblin.RigidBody.prototype.markDynamic = function () {
	this.world.broadphase.markDynamic( this );
};

/**
 * Updates body's position and rotation from arguments supplied.
 *
 * @method setTransform
 * @param position {Goblin.Vector3} position variable to set
 * @param rotation {Goblin.Quaternion} rotation variable to set
 */
Goblin.RigidBody.prototype.setTransform = function ( position, rotation ) {
	// thanks god it's rigid - rotation is the same across any point
	this.rotation.copy( rotation );

	// but, center of mass can be offset - we need to account for that
	this.rotation.transformVector3Into( this.center_of_mass, _tmp_vec3_1 );
	this.position.copy( position );
	this.position.add( _tmp_vec3_1 );
};

/**
 * Extracts body's position and rotation into arguments supplied.
 *
 * @method getTransform
 * @param position {Goblin.Vector3} position variable to update
 * @param rotation {Goblin.Quaternion} rotation variable to update
 */
Goblin.RigidBody.prototype.getTransform = function ( position, rotation ) {
	this.updateDerived();

	// thanks god it's rigid - rotation is the same across any point
	rotation.copy( this.rotation );

	// but, center of mass can be offset - we need to account for that
	this.rotation.transformVector3Into( this.center_of_mass, _tmp_vec3_1 );
	position.copy( this.position );
	position.sub( _tmp_vec3_1 );
};

/**
 * Updates bodies' derived values to reflect changes in shape (i.e. new children in compound shape).
 *
 * @method updateShapeDerivedValues
 */
Goblin.RigidBody.prototype.updateShapeDerivedValues = function () {
	// update body version
	this.version++;

	if ( !this.shape.center_of_mass ) {
		this._computeInertiaTensor();
		return;
	}

	// re-calc center of mass
	this.shape.updateCenterOfMass();

	// Update AABB
	this.shape.updateAABB();
	this.aabb.transform( this.shape.aabb, this.transform );

	this._computeInertiaTensor();

	// compute the vector of CoM offset
	_tmp_vec3_1.copy( this.shape.center_of_mass );
	_tmp_vec3_1.subtract( this.center_of_mass );

	// rotate the vector with body's rotation
	this.rotation.transformVector3Into( _tmp_vec3_1, _tmp_vec3_2 );

	// shift the position by the vector of CoM movement
	this.position.add( _tmp_vec3_2 );

	// update CoM
	this.center_of_mass.copy( this.shape.center_of_mass );
};

/**
 * Updates body's tensor of inertia.
 *
 * @private
 * @method _computeInertiaTensor
 */
Goblin.RigidBody.prototype._computeInertiaTensor = function () {
	this.inertiaTensor = this.shape.getInertiaTensor( this._is_kinematic ? Infinity : this._mass );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.RigidBody.prototype.findSupportPoint = (function(){
	var local_direction = new Goblin.Vector3();

	return function( direction, support_point ) {
		// Convert direction into local frame for the shape
		this.transform_inverse.rotateVector3Into( direction, local_direction );

		this.shape.findSupportPoint( local_direction, support_point );

		// Convert from the shape's local coordinates to world coordinates
		this.transform.transformVector3( support_point );
	};
})();

/**
 * Checks if a ray segment intersects with the object
 *
 * @method rayIntersect
 * @param ray_start {vec3} start point of the segment
 * @param ray_end {vec3} end point of the segment
 * @param limit {Number} Limit the amount of intersections by this number
 * @param intersection_list {Array} array to append intersection to
 */
Goblin.RigidBody.prototype.rayIntersect = (function(){
	var local_start = new Goblin.Vector3(),
		local_end = new Goblin.Vector3();

	return function( ray_start, ray_end, limit, intersection_list ) {
		// transform start & end into local coordinates
		this.transform_inverse.transformVector3Into( ray_start, local_start );
		this.transform_inverse.transformVector3Into( ray_end, local_end );

		// Intersect with shape
		var intersections = this.shape.rayIntersect( local_start, local_end, limit - intersection_list.length );

		if ( intersections !== null && !Array.isArray( intersections ) ) {
			intersections = [ intersections ];
		}

		for ( var i = 0; i < intersections.length; i++ ) {
			var intersection = intersections[ i ];

			intersection.object = this;

			this.transform.transformVector3( intersection.point );
			this.transform.rotateVector3( intersection.normal );

			intersection_list.push( intersection );
		}
	};
})();

/**
 * Updates the rigid body's position, velocity, and acceleration
 *
 * @method integrate
 * @param timestep {Number} time, in seconds, to use in integration
 */
Goblin.RigidBody.prototype.integrate = function( timestep ) {
	if ( this._mass === Infinity ) {
		return;
	}

	// Add accumulated linear force
	_tmp_vec3_1.scaleVector( this.accumulated_force, this._mass_inverted );
	_tmp_vec3_1.multiply( this.linear_factor );
	this.linear_velocity.add( _tmp_vec3_1 );

	// Add accumulated angular force
	this.inverseInertiaTensorWorldFrame.transformVector3Into( this.accumulated_torque, _tmp_vec3_1 );
	_tmp_vec3_1.multiply( this.angular_factor );
	this.angular_velocity.add( _tmp_vec3_1 );

	// Apply damping
	this.linear_velocity.scale( Math.max(0, 1.0 - this.linear_damping * timestep ) );
	this.angular_velocity.scale( Math.max(0, 1.0 - this.angular_damping * timestep ) );

	// Update position & rotation
	this.integratePosition( timestep, this.linear_velocity );
	this.integrateRotation( timestep, this.angular_velocity );
	
	// Clear accumulated forces
	this.accumulated_force.x = this.accumulated_force.y = this.accumulated_force.z = 0;
	this.accumulated_torque.x = this.accumulated_torque.y = this.accumulated_torque.z = 0;
	this.solver_impulse[0] = this.solver_impulse[1] = this.solver_impulse[2] = this.solver_impulse[3] = this.solver_impulse[4] = this.solver_impulse[5] = 0;
	this.push_velocity.x = this.push_velocity.y = this.push_velocity.z = 0;
	this.turn_velocity.x = this.turn_velocity.y = this.turn_velocity.z = 0;
};

/**
 * Updates the rigid body's position being given timestamp and linear_velocity.
 *
 * @method integratePosition
 * @param timestep 			{Number} 			time, in seconds, to use in integration
 * @param linear_velocity 	{Goblin.Vector3} 	linear velocity, m/s
 */
Goblin.RigidBody.prototype.integratePosition = function( timestep, linear_velocity ) {
	_tmp_vec3_1.scaleVector( linear_velocity, timestep );
	this.position.add( _tmp_vec3_1 );
};

/**
 * Updates the rigid body's rotation being given timestamp and angular_velocity.
 *
 * @method integratePosition
 * @param timestep 			{Number} 			time, in seconds, to use in integration
 * @param angular_velocity 	{Goblin.Vector3} 	angular velocity (torque vector, rad/s)
 */
Goblin.RigidBody.prototype.integrateRotation = function( timestep, angular_velocity ) {
	// Update rotation
	_tmp_vec3_1.copy( angular_velocity );
	var fAngle = _tmp_vec3_1.length();

	// limit the angular motion per time step
	if (fAngle * timestep > (Math.PI / 4)) {
		fAngle = (Math.PI / 4) / timestep;
	}

	// choose integration based on angular value
	if (fAngle < 0.001) {
		// use Taylor's expansions of sync function
		_tmp_vec3_1.scale( 0.5 * timestep - (timestep * timestep * timestep) * 0.020833333333 * fAngle * fAngle );
	} else {
		// sync(fAngle) = sin(c*fAngle)/t
		_tmp_vec3_1.scale( Math.sin( 0.5 * fAngle * timestep ) / fAngle );
	}

	// compose rotational quaternion
	_tmp_quat4_1.x = _tmp_vec3_1.x;
	_tmp_quat4_1.y = _tmp_vec3_1.y;
	_tmp_quat4_1.z = _tmp_vec3_1.z;
	_tmp_quat4_1.w = Math.cos( fAngle * timestep * 0.5 );
	
	// rotate the body
	_tmp_quat4_1.multiply( this.rotation );
	//_tmp_quat4_1.normalize();

	this.rotation.copy( _tmp_quat4_1 );
};

/**
 * Sets a custom gravity value for this rigid_body
 *
 * @method setGravity
 * @param x {Number} gravity to apply on x axis
 * @param y {Number} gravity to apply on y axis
 * @param z {Number} gravity to apply on z axis
 */
Goblin.RigidBody.prototype.setGravity = function( x, y, z ) {
	if ( this.gravity ) {
		this.gravity.x = x;
		this.gravity.y = y;
		this.gravity.z = z;
	} else {
		this.gravity = new Goblin.Vector3( x, y, z );
	}
};

/**
 * Directly adds linear velocity to the body
 *
 * @method applyImpulse
 * @param impulse {vec3} linear velocity to add to the body
 */
Goblin.RigidBody.prototype.applyImpulse = function( impulse ) {
	_tmp_vec3_1.multiplyVectors( impulse, this.linear_factor );
	this.linear_velocity.add( _tmp_vec3_1 );
};

/**
 * Adds linear acceleration to the body, ignoring its mass.
 *
 * @method addLinearAcceleration
 * @param impulse {vec3} acceleration to add to the body
 */
Goblin.RigidBody.prototype.addLinearAcceleration = function( a ) {
	this.linear_acceleration.add( a );
};

/**
 * Adds linear acceleration to the body, ignoring its mass.
 *
 * @method addLinearAcceleration
 * @param impulse {vec3} acceleration to add to the body
 */
Goblin.RigidBody.prototype.addAngularAcceleration = function( a ) {
	this.angular_acceleration.add( a );
};

/**
 * Adds a linear force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyForce = function( force ) {
	this.accumulated_force.add( force );
};

/**
 * Adds a angular force to the rigid_body which will be used only for the next integration
 *
 * @method applyForce
 * @param force {vec3} force to apply to the rigid_body
 */
Goblin.RigidBody.prototype.applyTorque = function( torque ) {
	this.accumulated_torque.add( torque );
};

/**
 * Applies the vector `force` at world coordinate `point`
 *
 * @method applyForceAtWorldPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} world coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtWorldPoint = function( force, point ) {
	_tmp_vec3_1.copy( point );
	_tmp_vec3_1.subtract( this.position );
	_tmp_vec3_1.cross( force );

	this.accumulated_force.add( force );
	this.accumulated_torque.add( _tmp_vec3_1 );
};

/**
 * Applies vector `force` to body at position `point` in body's frame
 *
 * @method applyForceAtLocalPoint
 * @param force {vec3} Force to apply
 * @param point {vec3} local frame coordinates where force originates
 */
Goblin.RigidBody.prototype.applyForceAtLocalPoint = function( force, point ) {
	this.transform.transformVector3Into( point, _tmp_vec3_2 );
	this.applyForceAtWorldPoint( force, _tmp_vec3_2 );
};

Goblin.RigidBody.prototype.getVelocityInLocalPoint = function( point, out ) {
	if ( this._mass === Infinity ) {
		out.set( 0, 0, 0 );
	} else {
		out.copy( this.angular_velocity );
		out.cross( point );
		out.add( this.linear_velocity );
	}
};

/**
 * Sets the rigid body's transformation matrix to the current position and rotation
 *
 * @method updateDerived
 */
Goblin.RigidBody.prototype.updateDerived = function() {
	// normalize rotation
	this.rotation.normalize();

	// update this.transform and this.transform_inverse
	this.transform.makeTransform( this.rotation, this.position );
	this.transform.invertInto( this.transform_inverse );

	// Update the world frame inertia tensor and inverse
	if ( this._mass !== Infinity ) {
		_tmp_mat3_1.fromMatrix4( this.transform_inverse );
		_tmp_mat3_1.transposeInto( _tmp_mat3_2 );
		_tmp_mat3_2.multiply( this.inertiaTensor );
		this.inertiaTensorWorldFrame.multiplyFrom( _tmp_mat3_2, _tmp_mat3_1 );

		this.inertiaTensorWorldFrame.invertInto( this.inverseInertiaTensorWorldFrame );
	}

	// Update AABB
	this.aabb.transform( this.shape.aabb, this.transform );
};
/**
 * adds a constant force to associated objects
 *
 * @class ForceGenerator
 * @constructor
 * @param force {vec3} [optional] force the generator applies
*/
Goblin.ForceGenerator = function( force ) {
	/**
	* force which will be applied to affected objects
	*
	* @property force
	* @type {vec3}
	* @default [ 0, 0, 0 ]
	*/
	this.force = force || new Goblin.Vector3();

	/**
	* whether or not the force generator is enabled
	*
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this.enabled = true;

	/**
	* array of objects affected by the generator
	*
	* @property affected
	* @type {Array}
	* @default []
	* @private
	*/
	this.affected = [];
};
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin.ForceGenerator.prototype.applyForce = function() {
	if ( !this.enabled ) {
		return;
	}

	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		this.affected[i].applyForce( this.force );
	}
};
/**
* enables the force generator
*
* @method enable
*/
Goblin.ForceGenerator.prototype.enable = function() {
	this.enabled = true;
};
/**
* disables the force generator
*
* @method disable
*/
Goblin.ForceGenerator.prototype.disable = function() {
	this.enabled = false;
};
/**
* adds an object to be affected by the generator
*
* @method affect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin.ForceGenerator.prototype.affect = function( object ) {
	var i, affected_count;
	// Make sure this object isn't already affected
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			return;
		}
	}

	this.affected.push( object );
};
/**
* removes an object from being affected by the generator
*
* @method unaffect
* @param object {Mixed} object to be affected, must have `applyForce` method
*/
Goblin.ForceGenerator.prototype.unaffect = function( object ) {
	var i, affected_count;
	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		if ( this.affected[i] === object ) {
			this.affected.splice( i, 1 );
			return;
		}
	}
};
/**
 * Performs a n^2 check of all collision objects to see if any could be in contact
 *
 * @class BasicBroadphase
 * @constructor
 */
Goblin.BasicBroadphase = function() {
	/**
	 * Holds all of the collision objects that the broadphase is responsible for
	 *
	 * @property bodies
	 * @type {Array}
	 */
	this.bodies = [];

	/**
	 * Array of all (current) collision pairs between the broadphases' bodies
	 *
	 * @property collision_pairs
	 * @type {Array}
	 */
	this.collision_pairs = [];
};

/**
 * Gets the bodies that might be affected by physics (and thus need to be
 * integrated).
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.getDynamicBodies = function() {
	return this.bodies;
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.addBody = function( body ) {
	this.bodies.push( body );
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicBroadphase.prototype.removeBody = function( body ) {
	this._removeBodyFrom( body, this.bodies );
};

/**
 * Removes a body from the the given array.
 *
 * @method removeBody
 * @param body {RigidBody} body to remove
 */
Goblin.BasicBroadphase.prototype._removeBodyFrom = function ( body, bodies ) {
	var i, body_count = bodies.length;

	for ( i = 0; i < body_count; i++ ) {
		if ( bodies[ i ] === body ) {
			// we don't care about the order, so just copy first element into
			// body's slot and call shift (which is fastest way to remove the element
			// from an array as per http://jsperf.com/splicing-a-single-value/19)
			bodies[ i ] = bodies[ 0 ];
			bodies.shift();
			break;
		}
	}
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method update
 */
Goblin.BasicBroadphase.prototype.update = function() {
	var i, j,
		object_a, object_b,
		bodies_count = this.bodies.length;

	// Clear any old contact pairs
	this.collision_pairs.length = 0;

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_a = this.bodies[i];

		for ( j = 0; j < bodies_count; j++ ) {
			if ( i <= j ) {
				// if i < j then we have already performed this check
				// if i === j then the two objects are the same and can't be in contact
				continue;
			}

			object_b = this.bodies[j];

			if( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
				if ( object_a.aabb.intersects( object_b.aabb ) ) {
					this.collision_pairs.push( [ object_b, object_a ] );
				}
			}
		}
	}
};

/**
 * Returns an array of objects the given body may be colliding with
 *
 * @method intersectsWith
 * @param object_a {RigidBody}
 * @return Array<RigidBody>
 */
Goblin.BasicBroadphase.prototype.intersectsWith = function( object_a ) {
	var i, object_b,
		bodies_count = this.bodies.length,
		intersections = [];

	// Loop over all collision objects and check for overlapping boundary spheres
	for ( i = 0; i < bodies_count; i++ ) {
		object_b = this.bodies[i];

		if ( object_a === object_b ) {
			continue;
		}

		if ( object_a.aabb.intersects( object_b.aabb ) ) {
			intersections.push( object_b );
		}
	}

	return intersections;
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {Array<RayIntersection>} an unsorted array of intersections
 */
Goblin.BasicBroadphase.prototype.rayIntersect = function( start, end ) {
	var bodies_count = this.bodies.length,
		i, body,
		intersections = [];
	for ( i = 0; i < bodies_count; i++ ) {
		body = this.bodies[i];
		if ( body.aabb.testRayIntersect( start, end ) ) {
			body.rayIntersect( start, end, intersections );
		}
	}

	return intersections;
};
/**
 * Works exactly like basic broadphase (and inherits from it), but keeps objects
 * in separate pools: static and moving ones. Static objects never collide with
 * each other.
 *
 * @class BasicPooledBroadphase
 * @constructor
 */
Goblin.BasicPooledBroadphase = function() {
    Goblin.BasicBroadphase.call( this );

    /**
     * Holds static collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.static_bodies = [];

    /**
     * Holds dynamic collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.dynamic_bodies = [];

    /**
     * Holds kinematic collision objects that the broadphase is responsible for
     *
     * @property static_bodies
     * @type {Array}
     */
    this.kinematic_bodies = [];

    /**
     * Holds 32 layers of objects
     *
     * @property _layers
     * @type {Array}
     * @private
     */
    this._layers = new Array(32);

    // set up empty arrays for each layer
    for ( var i = 0; i < 32; i++ ) {
        this._layers[ i ] = [];
    }
};

// Set up inheritance
Goblin.BasicPooledBroadphase.prototype = Object.create( Goblin.BasicBroadphase.prototype );

/**
 * Gets the bodies that might be affected by physics (and thus need to be
 * integrated).
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.getDynamicBodies = function() {
    return this.dynamic_bodies;
};

/**
 * Updates body's collision layer
 *
 * @method updateObjectLayer
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param new_layer  {Number} New layer that is about to be set
 */
Goblin.BasicBroadphase.prototype.updateObjectLayer = function ( rigid_body, new_layer ) {
    if ( rigid_body._layer !== null && this._layers[ rigid_body._layer ] ) {
        this._removeBodyFrom( rigid_body, this._layers[ rigid_body._layer ] );
    }

    if ( new_layer !== null ) {
        this._layers[ new_layer ].push( rigid_body );
    }
};

/**
 * Returns the pool the object belongs to (dynamic, static or kinematic).
 *
 * @method _getBodyPool
 * @param rigid_body {Goblin.RigidBody} Rigid body to get the pool for
 */
Goblin.BasicBroadphase.prototype._getBodyPool = function ( rigid_body ) {
    if ( rigid_body._is_static ) {
        return this.static_bodies;
    } else if ( rigid_body._is_kinematic ) {
        return this.kinematic_bodies;
    } else {
        return this.dynamic_bodies;
    }
};

Goblin.BasicBroadphase.prototype.markDynamic = function ( rigid_body ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    this.dynamic_bodies.push( rigid_body );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectStaticFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object should belong to static phase
 */
Goblin.BasicBroadphase.prototype.updateObjectStaticFlag = function ( rigid_body, is_static ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    rigid_body._is_static = is_static;
    this._getBodyPool( rigid_body ).push( rigid_body );
};

/**
 * Updates body's kinematic flag
 *
 * @method updateObjectKinematicFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object should belong to kinematic phase
 */
Goblin.BasicBroadphase.prototype.updateObjectKinematicFlag = function ( rigid_body, is_kinematic ) {
    this._removeBodyFrom( rigid_body, this._getBodyPool( rigid_body ) );
    rigid_body._is_kinematic = is_kinematic;
    this._getBodyPool( rigid_body ).push( rigid_body );
};

/**
 * Adds a body to the broadphase for contact checking
 *
 * @method addBody
 * @param body {RigidBody} body to add to the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.addBody = function( body ) {
    // call inherited logic
    Goblin.BasicBroadphase.prototype.addBody.call( this, body );
    
    // add the body to a proper pool
    this._getBodyPool( body ).push( body );

    // if the layer is set, add the body to a proper layer
    if ( body._layer !== null ) {
        this._layers[ body._layer ].push( body );
    }
};

/**
 * Checks if a ray segment intersects with objects in the world
 *
 * @method rayIntersect
 * @param start         {vec3}      Start point of the segment
 * @param end           {vec3}      End point of the segment
 * @param limit         {Number}    Limit the amount of intersections (i.e. 1)
 * @param layerMask     {Number}    The bitmask of layers to check
 * @return {Array<RayIntersection>} an unsorted array of intersections
 */
Goblin.BasicPooledBroadphase.prototype.rayIntersect = (function () {
    // FIXME EN-77 should eliminate the below
    var _start = new Goblin.Vector3();
    var _end = new Goblin.Vector3();

    return function( start, end, limit, layerMask ) {
        // copy vector values over to allow for duck typing
        _start.copy( start );
        _end.copy( end );

        var intersections = [];

        for ( var i = 0; i < this._layers.length; i++ ) {
            var objects = this._layers[ i ];

            if ( layerMask && ( layerMask & (1 << i) ) === 0 ) {
                continue;
            }

            for ( var j = 0; j < objects.length; j++ ) {
                var body = objects[ j ];

                // first test AABB intersection (~ broad phase)
                if ( body.aabb.testRayIntersect( _start, _end ) ) {
                    // if AABB intersects, as the body about inner intersections
                    body.rayIntersect( _start, _end, limit, intersections );
                }

                if ( limit && ( intersections.length >= limit ) ) {
                    return intersections.slice( 0, limit );
                }
            }
        }

        intersections.sort( function ( a, b ) {
            return a.t - b.t;
        } );

        return intersections;
    };
})();

/**
 * Returns an array of objects the given body may be colliding with
 *
 * @method intersectsWith
 * @param {Goblin.RigidBody}    object_a      The object to check hits with
 * @param {Number}              layer_mask    The layer mask to check the objects against, 0 for any.
 * @return Array<RigidBody>
 */
Goblin.BasicBroadphase.prototype.intersectsWith = function( object_a, layer_mask ) {
    var intersections = [];

    for ( var i = 0; i < this._layers.length; i++ ) {
        var objects = this._layers[ i ];

        if ( layer_mask && ( layer_mask & (1 << i) ) === 0 ) {
            continue;
        }

        for ( var j = 0; j < objects.length; j++ ) {
            var object_b = objects[ j ];

            if ( object_a === object_b ) {
                continue;
            }

            if ( object_a.aabb.intersects( object_b.aabb ) ) {
                intersections.push( object_b );
            }
        }
    }

    return intersections;
};

/**
 * Removes a body from the broadphase contact checking
 *
 * @method removeBody
 * @param body {RigidBody} body to remove from the broadphase contact checking
 */
Goblin.BasicPooledBroadphase.prototype.removeBody = function( body ) {
    // call inherited logic
    Goblin.BasicBroadphase.prototype.removeBody.call( this, body );
    // remove body from a speicifc pool
    this._removeBodyFrom( body, this._getBodyPool( body ) );
};

/**
 * Checks all collision objects to find any which are possibly in contact
 *  resulting contact pairs are held in the object's `collision_pairs` property
 *
 * @method update
 */
Goblin.BasicPooledBroadphase.prototype.update = function() {
    // local variables to make linter happy
    var i, j, object_a, object_b;

    // Clear any old contact pairs
    this.collision_pairs.length = 0;

    for ( i = 0; i < this.dynamic_bodies.length; i++ ) {
        object_a = this.dynamic_bodies[ i ];

        // check dynamic-dynamic collisions
        for ( j = i + 1; j < this.dynamic_bodies.length; j++ ) {
            object_b = this.dynamic_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }

        // check collisions with static bodies
        // FIXME EN-84 to use BVH here
        for ( j = 0; j < this.static_bodies.length; j++ ) {
            object_b = this.static_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }

        // check collisions with kinematic bodies
        // FIXME EN-84 to use BVH here
        for ( j = 0; j < this.kinematic_bodies.length; j++ ) {
            object_b = this.kinematic_bodies[ j ];

            if ( Goblin.CollisionUtils.canBodiesCollide( object_a, object_b ) ) {
                if ( object_a.aabb.intersects( object_b.aabb ) ) {
                    this.collision_pairs.push( [ object_b, object_a ] );
                }
            }
        }
    }
};

(function(){
	/**
	 * @class SAPMarker
	 * @private
	 * @param {SAPMarker.TYPES} marker_type
	 * @param {RigidBody} body
	 * @param {Number} position
	 * @constructor
	 */
	var SAPMarker = function( marker_type, body, position ) {
		this.type = marker_type;
		this.body = body;
		this.position = position;
		
		this.prev = null;
		this.next = null;
	};

	SAPMarker.TYPES = {
		START: 0,
		END: 1
	};

	var LinkedList = function() {
		this.first = null;
		this.last = null;
	};

	/**
	 * Sweep and Prune broadphase
	 *
	 * @class SAPBroadphase
	 * @constructor
	 */
	Goblin.SAPBroadphase = function() {
		/**
		 * linked list of the start/end markers along the X axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_x = new LinkedList();

		/**
		 * linked list of the start/end markers along the Y axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_y = new LinkedList();

		/**
		 * linked list of the start/end markers along the Z axis
		 *
		 * @property bodies
		 * @type {SAPMarker<SAPMarker>}
		 */
		this.markers_z = new LinkedList();

		/**
		 * maintains count of axis over which two bodies overlap; if count is three, their AABBs touch/penetrate
		 *
		 * @type {Object}
		 */
		this.overlap_counter = {};

		/**
		 * array of all (current) collision pairs between the broadphases' bodies
		 *
		 * @property collision_pairs
		 * @type {Array}
		 */
		this.collision_pairs = [];

		/**
		 * array of bodies which have been added to the broadphase since the last update
		 *
		 * @type {Array<RigidBody>}
		 */
		this.pending_bodies = [];
	};

	Goblin.SAPBroadphase.prototype = {
		incrementOverlaps: function( body_a, body_b ) {
			if( !Goblin.CollisionUtils.canBodiesCollide( body_a, body_b ) ) {
				return;
			}

			var key = body_a.id < body_b.id ? body_a.id + '-' + body_b.id : body_b.id + '-' + body_a.id;

			if ( !this.overlap_counter.hasOwnProperty( key ) ) {
				this.overlap_counter[key] = 0;
			}

			this.overlap_counter[key]++;

			if ( this.overlap_counter[key] === 3 ) {
				// The AABBs are touching, add to potential contacts
				this.collision_pairs.push([ body_a.id < body_b.id ? body_a : body_b, body_a.id < body_b.id ? body_b : body_a ]);
			}
		},

		decrementOverlaps: function( body_a, body_b ) {
			var key = body_a.id < body_b.id ? body_a.id + '-' + body_b.id : body_b.id + '-' + body_a.id;

			if ( !this.overlap_counter.hasOwnProperty( key ) ) {
				this.overlap_counter[key] = 0;
			}

			this.overlap_counter[key]--;

			if ( this.overlap_counter[key] === 0 ) {
				delete this.overlap_counter[key];
			} else if ( this.overlap_counter[key] === 2 ) {
				// These are no longer touching, remove from potential contacts
				this.collision_pairs = this.collision_pairs.filter(function( pair ){
					if ( pair[0] === body_a && pair[1] === body_b ) {
						return false;
					}
					if ( pair[0] === body_b && pair[1] === body_a ) {
						return false;
					}
					return true;
				});
			}
		},

		updateObjectStaticFlag: function ( rigid_body, is_static ) {
		},

		updateObjectKinematicFlag: function ( rigid_body, is_static ) {
		},

		updateObjectLayer: function ( rigid_body, new_layer ) {
		},

		/**
		 * Adds a body to the broadphase for contact checking
		 *
		 * @method addBody
		 * @param body {RigidBody} body to add to the broadphase contact checking
		 */
		addBody: function( body ) {
			this.pending_bodies.push( body );
		},

		removeBody: function( body ) {
			// first, check if the body is pending
			var pending_index = this.pending_bodies.indexOf( body );
			if ( pending_index !== -1 ) {
				this.pending_bodies.splice( pending_index, 1 );
				return;
			}

			// body was already added, find & remove
			var next, prev;
			var marker = this.markers_x.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_x.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_x.first = next;
					}
				}
				marker = marker.next;
			}

			marker = this.markers_y.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_y.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_y.first = next;
					}
				}
				marker = marker.next;
			}

			marker = this.markers_z.first;
			while ( marker ) {
				if ( marker.body === body ) {
					next = marker.next;
					prev = marker.prev;
					if ( next != null ) {
						next.prev = prev;
						if ( prev != null ) {
							prev.next = next;
						}
					} else {
						this.markers_z.last = prev;
					}
					if ( prev != null ) {
						prev.next = next;
						if ( next != null ) {
							next.prev = prev;
						}
					} else {
						this.markers_z.first = next;
					}
				}
				marker = marker.next;
			}

			// remove any collisions
			this.collision_pairs = this.collision_pairs.filter(function( pair ){
				if ( pair[0] === body || pair[1] === body ) {
					return false;
				}
				return true;
			});
		},

		insertPending: function() {
			var body;
			while ( ( body = this.pending_bodies.pop() ) ) {
				body.updateDerived();
				var start_marker_x = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.x ),
					start_marker_y = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.y ),
					start_marker_z = new SAPMarker( SAPMarker.TYPES.START, body, body.aabb.min.z ),
					end_marker_x = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.x ),
					end_marker_y = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.y ),
					end_marker_z = new SAPMarker( SAPMarker.TYPES.END, body, body.aabb.max.z );

				// Insert these markers, incrementing overlap counter
				this.insert( this.markers_x, start_marker_x );
				this.insert( this.markers_x, end_marker_x );
				this.insert( this.markers_y, start_marker_y );
				this.insert( this.markers_y, end_marker_y );
				this.insert( this.markers_z, start_marker_z );
				this.insert( this.markers_z, end_marker_z );
			}
		},

		insert: function( list, marker ) {
			if ( list.first == null ) {
				list.first = list.last = marker;
			} else {
				// Insert at the end of the list & sort
				marker.prev = list.last;
				list.last.next = marker;
				list.last = marker;
				this.sort( list, marker );
			}
		},

		sort: function( list, marker ) {
			var prev;
			while (
				marker.prev != null &&
				(
					marker.position < marker.prev.position ||
					( marker.position === marker.prev.position && marker.type === SAPMarker.TYPES.START && marker.prev.type === SAPMarker.TYPES.END )
				)
			) {
				prev = marker.prev;

				// check if this swap changes overlap counters
				if ( marker.type !== prev.type ) {
					if ( marker.type === SAPMarker.TYPES.START ) {
						// marker is START, moving into an overlap
						this.incrementOverlaps( marker.body, prev.body );
					} else {
						// marker is END, leaving an overlap
						this.decrementOverlaps( marker.body, prev.body );
					}
				}

				marker.prev = prev.prev;
				prev.next = marker.next;

				marker.next = prev;
				prev.prev = marker;

				if ( marker.prev == null ) {
					list.first = marker;
				} else {
					marker.prev.next = marker;
				}
				if ( prev.next == null ) {
					list.last = prev;
				} else {
					prev.next.prev = prev;
				}
			}
		},

		/**
		 * Updates the broadphase's internal representation and current predicted contacts
		 *
		 * @method update
		 */
		update: function() {
			this.collision_pairs.length = 0;
			
			this.insertPending();

			var marker = this.markers_x.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.x;
				} else {
					marker.position = marker.body.aabb.max.x;
				}
				this.sort( this.markers_x, marker );
				marker = marker.next;
			}

			marker = this.markers_y.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.y;
				} else {
					marker.position = marker.body.aabb.max.y;
				}
				this.sort( this.markers_y, marker );
				marker = marker.next;
			}

			marker = this.markers_z.first;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					marker.position = marker.body.aabb.min.z;
				} else {
					marker.position = marker.body.aabb.max.z;
				}
				this.sort( this.markers_z, marker );
				marker = marker.next;
			}
		},

		/**
		 * Returns an array of objects the given body may be colliding with
		 *
		 * @method intersectsWith
		 * @param body {RigidBody}
		 * @return Array<RigidBody>
		 */
		intersectsWith: function( body ) {
			this.addBody( body );
			this.update();

			var possibilities = this.collision_pairs.filter(function( pair ){
				if ( pair[0] === body || pair[1] === body ) {
					return true;
				}
				return false;
			}).map(function( pair ){
				return pair[0] === body ? pair[1] : pair[0];
			});

			this.removeBody( body );
			return possibilities;
		},

		/**
		 * Checks if a ray segment intersects with objects in the world
		 *
		 * @method rayIntersect
		 * @property start {vec3} start point of the segment
		 * @property end {vec3{ end point of the segment
         * @return {Array<RayIntersection>} an unsorted array of intersections
		 */
		rayIntersect: function( start, end ) {
			// It's assumed that raytracing will be performed through a proxy like Goblin.World,
			// thus that the only time this broadphase cares about updating itself is if an object was added
			if ( this.pending_bodies.length > 0 ) {
				this.update();
			}

			// This implementation only scans the X axis because the overall process gets slower the more axes you add
			// thanks JavaScript

			var active_bodies = {},
				intersections = [],
				id_body_map = {},
				id_intersection_count = {},
				ordered_start, ordered_end,
				marker, has_encountered_start,
				i, body, key, keys;

			// X axis
			marker = this.markers_x.first;
			has_encountered_start = false;
			active_bodies = {};
			ordered_start = start.x < end.x ? start.x : end.x;
			ordered_end = start.x < end.x ? end.x : start.x;
			while ( marker ) {
				if ( marker.type === SAPMarker.TYPES.START ) {
					active_bodies[marker.body.id] = marker.body;
				}

				if ( marker.position >= ordered_start ) {
					if ( has_encountered_start === false ) {
						has_encountered_start = true;
						keys = Object.keys( active_bodies );
						for ( i = 0; i < keys.length; i++ ) {
							key = keys[i];
							body = active_bodies[key];
							if ( body == null ) { // needed because we don't delete but set to null, see below comment
								continue;
							}
							// The next two lines are piss-slow
							id_body_map[body.id] = body;
							id_intersection_count[body.id] = id_intersection_count[body.id] ? id_intersection_count[body.id] + 1 : 1;
						}
					} else if ( marker.type === SAPMarker.TYPES.START ) {
						// The next two lines are piss-slow
						id_body_map[marker.body.id] = marker.body;
						id_intersection_count[marker.body.id] = id_intersection_count[marker.body.id] ? id_intersection_count[marker.body.id] + 1 : 1;
					}
				}

				if ( marker.type === SAPMarker.TYPES.END ) {
					active_bodies[marker.body.id] = null; // this is massively faster than deleting the association
					//delete active_bodies[marker.body.id];
				}

				if ( marker.position > ordered_end ) {
					// no more intersections to find on this axis
					break;
				}

				marker = marker.next;
			}

			keys = Object.keys( id_intersection_count );
			for ( i = 0; i < keys.length; i++ ) {
				var body_id = keys[i];
				if ( id_intersection_count[body_id] === 1 ) {
					if ( id_body_map[body_id].aabb.testRayIntersect( start, end ) ) {
						id_body_map[body_id].rayIntersect( start, end, intersections );
					}
				}
			}

			return intersections;
		}
	};
})();
Goblin.BoxSphere = function( object_a, object_b ) {
	var sphere = object_a.shape instanceof Goblin.SphereShape ? object_a : object_b,
		box = object_a.shape instanceof Goblin.SphereShape ? object_b : object_a,
		contact, distance;

	// Transform the center of the sphere into box coordinates
	box.transform_inverse.transformVector3Into( sphere.position, _tmp_vec3_1 );

	// Early out check to see if we can exclude the contact
	if ( Math.abs( _tmp_vec3_1.x ) - sphere.shape.radius > box.shape.half_width ||
		Math.abs( _tmp_vec3_1.y ) - sphere.shape.radius > box.shape.half_height ||
		Math.abs( _tmp_vec3_1.z ) - sphere.shape.radius > box.shape.half_depth )
	{
		return;
	}

	// `_tmp_vec3_1` is the center of the sphere in relation to the box
	// `_tmp_vec3_2` will hold the point on the box closest to the sphere
	_tmp_vec3_2.x = _tmp_vec3_2.y = _tmp_vec3_2.z = 0;

	// Clamp each coordinate to the box.
	distance = _tmp_vec3_1.x;
	if ( distance > box.shape.half_width ) {
		distance = box.shape.half_width;
	} else if (distance < -box.shape.half_width ) {
		distance = -box.shape.half_width;
	}
	_tmp_vec3_2.x = distance;

	distance = _tmp_vec3_1.y;
	if ( distance > box.shape.half_height ) {
		distance = box.shape.half_height;
	} else if (distance < -box.shape.half_height ) {
		distance = -box.shape.half_height;
	}
	_tmp_vec3_2.y = distance;

	distance = _tmp_vec3_1.z;
	if ( distance > box.shape.half_depth ) {
		distance = box.shape.half_depth;
	} else if (distance < -box.shape.half_depth ) {
		distance = -box.shape.half_depth;
	}
	_tmp_vec3_2.z = distance;

	// Check we're in contact
	_tmp_vec3_3.subtractVectors( _tmp_vec3_2, _tmp_vec3_1 );
	distance = _tmp_vec3_3.lengthSquared();
	if ( distance > sphere.shape.radius * sphere.shape.radius ) {
		return;
	}

	// Get a ContactDetails object populate it
	contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = sphere;
	contact.object_b = box;

	if ( distance === 0 ) {

		// The center of the sphere is contained within the box
		Goblin.BoxSphere.spherePenetration( box.shape, _tmp_vec3_1, _tmp_vec3_2, contact );

	} else {

		// Center of the sphere is outside of the box

		// Find contact normal and penetration depth
		contact.contact_normal.subtractVectors( _tmp_vec3_2, _tmp_vec3_1 );
		contact.penetration_depth = -contact.contact_normal.length();
		contact.contact_normal.scale( -1 / contact.penetration_depth );

		// Set contact point of `object_b` (the box )
		contact.contact_point_in_b.copy( _tmp_vec3_2 );

	}

	// Update penetration depth to include sphere's radius
	contact.penetration_depth += sphere.shape.radius;

	// Convert contact normal to world coordinates
	box.transform.rotateVector3( contact.contact_normal );

	// Contact point in `object_a` (the sphere) is the normal * radius converted to the sphere's frame
	sphere.transform_inverse.rotateVector3Into( contact.contact_normal, contact.contact_point_in_a );
	contact.contact_point_in_a.scale( sphere.shape.radius );

	// Find contact position
	contact.contact_point.scaleVector( contact.contact_normal, sphere.shape.radius - contact.penetration_depth / 2 );
	contact.contact_point.add( sphere.position );

	return contact;
};

Goblin.BoxSphere.spherePenetration = function( box, sphere_center, box_point, contact ) {
	var min_distance, face_distance;

	if ( sphere_center.x < 0 ) {
		min_distance = box.half_width + sphere_center.x;
		box_point.x = -box.half_width;
		box_point.y = box_point.z = 0;
		contact.penetration_depth = min_distance;
	} else {
		min_distance = box.half_width - sphere_center.x;
		box_point.x = box.half_width;
		box_point.y = box_point.z = 0;
		contact.penetration_depth = min_distance;
	}

	if ( sphere_center.y < 0 ) {
		face_distance = box.half_height + sphere_center.y;
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point.y = -box.half_height;
			box_point.x = box_point.z = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_height - sphere_center.y;
		if ( face_distance < min_distance ) {
			min_distance = face_distance;
			box_point.y = box.half_height;
			box_point.x = box_point.z = 0;
			contact.penetration_depth = min_distance;
		}
	}

	if ( sphere_center.z < 0 ) {
		face_distance = box.half_depth + sphere_center.z;
		if ( face_distance < min_distance ) {
			box_point.z = -box.half_depth;
			box_point.x = box_point.y = 0;
			contact.penetration_depth = min_distance;
		}
	} else {
		face_distance = box.half_depth - sphere_center.z;
		if ( face_distance < min_distance ) {
			box_point.z = box.half_depth;
			box_point.x = box_point.y = 0;
			contact.penetration_depth = min_distance;
		}
	}

	// Set contact point of `object_b` (the box)
	contact.contact_point_in_b.copy( _tmp_vec3_2 );
	contact.contact_normal.scaleVector( contact.contact_point_in_b, -1 );
	contact.contact_normal.normalize();
};
/**
 * Provides the classes and algorithms for running GJK+EPA based collision detection
 *
 * @class GjkEpa
 * @static
 */
Goblin.GjkEpa = {
	margins: 0.01,
	result: null,

    max_iterations: 20,
    epa_condition: 0.001,

    /**
     * Holds a point on the edge of a Minkowski difference along with that point's witnesses and the direction used to find the point
     *
     * @class SupportPoint
     * @param witness_a {vec3} Point in first object used to find the supporting point
     * @param witness_b {vec3} Point in the second object ued to find th supporting point
     * @param point {vec3} The support point on the edge of the Minkowski difference
     * @constructor
     */
    SupportPoint: function( witness_a, witness_b, point ) {
        this.witness_a = witness_a;
        this.witness_b = witness_b;
        this.point = point;
    },

    /**
     * Finds the extant point on the edge of the Minkowski difference for `object_a` - `object_b` in `direction`
     *
     * @method findSupportPoint
     * @param object_a {Goblin.RigidBody} First object in the search
     * @param object_b {Goblin.RigidBody} Second object in the search
     * @param direction {vec3} Direction to find the extant point in
     * @param gjk_point {Goblin.GjkEpa.SupportPoint} `SupportPoint` class to store the resulting point & witnesses in
     */
    findSupportPoint: (function(){
        var temp = new Goblin.Vector3();
        return function( object_a, object_b, direction, support_point ) {
            // Find witnesses from the objects
            object_a.findSupportPoint( direction, support_point.witness_a );
            temp.scaleVector( direction, -1 );
            object_b.findSupportPoint( temp, support_point.witness_b );

            // Find the CSO support point
            support_point.point.subtractVectors( support_point.witness_a, support_point.witness_b );
        };
    })(),

	testCollision: function( object_a, object_b ) {
		var simplex = Goblin.GjkEpa.GJK( object_a, object_b );
		if ( Goblin.GjkEpa.result != null ) {
			return Goblin.GjkEpa.result;
		} else if ( simplex != null ) {
			return Goblin.GjkEpa.EPA( simplex );
		}
	},

    /**
     * Perform GJK algorithm against two objects. Returns a ContactDetails object if there is a collision, else null
     *
     * @method GJK
     * @param object_a {Goblin.RigidBody}
     * @param object_b {Goblin.RigidBody}
     * @return {Goblin.ContactDetails|Boolean} Returns `null` if no collision, else a `ContactDetails` object
     */
	GJK: (function(){
        return function( object_a, object_b ) {
            var simplex = new Goblin.GjkEpa.Simplex( object_a, object_b ),
                last_point;

			Goblin.GjkEpa.result = null;

            while ( ( last_point = simplex.addPoint() ) ){}

            // If last_point is false then there is no collision
            if ( last_point === false ) {
				Goblin.GjkEpa.freeSimplex( simplex );
                return null;
            }

            return simplex;
        };
    })(),

	freeSimplex: function( simplex ) {
		// Free the support points used by this simplex
		for ( var i = 0, points_length = simplex.points.length; i < points_length; i++ ) {
			Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', simplex.points[i] );
		}
	},

	freePolyhedron: function( polyhedron ) {
		// Free the support points used by the polyhedron (includes the points from the simplex used to create the polyhedron
		var pool = Goblin.ObjectPool.pools['GJK2SupportPoint'];

		for ( var i = 0, faces_length = polyhedron.faces.length; i < faces_length; i++ ) {
			// The indexOf checking is required because vertices are shared between faces
			if ( pool.indexOf( polyhedron.faces[i].a ) === -1 ) {
				Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[i].a );
			}
			if ( pool.indexOf( polyhedron.faces[i].b ) === -1 ) {
				Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[i].b );
			}
			if ( pool.indexOf( polyhedron.faces[i].c ) === -1 ) {
				Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', polyhedron.faces[i].c );
			}
		}
	},

    /**
     * Performs the Expanding Polytope Algorithm a GJK simplex
     *
     * @method EPA
     * @param simplex {Goblin.GjkEpa.Simplex} Simplex generated by the GJK algorithm
     * @return {Goblin.ContactDetails}
     */
    EPA: (function(){
		var barycentric = new Goblin.Vector3(),
			confirm = {
				a: new Goblin.Vector3(),
				b: new Goblin.Vector3(),
				c: new Goblin.Vector3()
			};
		return function( simplex ) {
            // Time to convert the simplex to real faces
            // @TODO this should be a priority queue where the position in the queue is ordered by distance from face to origin
			var polyhedron = new Goblin.GjkEpa.Polyhedron( simplex );

			var i = 0;

            // Expand the polyhedron until it doesn't expand any more
			while ( ++i ) {
				polyhedron.findFaceClosestToOrigin();

				// Find a new support point in the direction of the closest point
				if ( polyhedron.closest_face_distance < Goblin.EPSILON ) {
					_tmp_vec3_1.copy( polyhedron.faces[polyhedron.closest_face].normal );
				} else {
					_tmp_vec3_1.copy( polyhedron.closest_point );
				}

				var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
				Goblin.GjkEpa.findSupportPoint( simplex.object_a, simplex.object_b, _tmp_vec3_1, support_point );

				// Check for terminating condition
                _tmp_vec3_1.subtractVectors( support_point.point, polyhedron.closest_point );
                var gap = _tmp_vec3_1.lengthSquared();

				if ( i === Goblin.GjkEpa.max_iterations || ( gap < Goblin.GjkEpa.epa_condition && polyhedron.closest_face_distance > Goblin.EPSILON ) ) {

					// Get a ContactDetails object and fill out its details
					var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
					contact.object_a = simplex.object_a;
					contact.object_b = simplex.object_b;

					contact.contact_normal.normalizeVector( polyhedron.closest_point );
					if ( contact.contact_normal.lengthSquared() === 0 ) {
						contact.contact_normal.subtractVectors( contact.object_b.position, contact.object_a.position );
					}
					contact.contact_normal.normalize();

					Goblin.GeometryMethods.findBarycentricCoordinates( polyhedron.closest_point, polyhedron.faces[polyhedron.closest_face].a.point, polyhedron.faces[polyhedron.closest_face].b.point, polyhedron.faces[polyhedron.closest_face].c.point, barycentric );

					if ( isNaN( barycentric.x ) ) {
                        // @TODO: Avoid this degenerate case
						//console.log( 'Point not in triangle' );
						//debugger;
						Goblin.GjkEpa.freePolyhedron( polyhedron );
						return null;
					}

					// Contact coordinates of object a
					confirm.a.scaleVector( polyhedron.faces[polyhedron.closest_face].a.witness_a, barycentric.x );
					confirm.b.scaleVector( polyhedron.faces[polyhedron.closest_face].b.witness_a, barycentric.y );
					confirm.c.scaleVector( polyhedron.faces[polyhedron.closest_face].c.witness_a, barycentric.z );
					contact.contact_point_in_a.addVectors( confirm.a, confirm.b );
					contact.contact_point_in_a.add( confirm.c );

					// Contact coordinates of object b
					confirm.a.scaleVector( polyhedron.faces[polyhedron.closest_face].a.witness_b, barycentric.x );
					confirm.b.scaleVector( polyhedron.faces[polyhedron.closest_face].b.witness_b, barycentric.y );
					confirm.c.scaleVector( polyhedron.faces[polyhedron.closest_face].c.witness_b, barycentric.z );
					contact.contact_point_in_b.addVectors( confirm.a, confirm.b );
					contact.contact_point_in_b.add( confirm.c );

					// Find actual contact point
					contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
					contact.contact_point.scale( 0.5  );

					// Set objects' local points
					contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
					contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

					// Calculate penetration depth
					contact.penetration_depth = polyhedron.closest_point.length() + Goblin.GjkEpa.margins;

					Goblin.GjkEpa.freePolyhedron( polyhedron );

					return contact;
				}

                polyhedron.addVertex( support_point );
			}

			Goblin.GjkEpa.freePolyhedron( polyhedron );
            return null;
        };
    })(),

    Face: function( polyhedron, a, b, c ) {
		this.active = true;
		//this.polyhedron = polyhedron;
        this.a = a;
        this.b = b;
        this.c = c;
        this.normal = new Goblin.Vector3();
		this.neighbors = [];

        _tmp_vec3_1.subtractVectors( b.point, a.point );
        _tmp_vec3_2.subtractVectors( c.point, a.point );
        this.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );
        this.normal.normalize();
    }
};

Goblin.GjkEpa.Polyhedron = function( simplex ) {
	this.closest_face = null;
	this.closest_face_distance = null;
	this.closest_point = new Goblin.Vector3();

	this.faces = [
		//BCD, ACB, CAD, DAB
		new Goblin.GjkEpa.Face( this, simplex.points[2], simplex.points[1], simplex.points[0] ),
		new Goblin.GjkEpa.Face( this, simplex.points[3], simplex.points[1], simplex.points[2] ),
		new Goblin.GjkEpa.Face( this, simplex.points[1], simplex.points[3], simplex.points[0] ),
		new Goblin.GjkEpa.Face( this, simplex.points[0], simplex.points[3], simplex.points[2] )
	];

	this.faces[0].neighbors.push( this.faces[1], this.faces[2], this.faces[3] );
	this.faces[1].neighbors.push( this.faces[2], this.faces[0], this.faces[3] );
	this.faces[2].neighbors.push( this.faces[1], this.faces[3], this.faces[0] );
	this.faces[3].neighbors.push( this.faces[2], this.faces[1], this.faces[0] );
};
Goblin.GjkEpa.Polyhedron.prototype = {
    addVertex: function( vertex )
    {
        var edges = [], faces = [], i, j, a, b, last_b;
        this.faces[this.closest_face].silhouette( vertex, edges );

        // Re-order the edges if needed
        for ( i = 0; i < edges.length - 5; i += 5 ) {
            a = edges[i+3];
            b = edges[i+4];

            // Ensure this edge really should be the next one
            if ( i !== 0 && last_b !== a ) {
                // It shouldn't
                for ( j = i + 5; j < edges.length; j += 5 ) {
                    if ( edges[j+3] === last_b ) {
                        // Found it
                        var tmp = edges.slice( i, i + 5 );
                        edges[i] = edges[j];
                        edges[i+1] = edges[j+1];
                        edges[i+2] = edges[j+2];
                        edges[i+3] = edges[j+3];
                        edges[i+4] = edges[j+4];
                        edges[j] = tmp[0];
                        edges[j+1] = tmp[1];
                        edges[j+2] = tmp[2];
                        edges[j+3] = tmp[3];
                        edges[j+4] = tmp[4];

                        a = edges[i+3];
                        b = edges[i+4];
                        break;
                    }
                }
            }
            last_b = b;
        }

        for ( i = 0; i < edges.length; i += 5 ) {
            var neighbor = edges[i];
            a = edges[i+3];
            b = edges[i+4];

            var face = new Goblin.GjkEpa.Face( this, b, vertex, a );
            face.neighbors[2] = edges[i];
            faces.push( face );

            neighbor.neighbors[neighbor.neighbors.indexOf( edges[i+2] )] = face;
        }

        for ( i = 0; i < faces.length; i++ ) {
            faces[i].neighbors[0] = faces[ i + 1 === faces.length ? 0 : i + 1 ];
            faces[i].neighbors[1] = faces[ i - 1 < 0 ? faces.length - 1 : i - 1 ];
        }

		Array.prototype.push.apply( this.faces, faces );

        return edges;
    },

	findFaceClosestToOrigin: (function(){
		var origin = new Goblin.Vector3(),
			point = new Goblin.Vector3();

		return function() {
			this.closest_face_distance = Infinity;

			var distance, i;

			for ( i = 0; i < this.faces.length; i++ ) {
				if ( this.faces[i].active === false ) {
					continue;
				}

				Goblin.GeometryMethods.findClosestPointInTriangle( origin, this.faces[i].a.point, this.faces[i].b.point, this.faces[i].c.point, point );
				distance = point.lengthSquared();
				if ( distance < this.closest_face_distance ) {
					this.closest_face_distance = distance;
					this.closest_face = i;
					this.closest_point.copy( point );
				}
			}
		};
	})()
};

Goblin.GjkEpa.Face.prototype = {
	/**
	 * Determines if a vertex is in front of or behind the face
	 *
	 * @method classifyVertex
	 * @param vertex {vec3} Vertex to classify
	 * @return {Number} If greater than 0 then `vertex' is in front of the face
	 */
	classifyVertex: function( vertex ) {
		var w = this.normal.dot( this.a.point );
		return this.normal.dot( vertex.point ) - w;
	},

	silhouette: function( point, edges, source ) {
        if ( this.active === false ) {
            return;
        }

        if ( this.classifyVertex( point ) > 0 ) {
			// This face is visible from `point`. Deactivate this face and alert the neighbors
			this.active = false;

			this.neighbors[0].silhouette( point, edges, this );
			this.neighbors[1].silhouette( point, edges, this );
            this.neighbors[2].silhouette( point, edges, this );
		} else if ( source ) {
			// This face is a neighbor to a now-silhouetted face, determine which neighbor and replace it
			var neighbor_idx = this.neighbors.indexOf( source ),
                a, b;
            if ( neighbor_idx === 0 ) {
                a = this.a;
                b = this.b;
            } else if ( neighbor_idx === 1 ) {
                a = this.b;
                b = this.c;
            } else {
                a = this.c;
                b = this.a;
            }
			edges.push( this, neighbor_idx, source, b, a );
		}
	}
};

(function(){
    var origin = new Goblin.Vector3(),
		ao = new Goblin.Vector3(),
        ab = new Goblin.Vector3(),
        ac = new Goblin.Vector3(),
        ad = new Goblin.Vector3();

	var barycentric = new Goblin.Vector3(),
		confirm = {
			a: new Goblin.Vector3(),
			b: new Goblin.Vector3(),
			c: new Goblin.Vector3()
		};

    Goblin.GjkEpa.Simplex = function( object_a, object_b ) {
        this.object_a = object_a;
        this.object_b = object_b;
        this.points = [];
        this.iterations = 0;
        this.next_direction = new Goblin.Vector3();
        this.updateDirection();
    };
    Goblin.GjkEpa.Simplex.prototype = {
        addPoint: function() {
            if ( ++this.iterations === Goblin.GjkEpa.max_iterations ) {
                return false;
            }

            var support_point = Goblin.ObjectPool.getObject( 'GJK2SupportPoint' );
            Goblin.GjkEpa.findSupportPoint( this.object_a, this.object_b, this.next_direction, support_point );
            this.points.push( support_point );

			if ( support_point.point.dot( this.next_direction ) < 0 && this.points.length > 1 ) {
				// Check the margins first
				// @TODO this can be expanded to support 1-simplex (2 points)
				if ( this.points.length >= 3 ) {
					Goblin.GeometryMethods.findClosestPointInTriangle(
						origin,
						this.points[0].point,
						this.points[1].point,
						this.points[2].point,
						_tmp_vec3_1
					);
					var distanceSquared = _tmp_vec3_1.lengthSquared();

					if ( distanceSquared <= Goblin.GjkEpa.margins * Goblin.GjkEpa.margins ) {
						// Get a ContactDetails object and fill out its details
						var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
						contact.object_a = this.object_a;
						contact.object_b = this.object_b;

						contact.contact_normal.normalizeVector( _tmp_vec3_1 );
						if ( contact.contact_normal.lengthSquared() === 0 ) {
							contact.contact_normal.subtractVectors( contact.object_b.position, contact.object_a.position );
						}
						contact.contact_normal.normalize();
						contact.contact_normal.scale( -1 );

						contact.penetration_depth = Goblin.GjkEpa.margins - Math.sqrt( distanceSquared );

						Goblin.GeometryMethods.findBarycentricCoordinates( _tmp_vec3_1, this.points[0].point, this.points[1].point, this.points[2].point, barycentric );

						if ( isNaN( barycentric.x ) ) {
							//debugger;
							return false;
						}

						// Contact coordinates of object a
						confirm.a.scaleVector( this.points[0].witness_a, barycentric.x );
						confirm.b.scaleVector( this.points[1].witness_a, barycentric.y );
						confirm.c.scaleVector( this.points[2].witness_a, barycentric.z );
						contact.contact_point_in_a.addVectors( confirm.a, confirm.b );
						contact.contact_point_in_a.add( confirm.c );

						// Contact coordinates of object b
						contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.penetration_depth );
						contact.contact_point_in_b.add( contact.contact_point_in_a );

						// Find actual contact point
						contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
						contact.contact_point.scale( 0.5  );

						// Set objects' local points
						contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
						contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

						contact.restitution = ( this.object_a.restitution + this.object_b.restitution ) / 2;
						contact.friction = ( this.object_a.friction + this.object_b.friction ) / 2;

						//Goblin.GjkEpa.freePolyhedron( polyhedron );

						Goblin.GjkEpa.result = contact;
						return null;
					}
				}

				// if the last added point was not past the origin in the direction
				// then the Minkowski difference cannot contain the origin because
				// point added is past the edge of the Minkowski difference
				return false;
			}

            if ( this.updateDirection() === true ) {
                // Found a collision
                return null;
            }

            return support_point;
        },

        findDirectionFromLine: function() {
            ao.scaleVector( this.points[1].point, -1 );
            ab.subtractVectors( this.points[0].point, this.points[1].point );

            if ( ab.dot( ao ) < 0 ) {
                // Origin is on the opposite side of A from B
                this.next_direction.copy( ao );
				Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', this.points[1] );
                this.points.length = 1; // Remove second point
			} else {
                // Origin lies between A and B, move on to a 2-simplex
                this.next_direction.crossVectors( ab, ao );
                this.next_direction.cross( ab );

                // In the case that `ab` and `ao` are parallel vectors, direction becomes a 0-vector
                if (
                    this.next_direction.x === 0 &&
                    this.next_direction.y === 0 &&
                    this.next_direction.z === 0
                ) {
                    ab.normalize();
                    this.next_direction.x = 1 - Math.abs( ab.x );
                    this.next_direction.y = 1 - Math.abs( ab.y );
                    this.next_direction.z = 1 - Math.abs( ab.z );
                }
            }
        },

        findDirectionFromTriangle: function() {
            // Triangle
            var a = this.points[2],
                b = this.points[1],
                c = this.points[0];

            ao.scaleVector( a.point, -1 ); // ao
            ab.subtractVectors( b.point, a.point ); // ab
            ac.subtractVectors( c.point, a.point ); // ac

            // Determine the triangle's normal
            _tmp_vec3_1.crossVectors( ab, ac );

            // Edge cross products
            _tmp_vec3_2.crossVectors( ab, _tmp_vec3_1 );
            _tmp_vec3_3.crossVectors( _tmp_vec3_1, ac );

            if ( _tmp_vec3_3.dot( ao ) >= 0 ) {
                // Origin lies on side of ac opposite the triangle
                if ( ac.dot( ao ) >= 0 ) {
                    // Origin outside of the ac line, so we form a new
                    // 1-simplex (line) with points A and C, leaving B behind
                    this.points.length = 0;
                    this.points.push( c, a );
					Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );

                    // New search direction is from ac towards the origin
                    this.next_direction.crossVectors( ac, ao );
                    this.next_direction.cross( ac );
                } else {
                    // *
                    if ( ab.dot( ao ) >= 0 ) {
                        // Origin outside of the ab line, so we form a new
                        // 1-simplex (line) with points A and B, leaving C behind
                        this.points.length = 0;
                        this.points.push( b, a );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );

                        // New search direction is from ac towards the origin
                        this.next_direction.crossVectors( ab, ao );
                        this.next_direction.cross( ab );
                    } else {
                        // only A gives us a good reference point, start over with a 0-simplex
                        this.points.length = 0;
                        this.points.push( a );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );
                    }
                    // *
                }

            } else {

                // Origin lies on the triangle side of ac
                if ( _tmp_vec3_2.dot( ao ) >= 0 ) {
                    // Origin lies on side of ab opposite the triangle

                    // *
                    if ( ab.dot( ao ) >= 0 ) {
                        // Origin outside of the ab line, so we form a new
                        // 1-simplex (line) with points A and B, leaving C behind
                        this.points.length = 0;
                        this.points.push( b, a );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );

                        // New search direction is from ac towards the origin
                        this.next_direction.crossVectors( ab, ao );
                        this.next_direction.cross( ab );
                    } else {
                        // only A gives us a good reference point, start over with a 0-simplex
                        this.points.length = 0;
                        this.points.push( a );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', b );
						Goblin.ObjectPool.freeObject( 'GJK2SupportPoint', c );
                    }
                    // *

                } else {

                    // Origin lies somewhere in the triangle or above/below it
                    if ( _tmp_vec3_1.dot( ao ) >= 0 ) {
                        // Origin is on the front side of the triangle
                        this.next_direction.copy( _tmp_vec3_1 );
						this.points.length = 0;
						this.points.push( a, b, c );
                    } else {
                        // Origin is on the back side of the triangle
                        this.next_direction.copy( _tmp_vec3_1 );
                        this.next_direction.scale( -1 );
                    }

                }

            }
        },

        getFaceNormal: function( a, b, c, destination ) {
            ab.subtractVectors( b.point, a.point );
            ac.subtractVectors( c.point, a.point );
            destination.crossVectors( ab, ac );
            destination.normalize();
        },

        faceNormalDotOrigin: function( a, b, c ) {
            // Find face normal
            this.getFaceNormal( a, b, c, _tmp_vec3_1 );

            // Find direction of origin from center of face
            _tmp_vec3_2.addVectors( a.point, b.point );
            _tmp_vec3_2.add( c.point );
			_tmp_vec3_2.scale( -3 );
			_tmp_vec3_2.normalize();

            return _tmp_vec3_1.dot( _tmp_vec3_2 );
        },

        findDirectionFromTetrahedron: function() {
            var a = this.points[3],
                b = this.points[2],
                c = this.points[1],
                d = this.points[0];

			// Check each of the four sides to see which one is facing the origin.
			// Then keep the three points for that triangle and use its normal as the search direction
			// The four faces are BCD, ACB, CAD, DAB
			var closest_face = null,
				closest_dot = Goblin.EPSILON,
				face_dot;

			// @TODO we end up calculating the "winning" face normal twice, don't do that

			face_dot = this.faceNormalDotOrigin( b, c, d );
			if ( face_dot > closest_dot ) {
				closest_face = 1;
				closest_dot = face_dot;
			}

			face_dot = this.faceNormalDotOrigin( a, c, b );
			if ( face_dot > closest_dot ) {
				closest_face = 2;
				closest_dot = face_dot;
			}

			face_dot = this.faceNormalDotOrigin( c, a, d );
			if ( face_dot > closest_dot ) {
				closest_face = 3;
				closest_dot = face_dot;
			}

			face_dot = this.faceNormalDotOrigin( d, a, b );
			if ( face_dot > closest_dot ) {
				closest_face = 4;
				closest_dot = face_dot;
			}

			if ( closest_face === null ) {
				// We have a collision, ready for EPA
				return true;
			} else if ( closest_face === 1 ) {
				// BCD
				this.points.length = 0;
				this.points.push( b, c, d );
				this.getFaceNormal( b, c, d, _tmp_vec3_1 );
				this.next_direction.copy( _tmp_vec3_1 );
			} else if ( closest_face === 2 ) {
				// ACB
				this.points.length = 0;
				this.points.push( a, c, b );
				this.getFaceNormal( a, c, b, _tmp_vec3_1 );
				this.next_direction.copy( _tmp_vec3_1 );
			} else if ( closest_face === 3 ) {
				// CAD
				this.points.length = 0;
				this.points.push( c, a, d );
				this.getFaceNormal( c, a, d, _tmp_vec3_1 );
				this.next_direction.copy( _tmp_vec3_1 );
			} else if ( closest_face === 4 ) {
				// DAB
				this.points.length = 0;
				this.points.push( d, a, b );
				this.getFaceNormal( d, a, b, _tmp_vec3_1 );
				this.next_direction.copy( _tmp_vec3_1 );
			}
        },

        containsOrigin: function() {
			var a = this.points[3],
                b = this.points[2],
                c = this.points[1],
                d = this.points[0];

            // Check DCA
            ab.subtractVectors( d.point, a.point );
            ad.subtractVectors( c.point, a.point );
            _tmp_vec3_1.crossVectors( ab, ad );
            if ( _tmp_vec3_1.dot( a.point ) > 0 ) {
                return false;
            }

            // Check CBA
            ab.subtractVectors( c.point, a.point );
            ad.subtractVectors( b.point, a.point );
            _tmp_vec3_1.crossVectors( ab, ad );
            if ( _tmp_vec3_1.dot( a.point ) > 0 ) {
                return false;
            }

            // Check ADB
            ab.subtractVectors( b.point, a.point );
            ad.subtractVectors( d.point, a.point );
            _tmp_vec3_1.crossVectors( ab, ad );
            if ( _tmp_vec3_1.dot( a.point ) > 0 ) {
                return false;
            }

            // Check DCB
            ab.subtractVectors( d.point, c.point );
            ad.subtractVectors( b.point, c.point );
            _tmp_vec3_1.crossVectors( ab, ad );
            if ( _tmp_vec3_1.dot( d.point ) > 0 ) {
                return false;
            }

            return true;
        },

        updateDirection: function() {
            if ( this.points.length === 0 ) {

                this.next_direction.subtractVectors( this.object_b.position, this.object_a.position );

            } else if ( this.points.length === 1 ) {

                this.next_direction.scale( -1 );

            } else if ( this.points.length === 2 ) {

                this.findDirectionFromLine();

            } else if ( this.points.length === 3 ) {

                this.findDirectionFromTriangle();

            } else {

                return this.findDirectionFromTetrahedron();

            }
        }
    };
})();

Goblin.SphereSphere = function( object_a, object_b ) {
	// Cache positions of the spheres
	var position_a = object_a.position,
		position_b = object_b.position;

	// Get the vector between the two objects
	_tmp_vec3_1.subtractVectors( position_b, position_a );
	var distance = _tmp_vec3_1.length();

	// If the distance between the objects is greater than their combined radii
	// then they are not touching, continue processing the other possible contacts
	if ( distance > object_a.shape.radius + object_b.shape.radius ) {
		return;
	}

	// Get a ContactDetails object and fill out it's information
	var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );
	contact.object_a = object_a;
	contact.object_b = object_b;

	// Because we already have the distance (vector magnitude), don't normalize
	// instead we will calculate this value manually
	contact.contact_normal.scaleVector( _tmp_vec3_1, 1 / distance );

	// Calculate contact position
	_tmp_vec3_1.scale( -0.5  );
	contact.contact_point.addVectors( _tmp_vec3_1, position_a );

	// Calculate penetration depth
	contact.penetration_depth = object_a.shape.radius + object_b.shape.radius - distance;

	// Contact points in both objects - in world coordinates at first
	contact.contact_point_in_a.scaleVector( contact.contact_normal, contact.object_a.shape.radius );
	contact.contact_point_in_a.add( contact.object_a.position );
	contact.contact_point_in_b.scaleVector( contact.contact_normal, -contact.object_b.shape.radius );
	contact.contact_point_in_b.add( contact.object_b.position );

	// Find actual contact point
	contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
	contact.contact_point.scale( 0.5 );

	// Convert contact_point_in_a and contact_point_in_b to those objects' local frames
	contact.object_a.transform_inverse.transformVector3( contact.contact_point_in_a );
	contact.object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

	return contact;
};
/**
 * Performs an intersection test between two triangles
 *
 * @method TriangleTriangle
 * @param tri_a {TriangleShape}
 * @param tri_b {TriangleShape}
 */
Goblin.TriangleTriangle = function( tri_a, tri_b ) {
	var dv1_0 = tri_b.classifyVertex( tri_a.a ),
		dv1_1 = tri_b.classifyVertex( tri_a.b ),
		dv1_2 = tri_b.classifyVertex( tri_a.c );

	if (
		(dv1_0 > 0 && dv1_1 > 0 && dv1_2 > 0 ) ||
		(dv1_0 < 0 && dv1_1 < 0 && dv1_2 < 0 )
	)
	{
		// All vertices of tri_a are on the same side of tri_b, no intersection possible
		return null;
	}

	var dv2_0 = tri_a.classifyVertex( tri_b.a ),
		dv2_1 = tri_a.classifyVertex( tri_b.b ),
		dv2_2 = tri_a.classifyVertex( tri_b.c );
	if (
		( dv2_0 > 0 && dv2_1 > 0 && dv2_2 > 0 ) ||
		( dv2_0 < 0 && dv2_1 < 0 && dv2_2 < 0 )
		)
	{
		// All vertices of tri_b are on the same side of tri_a, no intersection possible
		return null;
	}

	var d = new Goblin.Vector3();
	d.crossVectors( tri_a.normal, tri_b.normal );
	d.normalize();

	var pv1_0 = d.dot( tri_a.a ),
		pv1_1 = d.dot( tri_a.b ),
		pv1_2 = d.dot( tri_a.c ),
		pv2_0 = d.dot( tri_b.a ),
		pv2_1 = d.dot( tri_b.b ),
		pv2_2 = d.dot( tri_b.c );

	var aa = tri_a.a,
		ab = tri_a.b,
		ac = tri_a.c,
		ba = tri_b.a,
		bb = tri_b.b,
		bc = tri_b.c;

	var tmp;
	if ( Math.sign( dv1_0 ) === Math.sign( dv1_1 ) ) {
		tmp = dv1_0;
		dv1_0 = dv1_2;
		dv1_2 = tmp;

		tmp = pv1_0;
		pv1_0 = pv1_2;
		pv1_2 = tmp;

		tmp = aa;
		aa = ac;
		ac = tmp;
	} else if ( Math.sign( dv1_0 ) === Math.sign( dv1_2 ) ) {
		tmp = dv1_0;
		dv1_0 = dv1_1;
		dv1_1 = tmp;

		tmp = pv1_0;
		pv1_0 = pv1_1;
		pv1_1 = tmp;

		tmp = aa;
		aa = ab;
		ab = tmp;
	}

	if ( Math.sign( dv2_0 ) === Math.sign( dv2_1 ) ) {
		tmp = dv2_0;
		dv2_0 = dv2_2;
		dv2_2 = tmp;

		tmp = pv2_0;
		pv2_0 = pv2_2;
		pv2_2 = tmp;

		tmp = ba;
		ba = bc;
		bc = tmp;
	} else if ( Math.sign( dv2_0 ) === Math.sign( dv2_2 ) ) {
		tmp = dv2_0;
		dv2_0 = dv2_1;
		dv2_1 = tmp;

		tmp = pv2_0;
		pv2_0 = pv2_1;
		pv2_1 = tmp;

		tmp = ba;
		ba = bb;
		bb = tmp;
	}

	var a_t1 = pv1_0 + ( pv1_1 - pv1_0 ) * ( dv1_0 / ( dv1_0 - dv1_1 ) ),
		a_t2 = pv1_0 + ( pv1_2 - pv1_0 ) * ( dv1_0 / ( dv1_0 - dv1_2 ) ),
		b_t1 = pv2_0 + ( pv2_1 - pv2_0 ) * ( dv2_0 / ( dv2_0 - dv2_1 ) ),
		b_t2 = pv2_0 + ( pv2_2 - pv2_0 ) * ( dv2_0 / ( dv2_0 - dv2_2 ) );

	if ( a_t1 > a_t2 ) {
		tmp = a_t1;
		a_t1 = a_t2;
		a_t2 = tmp;

		tmp = pv1_1;
		pv1_1 = pv1_2;
		pv1_2 = tmp;

		tmp = ab;
		ab = ac;
		ac = tmp;
	}
	if ( b_t1 > b_t2 ) {
		tmp = b_t1;
		b_t1 = b_t2;
		b_t2 = tmp;

		tmp = pv2_1;
		pv2_1 = pv2_2;
		pv2_2 = tmp;

		tmp = bb;
		bb = bc;
		bc = tmp;
	}

	if (
		( a_t1 >= b_t1 && a_t1 <= b_t2 ) ||
		( a_t2 >= b_t1 && a_t2 <= b_t2 ) ||
		( b_t1 >= a_t1 && b_t1 <= a_t2 ) ||
		( b_t2 >= a_t1 && b_t2 <= a_t2 )
	) {
		//console.log( 'contact' );

		var contact = Goblin.ObjectPool.getObject( 'ContactDetails' );

		contact.object_a = tri_a;
		contact.object_b = tri_b;

        //debugger;

        var best_a_a = new Goblin.Vector3(),
            best_a_b = new Goblin.Vector3(),
            best_a_n = new Goblin.Vector3(),
            best_b_a = new Goblin.Vector3(),
            best_b_b = new Goblin.Vector3(),
            best_b_n = new Goblin.Vector3(),
            has_a = false,
            has_b = false;

        if ( tri_b.classifyVertex( aa ) <= 0 ) {
            // aa is penetrating tri_b
            has_a = true;
            Goblin.GeometryMethods.findClosestPointInTriangle( aa, ba, bb, bc, best_a_b );
            best_a_a.copy( aa );
            best_a_n.copy( tri_b.normal );
            best_a_n.scale( -1 );
        } else {
            if ( a_t1 >= b_t1 && a_t1 <= b_t2 ) {
                // ab is penetrating tri_b
                has_a = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( ab, ba, bb, bc, best_a_b );
                best_a_a.copy( ab );
                best_a_n.copy( tri_b.normal );
                best_a_n.scale( -1 );
            } else if ( a_t2 >= b_t1 && a_t2 <= b_t2 ) {
                // ac is penetration tri_b
                has_a = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( ac, ba, bb, bc, best_a_b );
                best_a_a.copy( ac );
                best_a_n.copy( tri_b.normal );
                best_a_n.scale( -1 );
            }
        }

        if ( tri_a.classifyVertex( ba ) <= 0 ) {
            // ba is penetrating tri_a
            has_b = true;
            Goblin.GeometryMethods.findClosestPointInTriangle( ba, aa, ab, ac, best_b_a );
            best_b_b.copy( ba );
            best_b_n.copy( tri_a.normal );
        } else {
            if ( b_t1 >= a_t1 && b_t1 <= a_t2 ) {
                // bb is penetrating tri_a
                has_b = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( bb, aa, ab, ac, best_b_a );
                best_b_b.copy( bb );
                best_b_n.copy( tri_a.normal );
            } else if ( b_t2 >= a_t1 && b_t2 <= a_t2 ) {
                // bc is penetration tri_a
                has_b = true;
                Goblin.GeometryMethods.findClosestPointInTriangle( bc, aa, ab, ac, best_b_a );
                best_b_b.copy( bc );
                best_b_n.copy( tri_a.normal );
            }
        }

        _tmp_vec3_1.subtractVectors( best_a_a, best_a_b );
        _tmp_vec3_2.subtractVectors( best_b_a, best_b_b );
        if ( !has_b || ( has_a && _tmp_vec3_1.lengthSquared() < _tmp_vec3_2.lengthSquared() ) ) {
            contact.contact_point_in_a.copy( best_a_a );
            contact.contact_point_in_b.copy( best_a_b );
            contact.contact_normal.copy( best_a_n );
        } else {
            contact.contact_point_in_a.copy( best_b_a );
            contact.contact_point_in_b.copy( best_b_b );
            contact.contact_normal.copy( best_b_n );
        }
        _tmp_vec3_1.subtractVectors( contact.contact_point_in_a, contact.contact_point_in_b );
        contact.penetration_depth = _tmp_vec3_1.length();
        //console.log( 'depth', contact.penetration_depth );
        //console.log( contact.contact_normal );
		//if (contact.penetration_depth > 1) debugger;



		contact.contact_point.addVectors( contact.contact_point_in_a, contact.contact_point_in_b );
		contact.contact_point.scale( 0.5 );

		/*m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xFF0000 }) );
		m.position.copy( contact.contact_point_in_a );
		exampleUtils.scene.add( m );

        m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0x0000FF }) );
        m.position.copy( contact.contact_point_in_b );
        exampleUtils.scene.add( m );

        m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0x00FF00 }) );
        m.position.copy( contact.contact_point );
        exampleUtils.scene.add( m );*/

		return contact;
	}

	/*var m;
	_tmp_vec3_1.scaleVector( d, a_t1 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xDDAAAA }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, a_t2 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xDDAAAA }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, b_t1 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xAAAADD }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );

	_tmp_vec3_1.scaleVector( d, b_t2 / d.length() );
	m = new THREE.Mesh( new THREE.SphereGeometry( 0.05 ), new THREE.MeshBasicMaterial({ color: 0xAAAADD }) );
	m.position.copy( _tmp_vec3_1 );
	exampleUtils.scene.add( m );*/

	return null;
};

Goblin.Constraint = (function() {
	var constraint_count = 0;

	return function() {
		this.id = constraint_count++;

		this.active = true;

		this.object_a = null;

		this.object_b = null;

		this.limit = new Goblin.ConstraintLimit();

		this.motor = new Goblin.ConstraintMotor();

		this.rows = [];

		this.factor = 1;

		this.last_impulse = new Goblin.Vector3();

		this.breaking_threshold = 0;

		this.listeners = {};
	};
})();
Goblin.EventEmitter.apply( Goblin.Constraint );

Goblin.Constraint.prototype.deactivate = function() {
	this.active = false;
	this.emit( 'deactivate' );
};

Goblin.Constraint.prototype.update = function(){};

Goblin.Constraint.prototype.object_a_is_dynamic = function() {
	return this.object_a !== null && !this.object_a._is_kinematic && this.object_a._mass !== Infinity;
};

Goblin.Constraint.prototype.object_b_is_dynamic = function() {
	return this.object_b !== null && !this.object_b._is_kinematic && this.object_b._mass !== Infinity;
};
Goblin.ConstraintLimit = function( limit_lower, limit_upper ) {
	this.erp = 0.3;
	this.constraint_row = null;

	this.set( limit_lower, limit_upper );
};

Goblin.ConstraintLimit.prototype.set = function( limit_lower, limit_upper ) {
	this.limit_lower = limit_lower;
	this.limit_upper = limit_upper;

	this.enabled = this.limit_lower != null || this.limit_upper != null;
};

Goblin.ConstraintLimit.prototype.createConstraintRow = function() {
	this.constraint_row = Goblin.ConstraintRow.createConstraintRow();
};
Goblin.ConstraintMotor = function( torque, max_speed ) {
	this.constraint_row = null;
	this.set( torque, max_speed);
};

Goblin.ConstraintMotor.prototype.set = function( torque, max_speed ) {
	this.enabled = torque != null && max_speed != null;
	this.torque = torque;
	this.max_speed = max_speed;
};

Goblin.ConstraintMotor.prototype.createConstraintRow = function() {
	this.constraint_row = Goblin.ConstraintRow.createConstraintRow();
};
Goblin.ConstraintRow = function() {
	this.jacobian = new Float64Array( 12 );
	this.B = new Float64Array( 12 ); // `B` is the jacobian multiplied by the objects' inverted mass & inertia tensors
	this.D = 0; // Length of the jacobian

	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;

	this.bias = 0;
	this.multiplier = 0;
	this.multiplier_cached = 0;
	this.cfm = 0;
	this.eta = 0;
	this.eta_row = new Float64Array( 12 );
};

Goblin.ConstraintRow.createConstraintRow = function() {
	var row =  Goblin.ObjectPool.getObject( 'ConstraintRow' );
	row.lower_limit = -Infinity;
	row.upper_limit = Infinity;
	row.bias = 0;

	row.jacobian[0] = row.jacobian[1] = row.jacobian[2] =
	row.jacobian[3] = row.jacobian[4] = row.jacobian[5] =
	row.jacobian[6] = row.jacobian[7] = row.jacobian[8] =
	row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;

	return row;
};

/**
 * Resets row's jacobian to 0 effectively disabling the constrain for corresponding
 * bodies.
 *
 * @param {boolean} nullify_a Whether to nullify first object's jacobian
 * @param {boolean} nullify_b Whether to nullify second object's jacobian
 */
Goblin.ConstraintRow.prototype.nullify = function( nullify_a, nullify_b ) {
	var i = 0;

	for ( i = 0; nullify_a && ( i < 6 ); i++ ) {
		this.jacobian[ i ] = 0;
	}

	for ( i = 6; nullify_b && ( i < 12 ); i++ ) {
		this.jacobian[ i ] = 0;
	}
};

/**
 * Resets row to "blank state" (zero jacobian, no limits and zero bias).
 */
Goblin.ConstraintRow.prototype.reset = function() {
	this.nullify( true, true );
	this.lower_limit = -Infinity;
	this.upper_limit = Infinity;
	this.bias = 0;
};


Goblin.ConstraintRow.prototype.computeB = function( constraint ) {
	var invmass;
	var jacobian = this.jacobian;
	var b = this.B;

	if ( constraint.object_a_is_dynamic() ) {
		invmass = constraint.object_a._mass_inverted;

		b[0] = invmass * jacobian[0];
		b[1] = invmass * jacobian[1];
		b[2] = invmass * jacobian[2];

		_tmp_vec3_1.x = jacobian[3];
		_tmp_vec3_1.y = jacobian[4];
		_tmp_vec3_1.z = jacobian[5];
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		b[3] = _tmp_vec3_1.x;
		b[4] = _tmp_vec3_1.y;
		b[5] = _tmp_vec3_1.z;
	} else {
		b[0] = b[1] = b[2] = 0;
		b[3] = b[4] = b[5] = 0;
	}

	if ( constraint.object_b_is_dynamic() ) {
		invmass = constraint.object_b._mass_inverted;
		b[6] = invmass * jacobian[6];
		b[7] = invmass * jacobian[7];
		b[8] = invmass * jacobian[8];

		_tmp_vec3_1.x = jacobian[9];
		_tmp_vec3_1.y = jacobian[10];
		_tmp_vec3_1.z = jacobian[11];
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		b[9] =  _tmp_vec3_1.x;
		b[10] = _tmp_vec3_1.y;
		b[11] = _tmp_vec3_1.z;
	} else {
		b[6] = b[7] =  b[8] = 0;
		b[9] = b[10] = b[11] = 0;
	}
};

Goblin.ConstraintRow.prototype.computeD = function() {
	var jacobian = this.jacobian;
	var b = this.B;

	this.D = (
		jacobian[0]  * b[0] +
		jacobian[1]  * b[1] +
		jacobian[2]  * b[2] +
		jacobian[3]  * b[3] +
		jacobian[4]  * b[4] +
		jacobian[5]  * b[5] +
		jacobian[6]  * b[6] +
		jacobian[7]  * b[7] +
		jacobian[8]  * b[8] +
		jacobian[9]  * b[9] +
		jacobian[10] * b[10] +
		jacobian[11] * b[11]
	);
};

Goblin.ConstraintRow.prototype.computeEta = function( constraint, time_delta ) {
	var invmass,
		inverse_time_delta = 1 / time_delta;

	var eta_row = this.eta_row;
	var jacobian = this.jacobian;
	var linear_factor, linear_velocity, angular_factor, angular_velocity, accumulated_force;

	if ( !constraint.object_a_is_dynamic() ) {
		eta_row[0] = eta_row[1] = eta_row[2] = eta_row[3] = eta_row[4] = eta_row[5] = 0;
	} else {
		invmass = constraint.object_a._mass_inverted;

		linear_factor = constraint.object_a.linear_factor;
		linear_velocity = constraint.object_a.linear_velocity;
		angular_factor = constraint.object_a.angular_factor;
		angular_velocity = constraint.object_a.angular_velocity;
		accumulated_force = constraint.object_a.accumulated_force;

		eta_row[0] = linear_factor.x * ( linear_velocity.x + ( invmass * accumulated_force.x ) ) * inverse_time_delta;
		eta_row[1] = linear_factor.y * ( linear_velocity.y + ( invmass * accumulated_force.y ) ) * inverse_time_delta;
		eta_row[2] = linear_factor.z * ( linear_velocity.z + ( invmass * accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_a.accumulated_torque );
		constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		eta_row[3] = angular_factor.x * ( angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		eta_row[4] = angular_factor.y * ( angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		eta_row[5] = angular_factor.z * ( angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
	}

	if ( !constraint.object_b_is_dynamic() ) {
		eta_row[6] = eta_row[7] = eta_row[8] = eta_row[9] = eta_row[10] = eta_row[11] = 0;
	} else {
		invmass = constraint.object_b._mass_inverted;

		linear_factor = constraint.object_b.linear_factor;
		linear_velocity = constraint.object_b.linear_velocity;
		angular_factor = constraint.object_b.angular_factor;
		angular_velocity = constraint.object_b.angular_velocity;
		accumulated_force = constraint.object_b.accumulated_force;

		eta_row[6] = linear_factor.x * ( linear_velocity.x + ( invmass * accumulated_force.x ) ) * inverse_time_delta;
		eta_row[7] = linear_factor.y * ( linear_velocity.y + ( invmass * accumulated_force.y ) ) * inverse_time_delta;
		eta_row[8] = linear_factor.z * ( linear_velocity.z + ( invmass * accumulated_force.z ) ) * inverse_time_delta;

		_tmp_vec3_1.copy( constraint.object_b.accumulated_torque );
		constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
		eta_row[9] =  angular_factor.x * ( angular_velocity.x + _tmp_vec3_1.x ) * inverse_time_delta;
		eta_row[10] = angular_factor.y * ( angular_velocity.y + _tmp_vec3_1.y ) * inverse_time_delta;
		eta_row[11] = angular_factor.z * ( angular_velocity.z + _tmp_vec3_1.z ) * inverse_time_delta;
	}

	var jdotv = jacobian[0]  * eta_row[0] +
				jacobian[1]  * eta_row[1] +
				jacobian[2]  * eta_row[2] +
				jacobian[3]  * eta_row[3] +
				jacobian[4]  * eta_row[4] +
				jacobian[5]  * eta_row[5] +
				jacobian[6]  * eta_row[6] +
				jacobian[7]  * eta_row[7] +
				jacobian[8]  * eta_row[8] +
				jacobian[9]  * eta_row[9] +
				jacobian[10] * eta_row[10] +
				jacobian[11] * eta_row[11];

	this.eta = ( this.bias * inverse_time_delta ) - jdotv;

	var total_mass = ( constraint.object_a_is_dynamic() ? constraint.object_a._mass : 0 ) +
					 ( constraint.object_b_is_dynamic() ? constraint.object_b._mass : 0 );

	this.eta = this.eta / ( 1.0 + this.cfm * total_mass );
};
Goblin.ContactConstraint = function() {
	Goblin.Constraint.call( this );

	this.contact = null;
};
Goblin.ContactConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.ContactConstraint.prototype.buildFromContact = function( contact ) {
	this.object_a = contact.object_a;
	this.object_b = contact.object_b;
	this.contact = contact;

	var self = this;
	var onDestroy = function() {
		this.removeListener( 'destroy', onDestroy );
		self.deactivate();
	};
	this.contact.addListener( 'destroy', onDestroy );

	var row = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );
	row.lower_limit = 0;
	row.upper_limit = Infinity;
	this.rows[0] = row;

	this.update();
};

Goblin.ContactConstraint.prototype.update = function() {
	var row = this.rows[0];

	if ( !this.object_a_is_dynamic() ) {
		row.jacobian[0] = row.jacobian[1] = row.jacobian[2] = 0;
		row.jacobian[3] = row.jacobian[4] = row.jacobian[5] = 0;
	} else {
		row.jacobian[0] = -this.contact.contact_normal.x;
		row.jacobian[1] = -this.contact.contact_normal.y;
		row.jacobian[2] = -this.contact.contact_normal.z;

		_tmp_vec3_1.subtractVectors( this.contact.contact_point, this.contact.object_a.position );
		_tmp_vec3_1.cross( this.contact.contact_normal );
		row.jacobian[3] = -_tmp_vec3_1.x;
		row.jacobian[4] = -_tmp_vec3_1.y;
		row.jacobian[5] = -_tmp_vec3_1.z;
	}

	if ( !this.object_b_is_dynamic() ) {
		row.jacobian[6] = row.jacobian[7] = row.jacobian[8] = 0;
		row.jacobian[9] = row.jacobian[10] = row.jacobian[11] = 0;
	} else {
		row.jacobian[6] = this.contact.contact_normal.x;
		row.jacobian[7] = this.contact.contact_normal.y;
		row.jacobian[8] = this.contact.contact_normal.z;

		_tmp_vec3_1.subtractVectors( this.contact.contact_point, this.contact.object_b.position );
		_tmp_vec3_1.cross( this.contact.contact_normal );
		row.jacobian[9] = _tmp_vec3_1.x;
		row.jacobian[10] = _tmp_vec3_1.y;
		row.jacobian[11] = _tmp_vec3_1.z;
	}

	// Pre-calc error
	row.bias = 0;

	// Apply restitution
	var velocity_along_normal = 0;
	if ( this.object_a_is_dynamic() ) {
		this.object_a.getVelocityInLocalPoint( this.contact.contact_point_in_a, _tmp_vec3_1 );
		velocity_along_normal += _tmp_vec3_1.dot( this.contact.contact_normal );
	}
	if ( this.object_b_is_dynamic() ) {
		this.object_b.getVelocityInLocalPoint( this.contact.contact_point_in_b, _tmp_vec3_1 );
		velocity_along_normal -= _tmp_vec3_1.dot( this.contact.contact_normal );
	}

	// Add restitution to bias
	row.bias += velocity_along_normal * this.contact.restitution;
};
Goblin.FrictionConstraint = function() {
	Goblin.Constraint.call( this );

	this.contact = null;
};
Goblin.FrictionConstraint.prototype = Object.create( Goblin.Constraint.prototype );

Goblin.FrictionConstraint.prototype.buildFromContact = function( contact ) {
	this.rows[0] = this.rows[0] || Goblin.ObjectPool.getObject( 'ConstraintRow' );
	this.rows[1] = this.rows[1] || Goblin.ObjectPool.getObject( 'ConstraintRow' );

	this.object_a = contact.object_a;
	this.object_b = contact.object_b;
	this.contact = contact;

	var self = this;
	var onDestroy = function() {
		this.removeListener( 'destroy', onDestroy );
		self.deactivate();
	};
	this.contact.addListener( 'destroy', onDestroy );

	this.update();
};

Goblin.FrictionConstraint.prototype.update = (function(){
	var rel_a = new Goblin.Vector3(),
		rel_b = new Goblin.Vector3(),
		u1 = new Goblin.Vector3(),
		u2 = new Goblin.Vector3();

	return function updateFrictionConstraint() {
		var row_1 = this.rows[0],
			row_2 = this.rows[1];

		// Find the contact point relative to object_a and object_b
		rel_a.subtractVectors( this.contact.contact_point, this.object_a.position );
		rel_b.subtractVectors( this.contact.contact_point, this.object_b.position );

		this.contact.contact_normal.findOrthogonal( u1, u2 );

		if ( !this.object_a_is_dynamic() ) {
			row_1.jacobian[0] = row_1.jacobian[1] = row_1.jacobian[2] = 0;
			row_1.jacobian[3] = row_1.jacobian[4] = row_1.jacobian[5] = 0;
			row_2.jacobian[0] = row_2.jacobian[1] = row_2.jacobian[2] = 0;
			row_2.jacobian[3] = row_2.jacobian[4] = row_2.jacobian[5] = 0;
		} else {
			row_1.jacobian[0] = -u1.x;
			row_1.jacobian[1] = -u1.y;
			row_1.jacobian[2] = -u1.z;

			_tmp_vec3_1.crossVectors( rel_a, u1 );
			row_1.jacobian[3] = -_tmp_vec3_1.x;
			row_1.jacobian[4] = -_tmp_vec3_1.y;
			row_1.jacobian[5] = -_tmp_vec3_1.z;

			row_2.jacobian[0] = -u2.x;
			row_2.jacobian[1] = -u2.y;
			row_2.jacobian[2] = -u2.z;

			_tmp_vec3_1.crossVectors( rel_a, u2 );
			row_2.jacobian[3] = -_tmp_vec3_1.x;
			row_2.jacobian[4] = -_tmp_vec3_1.y;
			row_2.jacobian[5] = -_tmp_vec3_1.z;
		}

		if ( !this.object_b_is_dynamic() ) {
			row_1.jacobian[6] = row_1.jacobian[7] = row_1.jacobian[8] = 0;
			row_1.jacobian[9] = row_1.jacobian[10] = row_1.jacobian[11] = 0;
			row_2.jacobian[6] = row_2.jacobian[7] = row_2.jacobian[8] = 0;
			row_2.jacobian[9] = row_2.jacobian[10] = row_2.jacobian[11] = 0;
		} else {
			row_1.jacobian[6] = u1.x;
			row_1.jacobian[7] = u1.y;
			row_1.jacobian[8] = u1.z;

			_tmp_vec3_1.crossVectors( rel_b, u1 );
			row_1.jacobian[9] = _tmp_vec3_1.x;
			row_1.jacobian[10] = _tmp_vec3_1.y;
			row_1.jacobian[11] = _tmp_vec3_1.z;

			row_2.jacobian[6] = u2.x;
			row_2.jacobian[7] = u2.y;
			row_2.jacobian[8] = u2.z;

			_tmp_vec3_1.crossVectors( rel_b, u2 );
			row_2.jacobian[9] = _tmp_vec3_1.x;
			row_2.jacobian[10] = _tmp_vec3_1.y;
			row_2.jacobian[11] = _tmp_vec3_1.z;
		}

		var limit = this.contact.friction;
		if ( this.object_a_is_dynamic() ) {
			limit *= this.object_a._mass;
		}
		if ( this.object_b_is_dynamic() ) {
			limit *= this.object_b._mass;
		}
		if ( limit < 0 ) {
			limit = 0;
		}
		row_1.lower_limit = row_2.lower_limit = -limit;
		row_1.upper_limit = row_2.upper_limit = limit;

		row_1.bias = row_2.bias = 0;

		this.rows[0] = row_1;
		this.rows[1] = row_2;
	};
})();
/**
* adds a drag force to associated objects
*
* @class DragForce
* @extends ForceGenerator
* @constructor
*/
Goblin.DragForce = function( drag_coefficient, squared_drag_coefficient ) {
	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this.drag_coefficient = drag_coefficient || 0;

	/**
	* drag coefficient
	*
	* @property drag_coefficient
	* @type {Number}
	* @default 0
	*/
	this.squared_drag_coefficient = squared_drag_coefficient || 0;

	/**
	* whether or not the force generator is enabled
	*
	* @property enabled
	* @type {Boolean}
	* @default true
	*/
	this.enabled = true;

	/**
	* array of objects affected by the generator
	*
	* @property affected
	* @type {Array}
	* @default []
	* @private
	*/
	this.affected = [];
};
Goblin.DragForce.prototype.enable = Goblin.ForceGenerator.prototype.enable;
Goblin.DragForce.prototype.disable = Goblin.ForceGenerator.prototype.disable;
Goblin.DragForce.prototype.affect = Goblin.ForceGenerator.prototype.affect;
Goblin.DragForce.prototype.unaffect = Goblin.ForceGenerator.prototype.unaffect;
/**
* applies force to the associated objects
*
* @method applyForce
*/
Goblin.DragForce.prototype.applyForce = function() {
	if ( !this.enabled ) {
		return;
	}

	var i, affected_count, object, drag,
		force = _tmp_vec3_1;

	for ( i = 0, affected_count = this.affected.length; i < affected_count; i++ ) {
		object = this.affected[i];

		force.copy( object.linear_velocity );

		// Calculate the total drag coefficient.
		drag = force.length();
		drag = ( this.drag_coefficient * drag ) + ( this.squared_drag_coefficient * drag * drag );

		// Calculate the final force and apply it.
		force.normalize();
		force.scale( -drag );
		object.applyForce( force  );
	}
};
Goblin.RayIntersection = function() {
	this.object = null;
    this.shape = null;
	this.point = new Goblin.Vector3();
	this.t = null;
    this.normal = new Goblin.Vector3();
};
/**
 * @class BoxShape
 * @param half_width {Number} half width of the cube ( X axis )
 * @param half_height {Number} half height of the cube ( Y axis )
 * @param half_depth {Number} half depth of the cube ( Z axis )
 * @constructor
 */
Goblin.BoxShape = function( half_width, half_height, half_depth, material ) {
	/**
	 * Half width of the cube ( X axis )
	 *
	 * @property half_width
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * Half height of the cube ( Y axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = half_height;

	/**
	 * Half width of the cube ( Z axis )
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_depth = half_depth;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );

	this.material = material || null;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.BoxShape.prototype.calculateLocalAABB = function( aabb ) {
    aabb.min.x = -this.half_width;
    aabb.min.y = -this.half_height;
    aabb.min.z = -this.half_depth;

    aabb.max.x = this.half_width;
    aabb.max.y = this.half_height;
    aabb.max.z = this.half_depth;
};

Goblin.BoxShape.prototype.getInertiaTensor = function( mass ) {
	var height_squared = this.half_height * this.half_height * 4,
		width_squared = this.half_width * this.half_width * 4,
		depth_squared = this.half_depth * this.half_depth * 4,
		element = 0.0833 * mass;
	return new Goblin.Matrix3(
		element * ( height_squared + depth_squared ), 0, 0,
		0, element * ( width_squared + depth_squared ), 0,
		0, 0, element * ( height_squared + width_squared )
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.BoxShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	support_point = [
		sign( direction.x ) * half_width,
		sign( direction.y ) * half_height,
		sign( direction.z ) * half_depth
	]
	*/

    support_point.x = Math.sign( direction.x ) * this.half_width;
    support_point.y = Math.sign( direction.y ) * this.half_height;
    support_point.z = Math.sign( direction.z ) * this.half_depth;
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.BoxShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		tmin, tmax,
		axis, ood, t1, t2, extent;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		for ( var i = 0; i < 3; i++ ) {
			axis = i === 0 ? 'x' : ( i === 1 ? 'y' : 'z' );
			extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );

			if ( Math.abs( direction[axis] ) < Goblin.EPSILON ) {
				// Ray is parallel to axis
				if ( start[axis] < -extent || start[axis] > extent ) {
					return null;
				}
			}

            ood = 1 / direction[axis];
            t1 = ( -extent - start[axis] ) * ood;
            t2 = ( extent - start[axis] ) * ood;
            if ( t1 > t2  ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return null;
            }
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = tmin;
		intersection.point.scaleVector( direction, tmin );
		intersection.point.add( start );

		// Find face normal
        var max = Infinity;
		for ( i = 0; i < 3; i++ ) {
			axis = i === 0 ? 'x' : ( i === 1 ? 'y' : 'z' );
			extent = ( i === 0 ? this.half_width : (  i === 1 ? this.half_height : this.half_depth ) );
			if ( extent - Math.abs( intersection.point[axis] ) < max ) {
				intersection.normal.x = intersection.normal.y = intersection.normal.z = 0;
				intersection.normal[axis] = intersection.point[axis] < 0 ? -1 : 1;
				max = extent - Math.abs( intersection.point[axis] );
			}
		}

		return intersection;
	};
})();
/**
 * @class CapsuleShape
 * @param radius {Number} capsule radius
 * @param half_height {Number} half height of the capsule
 * @param material {pc.Material} physics material of the capsule
 * @constructor
 */
Goblin.CapsuleShape = function( radius, half_height, material ) {
	/**
	 * radius of the capsule
	 *
	 * @property radius
	 * @type {Number}
	 */
	this.radius = radius;

	/**
	 * half height of the capsule
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_height = Math.abs(half_height);

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );

	this.material = material || null;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CapsuleShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.z = -this.radius;
	aabb.min.y = -this.half_height - this.radius;

	aabb.max.x = aabb.max.z = this.radius;
	aabb.max.y = this.half_height + this.radius;
};

Goblin.CapsuleShape.prototype.getInertiaTensor = function( mass ) {
	if ( -Goblin.EPSILON <= this.half_height && this.half_height <= Goblin.EPSILON ) {
		if ( -Goblin.EPSILON <= this.radius && this.radius <= Goblin.EPSILON ) {
			return new Goblin.Matrix3();
		}
		var element = 0.4 * mass * this.radius * this.radius;
		return new Goblin.Matrix3(
			element, 0, 0,
			0, element, 0,
			0, 0, element
		);
	}

	var k = 1.5 * this.half_height / this.radius;
	var ms = mass / ( 1 + k );
	var mc = mass / ( 1 + 1 / k );
	var r2 = this.radius * this.radius;
	var is = 0.4 * ms * r2;
	var ic = 0.0833 * mc * ( 3 * r2 + 4 * this.half_height * this.half_height );
	var i = is + ic + ms * ( 3 * this.radius + 4 * this.half_height ) * this.half_height / 4;

	return new Goblin.Matrix3(
		i, 0, 0,
		0, is + 0.5 * mc * r2, 0,
		0, 0, i
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.CapsuleShape.prototype.findSupportPoint = ( function(){
	var temp = new Goblin.Vector3();
	return function( direction, support_point ) {
		temp.normalizeVector( direction );
		support_point.scaleVector( temp, this.radius );
		support_point.y += Math.sign( direction.y ) * this.half_height;
	};
} )();

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CapsuleShape.prototype.rayIntersect = ( function(){
	var direction = new Goblin.Vector3(),
		length,
		k, a, c,
		py,
		discr, discr_sqrt,
		y1, y2, y4,
		t1, t2, t3, t4,
		intersection;

	function getIntersectionFromPoint( x, y, z, scale ) {
		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.point.set( x, y, z );
		intersection.t = scale;
		return intersection;
	}

	function getIntersectionFromDirection( start, scale ) {
		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.point.scaleVector( direction, scale );
		intersection.point.add( start );
		intersection.t = scale;
		return intersection;
	}

	return function( start, end ) {

		direction.subtractVectors( end, start );
		length = direction.length();
		if ( length <= Goblin.EPSILON ) { // segment is a point, can't intersect
			return null;
		}
		direction.scale( 1.0 / length  ); // normalize direction

		a = direction.x * direction.x + direction.z * direction.z;
		c = start.x * start.x + start.z * start.z - this.radius * this.radius;

		if ( a <= Goblin.EPSILON ) { // segment runs parallel to capsule y axis
			if ( -Goblin.EPSILON <= c && c <= Goblin.EPSILON ) { // segment is on the side surface
				if ( start.y > this.half_height ) { // segment starts above top
					if ( end.y > this.half_height ) { // segment ends above top, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, this.half_height, start.z, start.y - this.half_height );
				} else if ( start.y < -this.half_height ) { // segment starts below bottom
					if ( end.y < -this.half_height ) { // segment ends below bottom, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, -this.half_height, start.z, -start.y - this.half_height );
				} else if ( end.y >= this.half_height ) { // segment starts between top and bottom and ends above top
					intersection = getIntersectionFromPoint( start.x, this.half_height, start.z, this.half_height - start.y );
				} else if ( end.y <= -this.half_height ) { // segment starts between top and bottom and ends below bottom
					intersection = getIntersectionFromPoint( start.x, -this.half_height, start.z, start.y + this.half_height );
				} else { // segment is fully included into capsule side surface
					return null; // segment is fully inside
				}
			} else if ( c > 0.0 ) { // segment runs parallel to the capsule and fully outside
				return null;
			} else {
				py = this.half_height + Math.sqrt( -c ); // intersection point y absolute value

				if ( start.y > py ) { // segment starts above top
					if ( end.y > py ) { // segment ends above top, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, py, start.z, start.y - py );
				} else if ( start.y < -py ) { // segment starts below bottom
					if ( end.y < -py ) { // segment ends below bottom, it's fully outside
						return null;
					}
					intersection = getIntersectionFromPoint( start.x, -py, start.z, -py - start.y );
				} else { // segment starts between top and bottom
					if ( end.y >= py ) { // segment ends above top
						intersection = getIntersectionFromPoint( start.x, py, start.z, py - start.y );
					} else if ( end.y <= -py ) { // segment ends below bottom
						intersection = getIntersectionFromPoint( start.x, -py, start.z, start.y + py );
					} else { // segment ends between top and bottom, it's fully inside
						return null;
					}
				}
			}
		} else { // segment is not parallel to capsule y axis
			k = start.x * direction.x + start.z * direction.z;
			discr = k * k - a * c;

			if ( -Goblin.EPSILON <= discr && discr <= Goblin.EPSILON ) { // there is only one line and cylinder intersection
				t1 = -k / a;
				if ( t1 < 0.0 || length < t1 ) { // intersection is outside of the segment
					return null;
				}
				y1 = start.y + t1 * direction.y;
				if ( -this.half_height <= y1 && y1 <= this.half_height ) { // segment intersects capsule in a single point
					intersection = getIntersectionFromDirection( start, t1 );
				} else { // no intersections with the capsule
					return null;
				}
			} else if ( discr < 0.0 ) { // no intersections with cylinder containing capsule
				return null;
			} else { // two line and cylinder intersection points
				discr_sqrt = Math.sqrt( discr );
				t2 = ( -k + discr_sqrt ) / a; // t2 is farther away in segment direction from start point than t1
				if ( t2 < 0.0 ) { // segment is pointing away from the capsule, no intersections
					return null;
				}
				t1 = ( -k - discr_sqrt ) / a;
				if ( t1 > length ) { // intersections are outside of the segment
					return null;
				}

				y1 = start.y + t1 * direction.y;
				if ( y1 > this.half_height ) { // line intersects cylinder above capsule top
					a += direction.y * direction.y;
					c += ( start.y - this.half_height ) * ( start.y - this.half_height );
					k += direction.y * ( start.y - this.half_height );
					discr = k * k - a * c;

					if ( -Goblin.EPSILON <= discr && discr <= Goblin.EPSILON ) { // only one line and top sphere intersection point
						t3 = -k / a;
						if ( 0.0 <= t3 && t3 <= length ) {
							intersection = getIntersectionFromDirection( start, t3 );
						} else { // intersection is outside of the segment
							return null;
						}
					} else if ( discr < 0.0 ) { // line doesn't intersect top sphere
						return null;
					} else { // two line and top sphere intersection points
						discr_sqrt = Math.sqrt( discr );
						t3 = ( -k - discr_sqrt ) / a; // line and top sphere intersection closest to start point

						if ( t3 >= 0.0 ) {
							if ( t3 <= length ) { // intersection is inside of the segment
								intersection = getIntersectionFromDirection( start, t3 );
							} else { // intersection is after segment ends
								return null;
							}
						} else { // segment is pointing away from the line and top sphere first intersection
							t4 = ( -k + discr_sqrt ) / a; // line and top sphere second intersection point
							y4 = start.y + t4 * direction.y;
							if ( y4 > this.half_height ) { // line and top sphere intersection happens on capsule surface
								if ( 0.0 <= t4 && t4 <= length ) { // intersection is inside of the segment
									intersection = getIntersectionFromDirection( start, t4 );
								} else { // intersection is outside of the segment
									return null;
								}
							} else { // line intersects bottom hemisphere of the top sphere
								y2 = start.y + t2 * direction.y; // line and cylinder second intersection point
								if ( y2 < -this.half_height ) { // line intersects cylinder below capsule bottom, i. e. intersects bottom sphere

									c += 4.0 * this.half_height * start.y;
									k += 2.0 * direction.y * this.half_height;
									discr = k * k - a * c;

									if ( discr <= 0.0 ) { // line doesn't intersect bottom sphere or has single intersection point, that should never happen
										return null;
									}

									discr_sqrt = Math.sqrt( discr );
									t4 = ( -k + discr_sqrt ) / a;

									if ( t4 < 0.0 ) { // segment is pointing away from bottom sphere, no intersections
										return null;
									}

									if ( t4 <= length ) { // intersection is inside of the segment
										intersection = getIntersectionFromDirection( start, t4 );
									} else { // intersection is outside of the segment
										return null;
									}
								} else { // line intersects cylinder inside of the capsule
									if ( t2 <= length ) { // intersection is inside of the segment
										intersection = getIntersectionFromDirection( start, t2 );
									} else { // intersection is after segment ends
										return null;
									}
								}
							}
						}
					}
				} else if ( y1 < -this.half_height ) { // line intersects cylinder below capsule bottom
					a += direction.y * direction.y;
					c += ( start.y + this.half_height ) * ( start.y + this.half_height );
					k += direction.y * ( start.y + this.half_height );
					discr = k * k - a * c;

					if ( -Goblin.EPSILON <= discr && discr <= Goblin.EPSILON ) { // only one line and bottom sphere intersection point
						t3 = -k / a;
						if ( 0.0 <= t3 && t3 <= length ) {
							intersection = getIntersectionFromDirection( start, t3 );
						} else { // intersection is outside of the segment
							return null;
						}
					} else if ( discr < 0.0 ) { // line doesn't intersect bottom sphere
						return null;
					} else { // two line and bottom sphere intersection points
						discr_sqrt = Math.sqrt( discr );
						t3 = ( -k - discr_sqrt ) / a; // line and bottom sphere intersection closest to start point

						if ( t3 >= 0.0 ) {
							if ( t3 <= length ) { // intersection is inside of the segment
								intersection = getIntersectionFromDirection( start, t3 );
							} else { // intersection is after segment ends
								return null;
							}
						} else { // segment is pointing away from the line and bottom sphere first intersection
							t4 = ( -k + discr_sqrt ) / a; // line and bottom sphere second intersection point
							y4 = start.y + t4 * direction.y;
							if ( y4 < -this.half_height ) { // line and bottom sphere intersection happens on capsule surface
								if ( 0.0 <= t4 && t4 <= length ) { // intersection is inside of the segment
									intersection = getIntersectionFromDirection( start, t4 );
								} else { // intersection is outside of the segment
									return null;
								}
							} else { // line intersects top hemisphere of the bottom sphere
								y2 = start.y + t2 * direction.y; // line and cylinder second intersection point
								if ( y2 > this.half_height ) { // line intersects cylinder above capsule top, i. e. intersects top sphere

									c -= 4.0 * this.half_height * start.y;
									k -= 2.0 * direction.y * this.half_height;
									discr = k * k - a * c;

									if ( discr <= 0.0 ) { // line doesn't intersect top sphere or has single intersection point, that should never happen
										return null;
									}

									discr_sqrt = Math.sqrt( discr );
									t4 = ( -k + discr_sqrt ) / a;

									if ( t4 < 0.0 ) { // segment is pointing away from top sphere, no intersections
										return null;
									}

									if ( t4 <= length ) { // intersection is inside of the segment
										intersection = getIntersectionFromDirection( start, t4 );
									} else { // intersection is outside of the segment
										return null;
									}
								} else { // line intersects cylinder inside of the capsule
									if ( t2 <= length ) { // intersection is inside of the segment
										intersection = getIntersectionFromDirection( start, t2 );
									} else { // intersection is after segment ends
										return null;
									}
								}
							}
						}
					}
				} else if ( t1 >= 0.0 ) { // line intersects capsule between top and bottom (first intersection point)
					if ( t1 <= length ) { // intersection is inside of the segment
						intersection = getIntersectionFromDirection( start, t1 );
					} else { // intersection is after segment ends
						return null;
					}
				} else { // segment is pointing away from line and capsule first intersection point
					y2 = start.y + t2 * direction.y; // line and cylinder second intersection point
					if ( y2 > this.half_height ) { // line intersects cylinder above capsule top

						a += direction.y * direction.y;
						c += ( start.y - this.half_height ) * ( start.y - this.half_height );
						k += direction.y * ( start.y - this.half_height );
						discr = k * k - a * c;

						if ( discr <= 0.0 ) { // line doesn't intersect top sphere or has single intersection point, that should never happen
							return null;
						}

						discr_sqrt = Math.sqrt( discr );
						t4 = ( -k + discr_sqrt ) / a; // line and top sphere intersection point, the most distant from the start point

						if ( t4 < 0.0 ) { // segment is pointing away from the top sphere
							return null;
						}

						if ( t4 <= length ) { // intersection is inside of the segment
							intersection = getIntersectionFromDirection( start, t4 );
						} else { // intersection is after segment ends
							return null;
						}
					} else if ( y2 < -this.half_height ) { // line intersects cylinder below capsule bottom

						a += direction.y * direction.y;
						c += ( start.y + this.half_height ) * ( start.y + this.half_height );
						k += direction.y * ( start.y + this.half_height );
						discr = k * k - a * c;

						if ( discr <= 0.0 ) { // line doesn't intersect bottom sphere or has single intersection point, that should never happen
							return null;
						}

						discr_sqrt = Math.sqrt( discr );
						t4 = ( -k + discr_sqrt ) / a; // line and bottom intersection point, the most distant from the start point

						if ( t4 < 0.0 ) { // segment is pointing away from the bottom sphere
							return null;
						}

						if ( t4 <= length ) { // intersection is inside of the segment
							intersection = getIntersectionFromDirection( start, t4 );
						} else { // intersection is after segment ends
							return null;
						}
					} else { // line intersects capsule side surface
						if ( t2 <= length ) { // intersection is inside of the segment
							intersection = getIntersectionFromDirection( start, t2 );
						} else { // intersection is after segment ends
							return null;
						}
					}
				}
			}
		}

		intersection.normal.x = intersection.point.x;
		intersection.normal.z = intersection.point.z;
		if ( intersection.point.y < -this.half_height ) {
			intersection.normal.y = intersection.point.y + this.half_height;
		} else if ( intersection.point.y > this.half_height ) {
			intersection.normal.y = intersection.point.y - this.half_height;
		} else {
			intersection.normal.y = 0.0;
		}
		intersection.normal.scale( 1.0 / this.radius );
		intersection.object = this;

		return intersection;
	};
} )();

/**
 * @class CompoundShape
 * @constructor
 */
Goblin.CompoundShape = function() {
	this.child_shapes = [];

	this.aabb = new Goblin.AABB();

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
};

/**
 * Removes child shape from shapes collection and updates all values.
 *
 * @method removeChildShape
 * @param shape
 */
Goblin.CompoundShape.prototype.removeChildShape = function( shape ) {
	for ( var i = 0; i < this.child_shapes.length; i++ ) {
		if ( this.child_shapes[ i ].shape === shape ) {
			this.child_shapes[ i ] = this.child_shapes[ 0 ];
			this.child_shapes.shift();
			
			break;
		}
	}

	this.updateCenterOfMass();
	this.updateAABB();
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
Goblin.CompoundShape.prototype.updateCenterOfMass = function () {
	var i;

	if ( this.center_of_mass_override ) {
		this.center_of_mass.copy( this.center_of_mass_override );
	} else {
		this.center_of_mass.set( 0, 0, 0 );

		for( i = 0; i < this.child_shapes.length; i++ ) {
			this.center_of_mass.add( this.child_shapes[ i ].local_position );
		}

		// watch out for NaN because of 0/0
		if ( this.child_shapes.length > 0 ) {
			this.center_of_mass.scale( 1.0 / this.child_shapes.length );
		}
	}

	for( i = 0; i < this.child_shapes.length; i++ ) {
		this.child_shapes[ i ].center_of_mass.copy( this.center_of_mass );
		this.child_shapes[ i ].updateDerived();
	}
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.CompoundShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = Infinity;
	aabb.max.x = aabb.max.y = aabb.max.z = -Infinity;

	if ( this.child_shapes.length === 0 ) {
		return;
	}

	var i, shape;

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		shape = this.child_shapes[i];

		aabb.min.x = Math.min( aabb.min.x, shape.aabb.min.x );
		aabb.min.y = Math.min( aabb.min.y, shape.aabb.min.y );
		aabb.min.z = Math.min( aabb.min.z, shape.aabb.min.z );

		aabb.max.x = Math.max( aabb.max.x, shape.aabb.max.x );
		aabb.max.y = Math.max( aabb.max.y, shape.aabb.max.y );
		aabb.max.z = Math.max( aabb.max.z, shape.aabb.max.z );
	}
};

Goblin.CompoundShape.prototype.computeSteiner = function ( vector, mass, tensor ) {
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
		child = this.child_shapes[i];

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
 * @param 	ray_start 	{vec3} 		Start point of the segment
 * @param 	ray_end 	{vec3} 		End point of the segment
 * @param 	limit      	{Number}    Limit the amount of intersections (i.e. 1)
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.CompoundShape.prototype.rayIntersect = function( ray_start, ray_end, limit ) {
	var intersections = [],
		local_start = new Goblin.Vector3(),
		local_end = new Goblin.Vector3(),
		intersection,
		i, child;

	for ( i = 0; i < this.child_shapes.length; i++ ) {
		child = this.child_shapes[i];

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
/**
 * @class CompoundShapeChild
 * @constructor
 */
Goblin.CompoundShapeChild = function( shape, local_position, rotation ) {
	this.shape = shape;

	this.local_position = new Goblin.Vector3( local_position.x, local_position.y, local_position.z );
    this.center_of_mass = new Goblin.Vector3();
    this.position = new Goblin.Vector3();
	this.rotation = new Goblin.Quaternion( rotation.x, rotation.y, rotation.z, rotation.w );

	this.transform = new Goblin.Matrix4();
	this.transform_inverse = new Goblin.Matrix4();
	
	this.aabb = new Goblin.AABB();

    this.updateDerived();
};

Goblin.CompoundShapeChild.prototype.updateDerived = function () {
    this.position.copy( this.local_position );
    this.position.subtract( this.center_of_mass );

    this.transform.makeTransform( this.rotation, this.position );
    this.transform.invertInto( this.transform_inverse );
    this.aabb.transform( this.shape.aabb, this.transform );
};
/**
 * @class ConvexShape
 * @param vertices {Array<vec3>} array of vertices composing the convex hull
 * @constructor
 */
Goblin.ConvexShape = function( vertices ) {
	/**
	 * vertices composing the convex hull
	 *
	 * @property vertices
	 * @type {Array<vec3>}
	 */
	this.vertices = [];

	/**
	 * faces composing the convex hull
	 * @type {Array}
	 */
	this.faces = [];

	/**
	 * the convex hull's volume
	 * @property volume
	 * @type {number}
	 */
	this.volume = 0;

	/**
	 * coordinates of the hull's COM
	 * @property center_of_mass
	 * @type {vec3}
	 */
	this.center_of_mass = new Goblin.Vector3();

	/**
	 * used in computing the convex hull's center of mass & volume
	 * @property _intergral
	 * @type {Float32Array}
	 * @private
	 */
	this._integral = new Float32Array( 10 );

	this.process( vertices );

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

Goblin.ConvexShape.prototype.process = function( vertices ) {
	// Find two points furthest apart on X axis
	var candidates = vertices.slice(),
		min_point = null,
		max_point = null;

	for ( var i = 0; i < candidates.length; i++ ) {
		var vertex = candidates[i];

		if ( min_point == null || min_point.x > vertex.x ) {
			min_point = vertex;
		}
		if ( max_point == null || max_point.x > vertex.x ) {
			max_point = vertex;
		}
	}
	if ( min_point === max_point ) {
		max_point = vertices[0] === min_point ? vertices[1] : vertices[0];
	}

	// Initial 1-simplex
	var point_a = min_point,
		point_b = max_point;
	candidates.splice( candidates.indexOf( point_a ), 1 );
	candidates.splice( candidates.indexOf( point_b ), 1 );

	// Find the point most distant from the line to construct the 2-simplex
	var distance = -Infinity,
		furthest_idx = null,
		candidate, candidate_distance;

	for ( i = 0; i < candidates.length; i++ ) {
		candidate = candidates[i];
		candidate_distance = Goblin.GeometryMethods.findSquaredDistanceFromSegment( candidate, point_a, point_b );
		if ( candidate_distance > distance ) {
			distance = candidate_distance;
			furthest_idx = i;
		}
	}
	var point_c = candidates[furthest_idx];
	candidates.splice( furthest_idx, 1 );

	// Fourth point of the 3-simplex is the one furthest away from the 2-simplex
	_tmp_vec3_1.subtractVectors( point_b, point_a );
	_tmp_vec3_2.subtractVectors( point_c, point_a );
	_tmp_vec3_1.cross( _tmp_vec3_2 ); // _tmp_vec3_1 is the normal of the 2-simplex

	distance = -Infinity;
	furthest_idx = null;

	for ( i = 0; i < candidates.length; i++ ) {
		candidate = candidates[i];
		candidate_distance = Math.abs( _tmp_vec3_1.dot( candidate ) );
		if ( candidate_distance > distance ) {
			distance = candidate_distance;
			furthest_idx = i;
		}
	}
	var point_d = candidates[furthest_idx];
	candidates.splice( furthest_idx, 1 );

	// If `point_d` is on the front side of `abc` then flip to `cba`
	if ( _tmp_vec3_1.dot( point_d ) > 0 ) {
		var tmp_point = point_a;
		point_a = point_c;
		point_c = tmp_point;
	}

	// We have our starting tetrahedron, rejoice
	// Now turn that into a polyhedron
	var polyhedron = new Goblin.GjkEpa.Polyhedron({ points:[
		{ point: point_c }, { point: point_b }, { point: point_a }, { point: point_d }
	]});

	// Add the rest of the points
	for ( i = 0; i < candidates.length; i++ ) {
		// We are going to lie and tell the polyhedron that its closest face is any of the faces which can see the candidate
		polyhedron.closest_face = null;
		for ( var j = 0; j < polyhedron.faces.length; j++ ) {
			if ( polyhedron.faces[j].active === true && polyhedron.faces[j].classifyVertex( { point: candidates[i] } ) > 0 ) {
				polyhedron.closest_face = j;
				break;
			}
		}
		if ( polyhedron.closest_face == null ) {
			// This vertex is already contained by the existing hull, ignore
			continue;
		}
		polyhedron.addVertex( { point: candidates[i] } );
	}

	this.faces = polyhedron.faces.filter(function( face ){
		return face.active;
	});

	// find all the vertices & edges which make up the convex hull
	var convexshape = this;
	
	this.faces.forEach(function( face ){
		// If we haven't already seen these vertices then include them
		var a = face.a.point,
			b = face.b.point,
			c = face.c.point,
			ai = convexshape.vertices.indexOf( a ),
			bi = convexshape.vertices.indexOf( b ),
			ci = convexshape.vertices.indexOf( c );

		// Include vertices if they are new
		if ( ai === -1 ) {
			convexshape.vertices.push( a );
		}
		if ( bi === -1 ) {
			convexshape.vertices.push( b );
		}
		if ( ci === -1 ) {
			convexshape.vertices.push( c );
		}
	});

	this.computeVolume( this.faces );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.ConvexShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = 0;
	aabb.max.x = aabb.max.y = aabb.max.z = 0;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		aabb.min.x = Math.min( aabb.min.x, this.vertices[i].x );
		aabb.min.y = Math.min( aabb.min.y, this.vertices[i].y );
		aabb.min.z = Math.min( aabb.min.z, this.vertices[i].z );

		aabb.max.x = Math.max( aabb.max.x, this.vertices[i].x );
		aabb.max.y = Math.max( aabb.max.y, this.vertices[i].y );
		aabb.max.z = Math.max( aabb.max.z, this.vertices[i].z );
	}
};

Goblin.ConvexShape.prototype.computeVolume = (function(){
	var origin = { point: new Goblin.Vector3() },
		output = new Float32Array( 6 ),
		macro = function( a, b, c ) {
			var temp0 = a + b,
				temp1 = a * a,
				temp2 = temp1 + b * temp0;

			output[0] = temp0 + c;
			output[1] = temp2 + c * output[0];
			output[2] = a * temp1 + b * temp2 + c * output[1];
			output[3] = output[1] + a * ( output[0] + a );
			output[4] = output[1] + b * ( output[0] + b );
			output[5] = output[1] + c * ( output[0] + c );
		};

	return function( faces ) {
		for ( var i = 0; i < faces.length; i++ ) {
			var face = faces[i],
				v0 = face.a.point,
				v1 = face.b.point,
				v2 = face.c.point;

			var a1 = v1.x - v0.x,
				b1 = v1.y - v0.y,
				c1 = v1.z - v0.z,
				a2 = v2.x - v0.x,
				b2 = v2.y - v0.y,
				c2 = v2.z - v0.z,
				d0 = b1 * c2 - b2 * c1,
				d1 = a2 * c1 - a1 * c2,
				d2 = a1 * b2 - a2 * b1;

			macro( v0.x, v1.x, v2.x );
			var f1x = output[0],
				f2x = output[1],
				f3x = output[2],
				g0x = output[3],
				g1x = output[4],
				g2x = output[5];

			macro( v0.y, v1.y, v2.y );
			var f1y = output[0],
				f2y = output[1],
				f3y = output[2],
				g0y = output[3],
				g1y = output[4],
				g2y = output[5];

			macro( v0.z, v1.z, v2.z );
			var f1z = output[0],
				f2z = output[1],
				f3z = output[2],
				g0z = output[3],
				g1z = output[4],
				g2z = output[5];

			var contributor = face.classifyVertex( origin ) > 0 ? -1 : 1;

			this._integral[0] += contributor * d0 * f1x;
			this._integral[1] += contributor * d0 * f2x;
			this._integral[2] += contributor * d1 * f2y;
			this._integral[3] += contributor * d2 * f2z;
			this._integral[4] += contributor * d0 * f3x;
			this._integral[5] += contributor * d1 * f3y;
			this._integral[6] += contributor * d2 * f3z;
			this._integral[7] += contributor * d0 * ( v0.y * g0x + v1.y * g1x + v2.y * g2x );
			this._integral[8] += contributor * d1 * ( v0.z * g0y + v1.z * g1y + v2.z * g2y );
			this._integral[9] += contributor * d2 * ( v0.x * g0z + v1.x * g1z + v2.x * g2z );
		}

		this._integral[0] *= 1 / 6;
		this._integral[1] *= 1 / 24;
		this._integral[2] *= 1 / 24;
		this._integral[3] *= 1 / 24;
		this._integral[4] *= 1 / 60;
		this._integral[5] *= 1 / 60;
		this._integral[6] *= 1 / 60;
		this._integral[7] *= 1 / 120;
		this._integral[8] *= 1 / 120;
		this._integral[9] *= 1 / 120;

		this.volume = this._integral[0];

		this.center_of_mass.x = this._integral[1] / this.volume;
		this.center_of_mass.y = this._integral[2] / this.volume;
		this.center_of_mass.z = this._integral[3] / this.volume;
	};
})();

Goblin.ConvexShape.prototype.getInertiaTensor = (function(){
	return function( mass ) {
		var	inertia_tensor = new Goblin.Matrix3();
		mass /= this.volume;

		inertia_tensor.e00 = ( this._integral[5] + this._integral[6] ) * mass;
		inertia_tensor.e11 = ( this._integral[4] + this._integral[6] ) * mass;
		inertia_tensor.e22 = ( this._integral[4] + this._integral[5] ) * mass;
		inertia_tensor.e10 = inertia_tensor.e01 = -this._integral[7] * mass; //xy
		inertia_tensor.e21 = inertia_tensor.e12 = -this._integral[8] * mass; //yz
		inertia_tensor.e20 = inertia_tensor.e02 = -this._integral[9] * mass; //xz

		inertia_tensor.e00 -= mass * ( this.center_of_mass.y * this.center_of_mass.y + this.center_of_mass.z * this.center_of_mass.z );
		inertia_tensor.e11 -= mass * ( this.center_of_mass.x * this.center_of_mass.x + this.center_of_mass.z * this.center_of_mass.z );
		inertia_tensor.e22 -= mass * ( this.center_of_mass.x * this.center_of_mass.x + this.center_of_mass.y * this.center_of_mass.y );

		inertia_tensor.e10 += mass * this.center_of_mass.x * this.center_of_mass.y;
		inertia_tensor.e01 += mass * this.center_of_mass.x * this.center_of_mass.y;

		inertia_tensor.e21 += mass * this.center_of_mass.y * this.center_of_mass.z;
		inertia_tensor.e12 += mass * this.center_of_mass.y * this.center_of_mass.z;

		inertia_tensor.e20 += mass * this.center_of_mass.x * this.center_of_mass.z;
		inertia_tensor.e02 += mass * this.center_of_mass.x * this.center_of_mass.z;

		return inertia_tensor;
	};
})();

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.ConvexShape.prototype.findSupportPoint = function( direction, support_point ) {
	var best,
		best_dot = -Infinity,
		dot;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		dot = this.vertices[i].dot( direction );
		if ( dot > best_dot ) {
			best_dot = dot;
			best = i;
		}
	}

	support_point.copy( this.vertices[best] );
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.ConvexShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		ab = new Goblin.Vector3(),
		ac = new Goblin.Vector3(),
		q = new Goblin.Vector3(),
		s = new Goblin.Vector3(),
		r = new Goblin.Vector3(),
		b = new Goblin.Vector3(),
		u = new Goblin.Vector3(),
		tmin, tmax;

	return function( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		for ( var i = 0; i < this.faces.length; i++  ) {
			var face = this.faces[i];

			ab.subtractVectors( face.b.point, face.a.point );
			ac.subtractVectors( face.c.point, face.a.point );
			q.crossVectors( direction, ac );
			var a = ab.dot( q );

			if ( a < Goblin.EPSILON ) {
				// Ray does not point at face
				continue;
			}

			var f = 1 / a;
			s.subtractVectors( start, face.a.point );

			var u = f * s.dot( q );
			if ( u < 0 ) {
				// Ray does not intersect face
				continue;
			}

			r.crossVectors( s, ab );
			var v = f * direction.dot( r );
			if ( v < 0 || u + v > 1 ) {
				// Ray does not intersect face
				continue;
			}

			var t = f * ac.dot( r );
			if ( t < tmin || t > tmax ) {
				// ray segment does not intersect face
				continue;
			}

			// Segment intersects the face, find from `t`
			var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
			intersection.object = this;
			intersection.t = t;
			intersection.point.scaleVector( direction, t );
			intersection.point.add( start );
			intersection.normal.copy( face.normal );

			// A convex object can have only one intersection with a line, we're done
			return intersection;
		}

		// No intersection found
		return null;
	};
})();
/**
 * @class MeshShape
 * @param vertices {Array<Vector3>} vertices comprising the mesh
 * @param faces {Array<Number>} array of indices indicating which vertices compose a face; faces[0..2] represent the first face, faces[3..5] are the second, etc
 * @constructor
 */
Goblin.MeshShape = function( vertices, faces, material ) {
	this.vertices = vertices;

	this.triangles = [];
	for ( var i = 0; i < faces.length; i += 3 ) {
		this.triangles.push( new Goblin.TriangleShape( vertices[faces[i]], vertices[faces[i+1]], vertices[faces[i+2]] ) );
	}

	/**
	 * the convex mesh's volume
	 * @property volume
	 * @type {number}
	 */
	this.volume = 0;

	/**
	 * coordinates of the mesh's COM
	 * @property center_of_mass
	 * @type {vec3}
	 */
	this.center_of_mass = new Goblin.Vector3();

	/**
	 * used in computing the mesh's center of mass & volume
	 * @property _intergral
	 * @type {Float32Array}
	 * @private
	 */
	this._integral = new Float32Array( 10 );

	this.hierarchy = new Goblin.BVH( this.triangles ).tree;

	var polygon_faces = this.triangles.map(
		function( triangle ) {
			return new Goblin.GjkEpa.Face(
				null,
				{ point: triangle.a },
				{ point: triangle.b },
				{ point: triangle.c }
			);
		}
	);

	Goblin.ConvexShape.prototype.computeVolume.call( this, polygon_faces );

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );

	this.material = material || null;
};

/**
 * Returns a shallow clone of the mesh shape.
 *
 * @method clone
 */
Goblin.MeshShape.prototype.clone = function() {
	var clone = Object.create( Goblin.MeshShape.prototype );

	clone.vertices = this.vertices;
	clone.triangles = this.triangles;
	clone.volume = this.volume;
	clone.center_of_mass = this.center_of_mass;
	clone._integral = this._integral;
	clone.hierarchy = this.hierarchy;
	clone.aabb = this.aabb;
	clone.material = this.material;

	return clone;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.MeshShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = 0;
	aabb.max.x = aabb.max.y = aabb.max.z = 0;

	for ( var i = 0; i < this.vertices.length; i++ ) {
		aabb.min.x = Math.min( aabb.min.x, this.vertices[i].x );
		aabb.min.y = Math.min( aabb.min.y, this.vertices[i].y );
		aabb.min.z = Math.min( aabb.min.z, this.vertices[i].z );

		aabb.max.x = Math.max( aabb.max.x, this.vertices[i].x );
		aabb.max.y = Math.max( aabb.max.y, this.vertices[i].y );
		aabb.max.z = Math.max( aabb.max.z, this.vertices[i].z );
	}
};

Goblin.MeshShape.prototype.getInertiaTensor = function( mass ) {
	return Goblin.ConvexShape.prototype.getInertiaTensor.call( this, mass );
};

/**
 * noop
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.MeshShape.prototype.findSupportPoint = function( direction, support_point ) {
	return; // MeshShape isn't convex so it cannot be used directly in GJK
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.MeshShape.prototype.rayIntersect = (function(){
	var intersections = [],
		tSort = function( a, b ) {
			if ( a.t < b.t ) {
				return -1;
			} else if ( a.t > b.t ) {
				return 1;
			} else {
				return 0;
			}
		};

	return function( start, end ) {
		// empty meshes cannot be intersected
		if ( !this.hierarchy ) {
			return null;
		}

		// Traverse the BVH and return the closest point of contact, if any
		var nodes = [ this.hierarchy ],
			node;
		intersections.length = 0;

		var count = 0;
		while ( nodes.length > 0 ) {
			count++;
			node = nodes.shift();

			if ( node.aabb.testRayIntersect( start, end ) ) {
				// Ray intersects this node's AABB
				if ( node.isLeaf() ) {
					var intersection = node.object.rayIntersect( start, end );
					if ( intersection != null ) {
						intersections.push( intersection );
					}
				} else {
					nodes.push( node.left, node.right );
				}
			}
		}

		intersections.sort( tSort );
		return intersections[0] || null;
	};
})();
/**
 * @class PlaneShape
 * @param orientation {Number} index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
 * @param half_width {Number} half width of the plane
 * @param half_length {Number} half height of the plane
 * @constructor
 */
Goblin.PlaneShape = function( orientation, half_width, half_length ) {
	/**
	 * index of axis which is the plane's normal ( 0 = X, 1 = Y, 2 = Z )
	 * when 0, width is Y and length is Z
	 * when 1, width is X and length is Z
	 * when 2, width is X and length is Y
	 *
	 * @property half_width
	 * @type {Number}
	 */
	this.orientation = orientation;

	/**
	 * half width of the plane
	 *
	 * @property half_height
	 * @type {Number}
	 */
	this.half_width = half_width;

	/**
	 * half length of the plane
	 *
	 * @property half_length
	 * @type {Number}
	 */
	this.half_length = half_length;

    this.aabb = new Goblin.AABB();
    this.calculateLocalAABB( this.aabb );


	if ( this.orientation === 0 ) {
		this._half_width = 0;
		this._half_height = this.half_width;
		this._half_depth = this.half_length;
	} else if ( this.orientation === 1 ) {
		this._half_width = this.half_width;
		this._half_height = 0;
		this._half_depth = this.half_length;
	} else {
		this._half_width = this.half_width;
		this._half_height = this.half_length;
		this._half_depth = 0;
	}
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.PlaneShape.prototype.calculateLocalAABB = function( aabb ) {
    if ( this.orientation === 0 ) {
        this._half_width = 0;
        this._half_height = this.half_width;
        this._half_depth = this.half_length;

        aabb.min.x = 0;
        aabb.min.y = -this.half_width;
        aabb.min.z = -this.half_length;

        aabb.max.x = 0;
        aabb.max.y = this.half_width;
        aabb.max.z = this.half_length;
    } else if ( this.orientation === 1 ) {
        this._half_width = this.half_width;
        this._half_height = 0;
        this._half_depth = this.half_length;

        aabb.min.x = -this.half_width;
        aabb.min.y = 0;
        aabb.min.z = -this.half_length;

        aabb.max.x = this.half_width;
        aabb.max.y = 0;
        aabb.max.z = this.half_length;
    } else {
        this._half_width = this.half_width;
        this._half_height = this.half_length;
        this._half_depth = 0;

        aabb.min.x = -this.half_width;
        aabb.min.y = -this.half_length;
        aabb.min.z = 0;

        aabb.max.x = this.half_width;
        aabb.max.y = this.half_length;
        aabb.max.z = 0;
    }
};

Goblin.PlaneShape.prototype.getInertiaTensor = function( mass ) {
	var width_squared = this.half_width * this.half_width * 4,
		length_squared = this.half_length * this.half_length * 4,
		element = 0.0833 * mass,

		x = element * length_squared,
		y = element * ( width_squared + length_squared ),
		z = element * width_squared;

	if ( this.orientation === 0 ) {
		return new Goblin.Matrix3(
			y, 0, 0,
			0, x, 0,
			0, 0, z
		);
	} else if ( this.orientation === 1 ) {
		return new Goblin.Matrix3(
			x, 0, 0,
			0, y, 0,
			0, 0, z
		);
	} else {
		return new Goblin.Matrix3(
			y, 0, 0,
			0, z, 0,
			0, 0, x
		);
	}
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.PlaneShape.prototype.findSupportPoint = function( direction, support_point ) {
	/*
	 support_point = [
	 sign( direction.x ) * _half_width,
	 sign( direction.y ) * _half_height,
	 sign( direction.z ) * _half_depth
	 ]
	 */

	// Calculate the support point in the local frame
	if ( direction.x < 0 ) {
		support_point.x = -this._half_width;
	} else {
		support_point.x = this._half_width;
	}

	if ( direction.y < 0 ) {
		support_point.y = -this._half_height;
	} else {
		support_point.y = this._half_height;
	}

	if ( direction.z < 0 ) {
		support_point.z = -this._half_depth;
	} else {
		support_point.z = this._half_depth;
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.PlaneShape.prototype.rayIntersect = (function(){
	var normal = new Goblin.Vector3(),
		ab = new Goblin.Vector3(),
		point = new Goblin.Vector3(),
		t;

	return function( start, end ) {
		if ( this.orientation === 0 ) {
			normal.x = 1;
			normal.y = normal.z = 0;
		} else if ( this.orientation === 1 ) {
			normal.y = 1;
			normal.x = normal.z = 0;
		} else {
			normal.z = 1;
			normal.x = normal.y = 0;
		}

		ab.subtractVectors( end, start );
		t = -normal.dot( start ) / normal.dot( ab );

		if ( t < 0 || t > 1 ) {
			return null;
		}

		point.scaleVector( ab, t );
		point.add( start );

		if ( point.x < -this._half_width || point.x > this._half_width ) {
			return null;
		}

		if ( point.y < -this._half_height || point.y > this._half_height ) {
			return null;
		}

		if ( point.z < -this._half_depth || point.z > this._half_depth ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t * ab.length();
		intersection.point.copy( point );
		intersection.normal.copy( normal );

		return intersection;
	};
})();
/**
 * @class SphereShape
 * @param radius {Number} sphere radius
 * @constructor
 */
Goblin.SphereShape = function( radius, material ) {
	this.radius = radius;

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );

	this.material = material || null;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.SphereShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = aabb.min.y = aabb.min.z = -this.radius;
	aabb.max.x = aabb.max.y = aabb.max.z = this.radius;
};

Goblin.SphereShape.prototype.getInertiaTensor = function( mass ) {
	var element = 0.4 * mass * this.radius * this.radius;
	return new Goblin.Matrix3(
		element, 0, 0,
		0, element, 0,
		0, 0, element
	);
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in local coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.SphereShape.prototype.findSupportPoint = (function(){
	var temp = new Goblin.Vector3();
	return function( direction, support_point ) {
		temp.normalizeVector( direction );
		support_point.scaleVector( temp, this.radius );
	};
})();

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.SphereShape.prototype.rayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		length;

	return function( start, end ) {
		direction.subtractVectors( end, start );
		length = direction.length();
		direction.scale( 1 / length  ); // normalize direction

		var a = start.dot( direction ),
			b = start.dot( start ) - this.radius * this.radius;

		// if ray starts outside of sphere and points away, exit
		if ( a >= 0 && b >= 0 ) {
			return null;
		}

		var discr = a * a - b;

		// Check for ray miss
		if ( discr < 0 ) {
			return null;
		}

		// ray intersects, find closest intersection point
		var discr_sqrt = Math.sqrt( discr ),
			t = -a - discr_sqrt;
		if ( t < 0 ) {
			t = -a + discr_sqrt;
		}

		// verify the segment intersects
		if ( t > length ) {
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.point.scaleVector( direction, t );
		intersection.t = t;
		intersection.point.add( start );

        intersection.normal.normalizeVector( intersection.point );

		return intersection;
	};
})();
/**
 * @class TriangleShape
 * @param vertex_a {Vector3} first vertex
 * @param vertex_b {Vector3} second vertex
 * @param vertex_c {Vector3} third vertex
 * @constructor
 */
Goblin.TriangleShape = function( vertex_a, vertex_b, vertex_c ) {
	/**
	 * first vertex of the triangle
	 *
	 * @property a
	 * @type {Vector3}
	 */
	this.a = vertex_a;

	/**
	 * second vertex of the triangle
	 *
	 * @property b
	 * @type {Vector3}
	 */
	this.b = vertex_b;

	/**
	 * third vertex of the triangle
	 *
	 * @property c
	 * @type {Vector3}
	 */
	this.c = vertex_c;

	/**
	 * normal vector of the triangle
	 *
	 * @property normal
	 * @type {Goblin.Vector3}
	 */
	this.normal = new Goblin.Vector3();
	_tmp_vec3_1.subtractVectors( this.b, this.a );
	_tmp_vec3_2.subtractVectors( this.c, this.a );
	this.normal.crossVectors( _tmp_vec3_1, _tmp_vec3_2 );

	/**
	 * area of the triangle
	 *
	 * @property volume
	 * @type {Number}
	 */
	this.volume = this.normal.length() / 2;

	this.normal.normalize();

	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.TriangleShape.prototype.calculateLocalAABB = function( aabb ) {
	aabb.min.x = Math.min( this.a.x, this.b.x, this.c.x );
	aabb.min.y = Math.min( this.a.y, this.b.y, this.c.y );
	aabb.min.z = Math.min( this.a.z, this.b.z, this.c.z );

	aabb.max.x = Math.max( this.a.x, this.b.x, this.c.x );
	aabb.max.y = Math.max( this.a.y, this.b.y, this.c.y );
	aabb.max.z = Math.max( this.a.z, this.b.z, this.c.z );
};

Goblin.TriangleShape.prototype.getInertiaTensor = function( mass ) {
	// @TODO http://www.efunda.com/math/areas/triangle.cfm
	return new Goblin.Matrix3(
		0, 0, 0,
		0, 0, 0,
		0, 0, 0
	);
};

Goblin.TriangleShape.prototype.classifyVertex = function( vertex ) {
	var w = this.normal.dot( this.a );
	return this.normal.dot( vertex ) - w;
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.TriangleShape.prototype.findSupportPoint = function( direction, support_point ) {
	var dot, best_dot = -Infinity;

	dot = direction.dot( this.a );
	if ( dot > best_dot ) {
		support_point.copy( this.a );
		best_dot = dot;
	}

	dot = direction.dot( this.b );
	if ( dot > best_dot ) {
		support_point.copy( this.b );
		best_dot = dot;
	}

	dot = direction.dot( this.c );
	if ( dot > best_dot ) {
		support_point.copy( this.c );
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.TriangleShape.prototype.rayIntersect = (function(){
	var d1 = new Goblin.Vector3(),
		d2 = new Goblin.Vector3(),
		n = new Goblin.Vector3(),
		segment = new Goblin.Vector3(),
		b = new Goblin.Vector3(),
		u = new Goblin.Vector3();

	return function( start, end ) {
		d1.subtractVectors( this.b, this.a );
		d2.subtractVectors( this.c, this.a );
		n.crossVectors( d1, d2 );

		segment.subtractVectors( end, start );
		var det = -segment.dot( n );

		if ( det <= 0 ) {
			// Ray is parallel to triangle or triangle's normal points away from ray
			return null;
		}

		b.subtractVectors( start, this.a );

		var t = b.dot( n ) / det;
		if ( 0 > t || t > 1 ) {
			// Ray doesn't intersect the triangle's plane
			return null;
		}

		u.crossVectors( b, segment );
		var u1 = d2.dot( u ) / det,
			u2 = -d1.dot( u ) / det;

		if ( u1 + u2 > 1 || u1 < 0 || u2 < 0 ) {
			// segment does not intersect triangle
			return null;
		}

		var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
		intersection.object = this;
		intersection.t = t * segment.length();
		intersection.point.scaleVector( segment, t );
		intersection.point.add( start );
		intersection.normal.copy( this.normal );

		return intersection;
	};
})();
Goblin.CollisionUtils = {};

Goblin.CollisionUtils.canBodiesCollide = function( object_a, object_b ) {
    if ( object_a.world === null || object_b.world === null ) {
        return true;
    }

    var matrix = object_a.world.collision_matrix;

    if ( ( object_a._is_static || object_a._is_kinematic ) && ( object_b._is_static || object_b._is_kinematic ) ) {
        // static bodies should never collide
        return false;
    }

    if ( matrix[ object_a.layer ] && matrix[ object_a.layer ][ object_b.layer ] === false ) {
        return false;
    } else {
        return true;
    }
};

/**
 * Calculate the friction of two colliding objects
 *
 * @method combineFrictions
 * @param object_a {object} First object
 * @param object_b {object} Second object
 * @param shape_a {object} First shape
 * @param shape_b {object} Second shape
 */
Goblin.CollisionUtils.combineFrictions = function( object_a, object_b, shape_a, shape_b ) {
    if ( shape_a.material === null && shape_b.material === null ) {
        return ( object_a.friction + object_b.friction ) / 2;
    } else if ( shape_a.material === null ) {
        return this.combineValues( 0, shape_b.material.frictionCombine, object_a.friction || 0, shape_b.material.dynamicFriction );
    } else if ( shape_b.material === null ) {
        return this.combineValues( shape_a.material.frictionCombine, 0, shape_a.material.dynamicFriction, shape_b.friction || 0 );
    }

    return this.combineValues( shape_a.material.frictionCombine, shape_b.material.frictionCombine, shape_a.material.dynamicFriction, shape_b.material.dynamicFriction );
};

/**
 * Calculate the restriction of two colliding objects
 *
 * @method combineRestitutions
 * @param object_a {object} First object
 * @param object_b {object} Second object
 * @param shape_a {object} First shape
 * @param shape_b {object} Second shape
 */
Goblin.CollisionUtils.combineRestitutions = function( object_a, object_b, shape_a, shape_b ) {
    if ( shape_a.material === null && shape_b.material === null ) {
        return ( object_a.restitution + object_b.restitution ) / 2;
    } else if ( shape_a.material === null ) {
        return this.combineValues( 0, shape_b.material.bounceCombine, object_a.restitution || 0, shape_b.material.bounciness );
    } else if ( shape_b.material === null ) {
        return this.combineValues( shape_a.material.bounceCombine, 0, shape_a.material.bounciness, object_b.restitution || 0 );
    }

    return this.combineValues( shape_a.material.bounceCombine, shape_b.material.bounceCombine, shape_a.material.bounciness, shape_b.material.bounciness );
};

/**
 * Combine two friction/restriction values by combination mode.
 * Average = 0,
 * Multiply = 1,
 * Minimum = 2,
 * Maximum = 3
 *
 * @method combineValues
 * @param combine_a {Number} First combination mode
 * @param combine_b {Number} Second combination mode
 * @param value_a {Number} First value
 * @param value_b {Number} Second value
 */
Goblin.CollisionUtils.combineValues = function( combine_a, combine_b, value_a, value_b ) {
    switch ( Math.max( combine_a, combine_b ) ) {
        case 1:
            return value_a * value_b;
        case 2:
            return Math.min( value_a, value_b );
        case 3:
            return Math.max( value_a, value_b );
        default:
            return ( value_a + value_b ) / 2;
    }
};
/**
 * Provides methods useful for working with various types of geometries
 *
 * @class GeometryMethods
 * @static
 */
Goblin.GeometryMethods = {
	/**
	 * determines the location in a triangle closest to a given point
	 *
	 * @method findClosestPointInTriangle
	 * @param {vec3} p point
	 * @param {vec3} a first triangle vertex
	 * @param {vec3} b second triangle vertex
	 * @param {vec3} c third triangle vertex
	 * @param {vec3} out vector where the result will be stored
	 */
	findClosestPointInTriangle: (function() {
		var ab = new Goblin.Vector3(),
			ac = new Goblin.Vector3(),
			_vec = new Goblin.Vector3();

		return function( p, a, b, c, out ) {
			var v;

			// Check if P in vertex region outside A
			ab.subtractVectors( b, a );
			ac.subtractVectors( c, a );
			_vec.subtractVectors( p, a );
			var d1 = ab.dot( _vec ),
				d2 = ac.dot( _vec );
			if ( d1 <= 0 && d2 <= 0 ) {
				out.copy( a );
				return;
			}

			// Check if P in vertex region outside B
			_vec.subtractVectors( p, b );
			var d3 = ab.dot( _vec ),
				d4 = ac.dot( _vec );
			if ( d3 >= 0 && d4 <= d3 ) {
				out.copy( b );
				return;
			}

			// Check if P in edge region of AB
			var vc = d1*d4 - d3*d2;
			if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {
				v = d1 / ( d1 - d3 );
				out.set( a.x + ab.x * v, a.y + ab.y * v, a.z + ab.z * v );
				return;
			}

			// Check if P in vertex region outside C
			_vec.subtractVectors( p, c );
			var d5 = ab.dot( _vec ),
				d6 = ac.dot( _vec );
			if ( d6 >= 0 && d5 <= d6 ) {
				out.copy( c );
				return;
			}

			// Check if P in edge region of AC
			var vb = d5*d2 - d1*d6,
				w;
			if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {
				w = d2 / ( d2 - d6 );
				out.set( a.x + ac.x * w, a.y + ac.y * w, a.z + ac.z * w );
				return;
			}

			// Check if P in edge region of BC
			var va = d3*d6 - d5*d4;
			if ( va <= 0 && d4-d3 >= 0 && d5-d6 >= 0 ) {
				w = (d4 - d3) / ( (d4-d3) + (d5-d6) );
				out.set( b.x + ( c.x - b.x ) * w, b.y + ( c.y - b.y ) * w, b.z + ( c.z - b.z ) * w );
				return;
			}

			// P inside face region
			var recipDenom = ( va + vb + vc );
			v = vb / recipDenom;
			w = vc / recipDenom;

			// At this point `ab` and `ac` can be recycled and lose meaning to their nomenclature
			out.set( ab.x * v + a.x + ac.x * w, ab.y * v + a.y + ac.y * w, ab.z * v + a.z + ac.z * w );
		};
	})(),

	/**
	 * Finds the Barycentric coordinates of point `p` in the triangle `a`, `b`, `c`
	 *
	 * @method findBarycentricCoordinates
	 * @param p {vec3} point to calculate coordinates of
	 * @param a {vec3} first point in the triangle
	 * @param b {vec3} second point in the triangle
	 * @param c {vec3} third point in the triangle
	 * @param out {vec3} resulting Barycentric coordinates of point `p`
	 */
	findBarycentricCoordinates: function( p, a, b, c, out ) {

		var v0 = new Goblin.Vector3(),
			v1 = new Goblin.Vector3(),
			v2 = new Goblin.Vector3();

		v0.subtractVectors( b, a );
		v1.subtractVectors( c, a );
		v2.subtractVectors( p, a );

		var d00 = v0.dot( v0 ),
			d01 = v0.dot( v1 ),
			d11 = v1.dot( v1 ),
			d20 = v2.dot( v0 ),
			d21 = v2.dot( v1 ),
			denom = d00 * d11 - d01 * d01;

		out.y = ( d11 * d20 - d01 * d21 ) / denom;
		out.z = ( d00 * d21 - d01 * d20 ) / denom;
		out.x = 1 - out.y - out.z;
	},

	/**
	 * Calculates the distance from point `p` to line `ab`
	 * @param p {vec3} point to calculate distance to
	 * @param a {vec3} first point in line
	 * @param b [vec3] second point in line
	 * @returns {number}
	 */
	findSquaredDistanceFromSegment: (function(){
		var ab = new Goblin.Vector3(),
			ap = new Goblin.Vector3(),
			bp = new Goblin.Vector3();

		return function( p, a, b ) {
			ab.subtractVectors( a, b );
			ap.subtractVectors( a, p );
			bp.subtractVectors( b, p );

			var e = ap.dot( ab );
			if ( e <= 0 ) {
				return ap.dot( ap );
			}

			var f = ab.dot( ab );
			if ( e >= f ) {
				return bp.dot( bp );
			}

			return ap.dot( ap ) - e * e / f;
		};
	})(),

	findClosestPointsOnSegments: (function(){
		var d1 = new Goblin.Vector3(),
			d2 = new Goblin.Vector3(),
			r = new Goblin.Vector3(),
			clamp = function( x, min, max ) {
				return Math.min( Math.max( x, min ), max );
			};

		return function( aa, ab, ba, bb, p1, p2 ) {
			d1.subtractVectors( ab, aa );
			d2.subtractVectors( bb, ba );
			r.subtractVectors( aa, ba );

			var a = d1.dot( d1 ),
				e = d2.dot( d2 ),
				f = d2.dot( r );

			var s, t;

			if ( a <= Goblin.EPSILON && e <= Goblin.EPSILON ) {
				// Both segments are degenerate
				s = t = 0;
				p1.copy( aa );
				p2.copy( ba );
				_tmp_vec3_1.subtractVectors( p1, p2 );
				return _tmp_vec3_1.dot( _tmp_vec3_1 );
			}

			if ( a <= Goblin.EPSILON ) {
				// Only first segment is degenerate
				s = 0;
				t = f / e;
				t = clamp( t, 0, 1 );
			} else {
				var c = d1.dot( r );
				if ( e <= Goblin.EPSILON ) {
					// Second segment is degenerate
					t = 0;
					s = clamp( -c / a, 0, 1 );
				} else {
					// Neither segment is degenerate
					var b = d1.dot( d2 ),
						denom = a * e - b * b;

					if ( denom !== 0 ) {
						// Segments aren't parallel
						s = clamp( ( b * f - c * e ) / denom, 0, 1 );
					} else {
						s = 0;
					}

					// find point on segment2 closest to segment1(s)
					t = ( b * s + f ) / e;

					// validate t, if it needs clamping then clamp and recompute s
					if ( t < 0 ) {
						t = 0;
						s = clamp( -c / a, 0, 1 );
					} else if ( t > 1 ) {
						t = 1;
						s = clamp( ( b - c ) / a, 0, 1 );
					}
				}
			}

			p1.scaleVector( d1, s );
			p1.add( aa );

			p2.scaleVector( d2, t );
			p2.add( ba );

			_tmp_vec3_1.subtractVectors( p1, p2 );
			return _tmp_vec3_1.dot( _tmp_vec3_1 );
		};
	})()
};
(function(){
	Goblin.MinHeap = function( array ) {
		this.heap = array == null ? [] : array.slice();

		if ( this.heap.length > 0 ) {
			this.heapify();
		}
	};
	Goblin.MinHeap.prototype = {
		heapify: function() {
			var start = ~~( ( this.heap.length - 2 ) / 2 );
			while ( start >= 0 ) {
				this.siftUp( start, this.heap.length - 1 );
				start--;
			}
		},
		siftUp: function( start, end ) {
			var root = start;

			while ( root * 2 + 1 <= end ) {
				var child = root * 2 + 1;

				if ( child + 1 <= end && this.heap[child + 1].valueOf() < this.heap[child].valueOf() ) {
					child++;
				}

				if ( this.heap[child].valueOf() < this.heap[root].valueOf() ) {
					var tmp = this.heap[child];
					this.heap[child] = this.heap[root];
					this.heap[root] = tmp;
					root = child;
				} else {
					return;
				}
			}
		},
		push: function( item ) {
			this.heap.push( item );

			var root = this.heap.length - 1;
			while ( root !== 0 ) {
				var parent = ~~( ( root - 1 ) / 2 );

				if ( this.heap[parent].valueOf() > this.heap[root].valueOf() ) {
					var tmp = this.heap[parent];
					this.heap[parent] = this.heap[root];
					this.heap[root] = tmp;
				}

				root = parent;
			}
		},
		peek: function() {
			return this.heap.length > 0 ? this.heap[0] : null;
		},
		pop: function() {
			var entry = this.heap[0];
			this.heap[0] = this.heap[this.heap.length - 1];
			this.heap.length = this.heap.length - 1;
			this.siftUp( 0, this.heap.length - 1 );

			return entry;
		}
	};
})();
Goblin.Utility = {
	getUid: (function() {
		var uid = 0;
		return function() {
			return uid++;
		};
	})()
};
/**
 * Extends a given shape by sweeping a line around it
 *
 * @class LineSweptShape
 * @param start {Vector3} starting point of the line
 * @param end {Vector3} line's end point
 * @param shape any Goblin shape object
 * @constructor
 */
Goblin.LineSweptShape = function( start, end, shape ) {
	/**
	 * starting point of the line
	 *
	 * @property start
	 * @type {Vector3}
	 */
	this.start = start;

	/**
	 * line's end point
	 *
	 * @property end
	 * @type {Vector3}
	 */
	this.end = end;

	/**
	 * shape being swept
	 *
	 * @property shape
	 */
	this.shape = shape;

	/**
	 * unit direction of the line
	 *
	 * @property direction
	 * @type {Vector3}
	 */
	this.direction = new Goblin.Vector3();
	this.direction.subtractVectors( end, start );

	/**
	 * length of the line
	 *
	 * @property length
	 * @type {Number}
	 */
	this.length = this.direction.length();
	this.direction.normalize();

	/**
	 * axis-aligned bounding box of this shape
	 *
	 * @property aabb
	 * @type {AABB}
	 */
	this.aabb = new Goblin.AABB();
	this.calculateLocalAABB( this.aabb );

	this.material = null;
};

/**
 * Calculates this shape's local AABB and stores it in the passed AABB object
 *
 * @method calculateLocalAABB
 * @param aabb {AABB}
 */
Goblin.LineSweptShape.prototype.calculateLocalAABB = function( aabb ) {
	this.shape.calculateLocalAABB( aabb );

	aabb.min.x = Math.min( aabb.min.x + this.start.x, aabb.min.x + this.end.x );
	aabb.min.y = Math.min( aabb.min.y + this.start.y, aabb.min.y + this.end.y );
	aabb.min.z = Math.min( aabb.min.z + this.start.z, aabb.min.z + this.end.z );

	aabb.max.x = Math.max( aabb.max.x + this.start.x, aabb.max.x + this.end.x );
	aabb.max.y = Math.max( aabb.max.y + this.start.y, aabb.max.y + this.end.y );
	aabb.max.z = Math.max( aabb.max.z + this.start.z, aabb.max.z + this.end.z );
};

Goblin.LineSweptShape.prototype.getInertiaTensor = function( mass ) {
	// this is wrong, but currently not used for anything
	return this.shape.getInertiaTensor( mass );
};

/**
 * Given `direction`, find the point in this body which is the most extreme in that direction.
 * This support point is calculated in world coordinates and stored in the second parameter `support_point`
 *
 * @method findSupportPoint
 * @param direction {vec3} direction to use in finding the support point
 * @param support_point {vec3} vec3 variable which will contain the supporting point after calling this method
 */
Goblin.LineSweptShape.prototype.findSupportPoint = function( direction, support_point ) {
	this.shape.findSupportPoint( direction, support_point );

	// Add whichever point of this line lies in `direction`
	var dot = this.direction.dot( direction );

	if ( dot < 0 ) {
		support_point.add( this.start );
	} else {
		support_point.add( this.end );
	}
};

/**
 * Checks if a ray segment intersects with the shape
 *
 * @method rayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3} end point of the segment
 * @return {RayIntersection|null} if the segment intersects, a RayIntersection is returned, else `null`
 */
Goblin.LineSweptShape.prototype.rayIntersect = function(){
	return null;
};
/**
 * @class AABB
 * @param [min] {vec3}
 * @param [max] {vec3}
 * @constructor
 */
Goblin.AABB = function( min, max ) {
	/**
	 * @property min
	 * @type {vec3}
	 */
	this.min = min || new Goblin.Vector3();

	/**
	 * @property max
	 * @type {vec3}
	 */
	this.max = max || new Goblin.Vector3();
};

Goblin.AABB.prototype.copy = function( aabb ) {
	this.min.x = aabb.min.x;
	this.min.y = aabb.min.y;
	this.min.z = aabb.min.z;

	this.max.x = aabb.max.x;
	this.max.y = aabb.max.y;
	this.max.z = aabb.max.z;
};

Goblin.AABB.prototype.combineAABBs = function( a, b ) {
	this.min.x = Math.min( a.min.x, b.min.x );
	this.min.y = Math.min( a.min.y, b.min.y );
	this.min.z = Math.min( a.min.z, b.min.z );

	this.max.x = Math.max( a.max.x, b.max.x );
	this.max.y = Math.max( a.max.y, b.max.y );
	this.max.z = Math.max( a.max.z, b.max.z );
};

Goblin.AABB.prototype.transform = (function(){
	var local_center = new Goblin.Vector3(),
        center = new Goblin.Vector3();

    // the algorithm for AABB (min-max variant) is taken from
    // Graphics Gems, 1999 (example at https://github.com/erich666/GraphicsGems/blob/master/gems/TransBox.c)
	return function( local_aabb, matrix ) {
        local_center.set( 0, 0, 0 );
        matrix.transformVector3Into( local_center, center );

        var amin = [ local_aabb.min.x, local_aabb.min.y, local_aabb.min.z ];
        var amax = [ local_aabb.max.x, local_aabb.max.y, local_aabb.max.z ];

        var bmin = [ center.x, center.y, center.z ];
        var bmax = [ center.x, center.y, center.z ];

        var m = [ matrix.e00, matrix.e01, matrix.e02, matrix.e10, matrix.e11, matrix.e12, matrix.e20, matrix.e21, matrix.e22 ];

        for( var i = 0; i < 3; i++ ) {
            for( var j = 0; j < 3; j++ ) {
                var a = m[ i * 3 + j ] * amin[j];
                var b = m[ i * 3 + j ] * amax[j];

                if ( a < b ) { 
                    bmin[i] += a; 
                    bmax[i] += b;
                } else { 
                    bmin[i] += b; 
                    bmax[i] += a;
                }
            }
        }

        this.min.set( bmin[0], bmin[1], bmin[2] );
        this.max.set( bmax[0], bmax[1], bmax[2] );
    };
})();

Goblin.AABB.prototype.intersects = function( aabb ) {
    if (
        this.max.x < aabb.min.x ||
        this.max.y < aabb.min.y ||
        this.max.z < aabb.min.z ||
        this.min.x > aabb.max.x ||
        this.min.y > aabb.max.y ||
        this.min.z > aabb.max.z
    )
    {
        return false;
    }

    return true;
};

/**
 * Checks if a ray segment intersects with this AABB
 *
 * @method testRayIntersect
 * @property start {vec3} start point of the segment
 * @property end {vec3{ end point of the segment
 * @return {boolean}
 */
Goblin.AABB.prototype.testRayIntersect = (function(){
	var direction = new Goblin.Vector3(),
		tmin, tmax,
		ood, t1, t2;

	return function AABB_testRayIntersect( start, end ) {
		tmin = 0;

		direction.subtractVectors( end, start );
		tmax = direction.length();
		direction.scale( 1 / tmax ); // normalize direction

		var extent_min, extent_max;

        // Check X axis
        extent_min = this.min.x;
        extent_max = this.max.x;
        if ( Math.abs( direction.x ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.x < extent_min || start.x > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.x;
            t1 = ( extent_min - start.x ) * ood;
            t2 = ( extent_max - start.x ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Y axis
        extent_min = this.min.y;
        extent_max = this.max.y;
        if ( Math.abs( direction.y ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.y < extent_min || start.y > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.y;
            t1 = ( extent_min - start.y ) * ood;
            t2 = ( extent_max - start.y ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

        // Check Z axis
        extent_min = this.min.z;
        extent_max = this.max.z;
        if ( Math.abs( direction.z ) < Goblin.EPSILON ) {
            // Ray is parallel to axis
            if ( start.z < extent_min || start.z > extent_max ) {
                return false;
            }
        } else {
            ood = 1 / direction.z;
            t1 = ( extent_min - start.z ) * ood;
            t2 = ( extent_max - start.z ) * ood;
            if ( t1 > t2 ) {
                ood = t1; // ood is a convenient temp variable as it's not used again
                t1 = t2;
                t2 = ood;
            }

            // Find intersection intervals
            tmin = Math.max( tmin, t1 );
            tmax = Math.min( tmax, t2 );

            if ( tmin > tmax ) {
                return false;
            }
        }

		return true;
	};
})();
(function(){
	function getSurfaceArea( aabb ) {
		var x = aabb.max.x - aabb.min.x,
			y = aabb.max.y - aabb.min.y,
			z = aabb.max.z - aabb.min.z;
		return x * ( y + z ) + y * z;
	}

	/**
	 * Tree node for a BVH
	 *
	 * @class BVHNode
	 * @param [object] {Object} leaf object in the BVH tree
	 * @constructor
	 * @private
	 */
	var BVHNode = function( object ) {
		this.aabb = new Goblin.AABB();
		this.area = 0;

		this.parent = null;
		this.left = null;
		this.right = null;

		this.morton = null;

		this.object = object || null;
	};
	BVHNode.prototype = {
		isLeaf: function() {
			return this.object != null;
		},

		computeBounds: function( global_aabb ) {
			if ( this.isLeaf() ) {
				this.aabb.copy( this.object.aabb );
			} else {
				this.aabb.combineAABBs( this.left.aabb, this.right.aabb );
			}

			this.area = getSurfaceArea( this.aabb );
		},

		valueOf: function() {
			return this.area;
		}
	};

	/**
	 * Bottom-up BVH construction based on "Efficient BVH Construction via Approximate Agglomerative Clustering", Yan Gu 2013
	 *
	 * @Class AAC
	 * @static
	 * @private
	 */
	var AAC = (function(){
		function part1By2( n ) {
			n = ( n ^ ( n << 16 ) ) & 0xff0000ff;
			n = ( n ^ ( n << 8 ) ) & 0x0300f00f;
			n = ( n ^ ( n << 4 ) ) & 0x030c30c3;
			n = ( n ^ ( n << 2 ) ) & 0x09249249;
			return n;
		}
		function morton( x, y, z ) {
			return ( part1By2( z ) << 2 ) + ( part1By2( y ) << 1 ) + part1By2( x );
		}

		var _tmp_aabb = new Goblin.AABB();

		var AAC = function( global_aabb, leaves ) {
			var global_width = global_aabb.max.x - global_aabb.min.x,
				global_height = global_aabb.max.y - global_aabb.min.y,
				global_depth = global_aabb.max.z - global_aabb.min.z,
				max_value = 1 << 9,
				scale_x = max_value / global_width,
				scale_y = max_value / global_height,
				scale_z = max_value / global_depth;

			// Compute the morton code for each leaf
			for ( var i = 0; i < leaves.length; i++ ) {
				var leaf = leaves[i],
					// find center of aabb
					x = ( leaf.aabb.max.x - leaf.aabb.min.x ) / 2 + leaf.aabb.min.x,
					y = ( leaf.aabb.max.y - leaf.aabb.min.y ) / 2 + leaf.aabb.min.y,
					z = ( leaf.aabb.max.z - leaf.aabb.min.z ) / 2 + leaf.aabb.min.z;

				leaf.morton = morton(
					( x + global_aabb.min.x ) * scale_x,
					( y + global_aabb.min.y ) * scale_y,
					( z + global_aabb.min.z ) * scale_z
				);
			}

			// Sort leaves based on morton code
			leaves.sort( AAC.mortonSort );
			var tree = AAC.buildTree( leaves, 29 ); // @TODO smaller starting bit, log4N or log2N or log10N ?
			//var tree = AAC.buildTree( leaves, 20 ); // @TODO smaller starting bit, log4N or log2N or log10N ?
			AAC.combineCluster( tree, 1 );
			return tree;
		};
		AAC.mortonSort = function( a, b ) {
			if ( a.morton < b.morton ) {
				return -1;
			} else if ( a.morton > b.morton ) {
				return 1;
			} else {
				return 0;
			}
		};
		AAC.clusterReductionCount = function( cluster_size ) {
			var c = Math.pow( cluster_size, 0.5 ) / 2,
				a = 0.5;
			return Math.max( c * Math.pow( cluster_size, a ), 1 );
		};
		AAC.buildTree = function( nodes, bit ) {
			var cluster = [];

			if ( nodes.length < AAC.max_bucket_size ) {
				cluster.push.apply( cluster, nodes );
				AAC.combineCluster( cluster, AAC.clusterReductionCount( AAC.max_bucket_size ) );
			} else {
				var left = [],
					right = [];

				if ( bit < 1 ) {
					// no more bits, just cut bucket in half
					left = nodes.slice( 0, nodes.length / 2 );
					right = nodes.slice( nodes.length / 2 );
				} else {
					var bit_value = 1 << bit;
					for ( var i = 0; i < nodes.length; i++ ) {
						var node = nodes[i];
						if ( node.morton & bit_value ) {
							right.push( node );
						} else {
							left.push( node );
						}
					}
				}
				cluster.push.apply( cluster, AAC.buildTree( left, bit - 1 ) );
				cluster.push.apply( cluster, AAC.buildTree( right, bit - 1 ) );
				AAC.combineCluster( cluster, AAC.clusterReductionCount( cluster.length ) );
			}

			return cluster;
		};
		AAC.combineCluster = function( cluster, max_clusters ) {
			if ( cluster.length <= 1 ) {
				return cluster;
			}

			// find the best match for each object
			var merge_queue = new Goblin.MinHeap(),
				merged_node;
			for ( var i = 0; i < cluster.length; i++ ) {
				merged_node = new BVHNode();
				merged_node.left = cluster[i];
				merged_node.right = AAC.findBestMatch( cluster, cluster[i] );
				merged_node.computeBounds();
				merge_queue.push( merged_node );
			}

			var best_cluster;
			while( cluster.length > max_clusters ) {
				best_cluster = merge_queue.pop();
				cluster.splice( cluster.indexOf( best_cluster.left ), 1 );
				cluster.splice( cluster.indexOf( best_cluster.right ), 1 );
				cluster.push( best_cluster );

				// update the merge queue
				// @TODO don't clear the whole heap every time, only need to update any nodes which touched best_cluster.left / best_cluster.right
				merge_queue.heap.length = 0;
				for ( i = 0; i < cluster.length; i++ ) {
					merged_node = new BVHNode();
					merged_node.left = cluster[i];
					merged_node.right = AAC.findBestMatch( cluster, cluster[i] );
					merged_node.computeBounds();
					merge_queue.push( merged_node );
				}
			}
		};
		AAC.findBestMatch = function( cluster, object ) {
			var area,
				best_area = Infinity,
				best_idx = 0;
			for ( var i = 0; i < cluster.length; i++ ) {
				if ( cluster[i] === object ) {
					continue;
				}
				_tmp_aabb.combineAABBs( object.aabb, cluster[i].aabb );
				area = getSurfaceArea( _tmp_aabb );

				if ( area < best_area ) {
					best_area = area;
					best_idx = i;
				}
			}

			return cluster[best_idx];
		};
		AAC.max_bucket_size = 20;
		return AAC;
	})();

	/**
	 * Creates a bounding volume hierarchy around a group of objects which have AABBs
	 *
	 * @class BVH
	 * @param bounded_objects {Array} group of objects to be hierarchized
	 * @constructor
	 */
	Goblin.BVH = function( bounded_objects ) {
		// Create a node for each object
		var leaves = [],
			global_aabb = new Goblin.AABB();

		for ( var i = 0; i < bounded_objects.length; i++ ) {
			global_aabb.combineAABBs( global_aabb, bounded_objects[i].aabb );
			var leaf = new BVHNode( bounded_objects[i] );
			leaf.computeBounds();
			leaves.push( leaf );
		}

		this.tree = AAC( global_aabb, leaves )[0];
	};

	Goblin.BVH.AAC = AAC;
})();
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

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.ContactDetails );

Goblin.ContactDetails.prototype.destroy = function() {
	this.emit( 'destroy' );
	Goblin.ObjectPool.freeObject( 'ContactDetails', this );
};
/**
 * Structure which holds information about the contact points between two objects
 *
 * @Class ContactManifold
 * @constructor
 */
Goblin.ContactManifold = function() {
	/**
	 * unique id of the manifold
	 *
	 * @property uid
	 * @type {String}
	 */
	this.uid = "";

	/**
	 * first body in the contact
	 *
	 * @property object_a
	 * @type {RigidBody}
	 */
	this.object_a = null;

	/**
	 * second body in the contact
	 *
	 * @property object_b
	 * @type {RigidBody}
	 */
	this.object_b = null;

	/**
	 * array of the active contact points for this manifold
	 *
	 * @property points
	 * @type {Array}
	 */
	this.points = [];

	/**
	 * reference to the next `ContactManifold` in the list
	 *
	 * @property next_manifold
	 * @type {ContactManifold}
	 */
	this.next_manifold = null;
};	

/**
 * Determines which cached contact should be replaced with the new contact
 *
 * @method findWeakestContact
 * @param {ContactDetails} new_contact
 */
Goblin.ContactManifold.prototype.findWeakestContact = function( new_contact ) {
	// Find which of the current contacts has the deepest penetration
	var max_penetration_index = -1,
		max_penetration = new_contact.penetration_depth,
		i,
		contact;
	for ( i = 0; i < 4; i++ ) {
		contact = this.points[i];
		if ( contact.penetration_depth > max_penetration ) {
			max_penetration = contact.penetration_depth;
			max_penetration_index = i;
		}
	}

	// Estimate contact areas
	var res0 = 0,
		res1 = 0,
		res2 = 0,
		res3 = 0;
	if ( max_penetration_index !== 0 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res0 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 1 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[2].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res1 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 2 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[3].contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res2 = _tmp_vec3_1.lengthSquared();
	}
	if ( max_penetration_index !== 3 ) {
		_tmp_vec3_1.subtractVectors( new_contact.contact_point_in_a, this.points[0].contact_point_in_a );
		_tmp_vec3_2.subtractVectors( this.points[2].contact_point_in_a, this.points[1].contact_point_in_a );
		_tmp_vec3_1.cross( _tmp_vec3_2 );
		res3 = _tmp_vec3_1.lengthSquared();
	}

	var max_index = 0,
		max_val = res0;
	if ( res1 > max_val ) {
		max_index = 1;
		max_val = res1;
	}
	if ( res2 > max_val ) {
		max_index = 2;
		max_val = res2;
	}
	if ( res3 > max_val ) {
		max_index = 3;
	}

	return max_index;
};

/**
 * Adds a contact point to the manifold
 *
 * @param {Goblin.ContactDetails} contact
 */
Goblin.ContactManifold.prototype.addContact = function( contact ) {
	//@TODO add feature-ids to detect duplicate contacts
	var i;
	for ( i = 0; i < this.points.length; i++ ) {
		if ( this.points[i].contact_point.distanceTo( contact.contact_point ) <= 0.02 ) {
			contact.destroy();
			return;
		}
	}

	var use_contact = false;
	if ( contact != null ) {
		use_contact = contact.object_a.emit( 'speculativeContact', contact.object_b, contact );
		if ( use_contact !== false ) {
			use_contact = contact.object_b.emit( 'speculativeContact', contact.object_a, contact );
		}

		if ( use_contact === false ) {
			contact.destroy();
			return;
		} else {
			contact.object_a.emit( 'contact', contact.object_b, contact );
			contact.object_b.emit( 'contact', contact.object_a, contact );

			contact.object_a_version = contact.object_a.version;
			contact.object_b_version = contact.object_b.version;
		}
	}

	// Add contact if we don't have enough points yet
	if ( this.points.length < 4 ) {
		this.points.push( contact );
	} else {
		var replace_index = this.findWeakestContact( contact );
		this.points[replace_index].destroy();
		this.points[replace_index] = contact;
	}
};

/**
 * Updates all of this manifold's ContactDetails with the correct contact location & penetration depth
 *
 * @method update
 */
Goblin.ContactManifold.prototype.update = function() {
	// Update positions / depths of contacts
	var i,
		j,
		point,
		penetrationThreshold = 0.2,
		object_a_world_coords = new Goblin.Vector3(),
		object_b_world_coords = new Goblin.Vector3(),
		vector_difference = new Goblin.Vector3(),
		starting_points_length = this.points.length;

	for ( i = 0; i < this.points.length; i++ ) {
		point = this.points[i];

		// Convert the local contact points into world coordinates
		point.object_a.transform.transformVector3Into( point.contact_point_in_a, object_a_world_coords );
		point.object_b.transform.transformVector3Into( point.contact_point_in_b, object_b_world_coords );

		// Find new world contact point
		point.contact_point.addVectors( object_a_world_coords, object_b_world_coords );
		point.contact_point.scale( 0.5  );

		// Find the new penetration depth
		vector_difference.subtractVectors( object_a_world_coords, object_b_world_coords );
		point.penetration_depth = vector_difference.dot( point.contact_normal );

		if ( ( point.object_a_version !== point.object_a.version ) || ( point.object_b_version !== point.object_b.version ) ) {
			point.penetration_depth = -Infinity;
		}

		// If distance from contact is too great remove this contact point
		if ( point.penetration_depth < -penetrationThreshold ) {
			// Points are too far away along the contact normal
			point.destroy();
			this.points[ i ] = this.points[ this.points.length - 1 ];
			this.points.length = this.points.length - 1;
			// this.object_a.emit( 'endContact', this.object_b );
			// this.object_b.emit( 'endContact', this.object_a );
		} else {
			// Check if points are too far away orthogonally
			_tmp_vec3_1.scaleVector( point.contact_normal, point.penetration_depth );
			_tmp_vec3_1.subtractVectors( object_a_world_coords, _tmp_vec3_1 );

			_tmp_vec3_1.subtractVectors( object_b_world_coords, _tmp_vec3_1 );
			var distance = _tmp_vec3_1.length();
			if ( distance > penetrationThreshold ) {
				// Points are indeed too far away
				point.destroy();
				this.points[ i ] = this.points[ this.points.length - 1 ];
				this.points.length = this.points.length - 1;
				// this.object_a.emit( 'endContact', this.object_b );
				// this.object_b.emit( 'endContact', this.object_a );
			}
		}
	}

	if (starting_points_length > 0 && this.points.length === 0) {
		// this update removed all contact points
		// this.object_a.emit( 'endAllContact', this.object_b );
		// this.object_b.emit( 'endAllContact', this.object_a );
	}
};
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
Goblin.GhostBody = function( shape ) {
    Goblin.RigidBody.call( this, shape, Infinity );

    this.contacts = [];
    this.tick_contacts = [];

    this.addListener( 'speculativeContact', Goblin.GhostBody.prototype.onSpeculativeContact );
};

Goblin.GhostBody.prototype = Object.create( Goblin.RigidBody.prototype );

Goblin.GhostBody.prototype.onSpeculativeContact = function( object_b, contact ) {
    this.tick_contacts.push( object_b );
    if ( this.contacts.indexOf( object_b ) === -1 ) {
        this.contacts.push( object_b );
        this.emit( 'contactStart', object_b, contact );
        object_b.emit( 'contactStart', this, contact );
    } else {
        this.emit( 'contactContinue', object_b, contact );
        object_b.emit( 'contactContinue', this, contact );
    }

    return false;
};

Goblin.GhostBody.prototype.checkForEndedContacts = function() {
    for ( var i = 0; i < this.contacts.length; i++ ) {
        if ( this.tick_contacts.indexOf( this.contacts[i] ) === -1 ) {
            this.emit( 'contactEnd', this.contacts[i] );
            this.contacts.splice( i, 1 );
            i -= 1;
        }
    }
    this.tick_contacts.length = 0;
};
/**
 * Adapted from BulletPhysics's btIterativeSolver
 *
 * @class IterativeSolver
 * @constructor
 */
Goblin.IterativeSolver = function() {
	this.existing_contact_ids = {};

	/**
	 * Holds contact constraints generated from contact manifolds
	 *
	 * @property contact_constraints
	 * @type {Array}
	 */
	this.contact_constraints = [];

	/**
	 * Holds friction constraints generated from contact manifolds
	 *
	 * @property friction_constraints
	 * @type {Array}
	 */
	this.friction_constraints = [];

	/**
	 * array of all constraints being solved
	 *
	 * @property all_constraints
	 * @type {Array}
	 */
	this.all_constraints = [];

	/**
	 * array of constraints on the system, excluding contact & friction
	 *
	 * @property constraints
	 * @type {Array}
	 */
	this.constraints = [];

	/**
	 * maximum solver iterations per time step
	 *
	 * @property max_iterations
	 * @type {number}
	 */
	this.max_iterations = 10;

	/**
	 * maximum solver iterations per time step to resolve contacts
	 *
	 * @property penetrations_max_iterations
	 * @type {number}
	 */
	this.penetrations_max_iterations = 5;

	/**
	 * used to relax the contact position solver, 0 is no position correction and 1 is full correction
	 *
	 * @property relaxation
	 * @type {number}
	 * @default 0.9
	 */
	this.relaxation = 0.9;

	/**
	 * weighting used in the Gauss-Seidel successive over-relaxation solver
	 *
	 * @property sor_weight
	 * @type {number}
	 */
	this.sor_weight = 0.85;

	/**
	 * how much of the solution to start with on the next solver pass
	 *
	 * @property warmstarting_factor
	 * @type {number}
	 */
	this.warmstarting_factor = 0.95;

	/**
	 * The absolute value of jacobian determinant (row.D) under which the row is considered inactive.
	 *
	 * @property warmstarting_factor
	 * @type {number}
	 */
	this.min_row_response = 1e-5;


	var solver = this;
	/**
	 * used to remove contact constraints from the system when their contacts are destroyed
	 *
	 * @method onContactDeactivate
	 * @private
	 */
	this.onContactDeactivate = function() {
		this.removeListener( 'deactivate', solver.onContactDeactivate );

		var idx = solver.contact_constraints.indexOf( this );
		solver.contact_constraints.splice( idx, 1 );

		delete solver.existing_contact_ids[ this.contact.uid ];
	};
	/**
	 * used to remove friction constraints from the system when their contacts are destroyed
	 *
	 * @method onFrictionDeactivate
	 * @private
	 */
	this.onFrictionDeactivate = function() {
		this.removeListener( 'deactivate', solver.onFrictionDeactivate );

		var idx = solver.friction_constraints.indexOf( this );
		solver.friction_constraints.splice( idx, 1 );
	};
};

/**
 * adds a constraint to the solver
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.IterativeSolver.prototype.addConstraint = function( constraint ) {
	if ( this.constraints.indexOf( constraint ) === -1 ) {
		this.constraints.push( constraint );
	}
};

/**
 * removes a constraint from the solver
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.IterativeSolver.prototype.removeConstraint = function( constraint ) {
	var idx = this.constraints.indexOf( constraint );
	if ( idx !== -1 ) {
		this.constraints.splice( idx, 1 );
	}
};

/**
 * Converts contact manifolds into contact constraints
 *
 * @method processContactManifolds
 * @param contact_manifolds {Array} contact manifolds to process
 */
Goblin.IterativeSolver.prototype.processContactManifolds = function( contact_manifolds ) {
	var i, j,
		manifold,
		contacts_length,
		contact,
		constraint;

	manifold = contact_manifolds.first;

	while( manifold ) {
		contacts_length = manifold.points.length;

		for ( i = 0; i < contacts_length; i++ ) {
			contact = manifold.points[i];

			var existing_constraint = this.existing_contact_ids.hasOwnProperty( contact.uid );

			if ( !existing_constraint ) {
				this.existing_contact_ids[contact.uid] = true;

				// Build contact constraint
				constraint = Goblin.ObjectPool.getObject( 'ContactConstraint' );
				constraint.buildFromContact( contact );
				this.contact_constraints.push( constraint );
				constraint.addListener( 'deactivate', this.onContactDeactivate );

				// Build friction constraint
				constraint = Goblin.ObjectPool.getObject( 'FrictionConstraint' );
				constraint.buildFromContact( contact );
				this.friction_constraints.push( constraint );
				constraint.addListener( 'deactivate', this.onFrictionDeactivate );
			}
		}

		manifold = manifold.next_manifold;
	}

	// @TODO just for now
	this.all_constraints.length = 0;
	Array.prototype.push.apply( this.all_constraints, this.friction_constraints );
	Array.prototype.push.apply( this.all_constraints, this.constraints );
	Array.prototype.push.apply( this.all_constraints, this.contact_constraints );
};

Goblin.IterativeSolver.prototype.prepareConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		constraint,
		row,
		i, j;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}

		constraint.update( time_delta );
		for ( j = 0; j < constraint.rows.length; j++ ) {
			row = constraint.rows[j];
			row.multiplier = 0;
			row.computeB( constraint ); // Objects' inverted mass & inertia tensors & Jacobian
			row.computeD();
			row.computeEta( constraint, time_delta ); // Amount of work needed for the constraint
		}
	}
};

Goblin.IterativeSolver.prototype.resolveContacts = function() {
	var iteration,
		constraint,
		jdot, row, i,
		delta_lambda,
		aabb,
		max_impulse = 0,
		invmass;

	var jacobian, linear_factor, angular_factor, push_velocity, turn_velocity, b, multiplier, am, m, relaxation = this.relaxation;

	// Solve penetrations
	for ( iteration = 0; iteration < this.penetrations_max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < this.contact_constraints.length; i++ ) {
			constraint = this.contact_constraints[i];
			
			row = constraint.rows[0];
			jacobian = row.jacobian;
			b = row.B;

			jdot = 0;
			if ( constraint.object_a_is_dynamic() ) {
				linear_factor = constraint.object_a.linear_factor;
				angular_factor = constraint.object_a.angular_factor;
				push_velocity = constraint.object_a.push_velocity;
				turn_velocity = constraint.object_a.turn_velocity;

				jdot += (
					jacobian[0] * linear_factor.x  * push_velocity.x +
					jacobian[1] * linear_factor.y  * push_velocity.y +
					jacobian[2] * linear_factor.z  * push_velocity.z +
					jacobian[3] * angular_factor.x * turn_velocity.x +
					jacobian[4] * angular_factor.y * turn_velocity.y +
					jacobian[5] * angular_factor.z * turn_velocity.z
				);
			}
			if ( constraint.object_b_is_dynamic() ) {
				linear_factor = constraint.object_b.linear_factor;
				angular_factor = constraint.object_b.angular_factor;
				push_velocity = constraint.object_b.push_velocity;
				turn_velocity = constraint.object_b.turn_velocity;

				jdot += (
					jacobian[6]  * linear_factor.x  * push_velocity.x +
					jacobian[7]  * linear_factor.y  * push_velocity.y +
					jacobian[8]  * linear_factor.z  * push_velocity.z +
					jacobian[9]  * angular_factor.x * turn_velocity.x +
					jacobian[10] * angular_factor.y * turn_velocity.y +
					jacobian[11] * angular_factor.z * turn_velocity.z
				);
			}

			delta_lambda = ( constraint.contact.penetration_depth - jdot ) / row.D || 0;
			var cache = row.multiplier;
			row.multiplier = Math.max(
				row.lower_limit,
				Math.min(
					cache + delta_lambda,
					row.upper_limit
				)
			);
			delta_lambda = row.multiplier - cache;
			max_impulse = Math.max( max_impulse, delta_lambda );

			if ( constraint.object_a_is_dynamic() ) {
				push_velocity = constraint.object_a.push_velocity;
				turn_velocity = constraint.object_a.turn_velocity;

				push_velocity.x += delta_lambda * b[0];
				push_velocity.y += delta_lambda * b[1];
				push_velocity.z += delta_lambda * b[2];

				turn_velocity.x += delta_lambda * b[3];
				turn_velocity.y += delta_lambda * b[4];
				turn_velocity.z += delta_lambda * b[5];
			}
			if ( constraint.object_b_is_dynamic() ) {
				push_velocity = constraint.object_b.push_velocity;
				turn_velocity = constraint.object_b.turn_velocity;

				push_velocity.x += delta_lambda * b[6];
				push_velocity.y += delta_lambda * b[7];
				push_velocity.z += delta_lambda * b[8];

				turn_velocity.x += delta_lambda * b[9];
				turn_velocity.y += delta_lambda * b[10];
				turn_velocity.z += delta_lambda * b[11];
			}
		}

		if ( max_impulse >= -Goblin.EPSILON && max_impulse <= Goblin.EPSILON ) {
			break;
		}
	}

	// Apply position/rotation solver
	for ( i = 0; i < this.contact_constraints.length; i++ ) {
		constraint = this.contact_constraints[i];
		row = constraint.rows[0];

		jacobian = row.jacobian;
		multiplier = row.multiplier;

		if ( constraint.object_a_is_dynamic() ) {
			linear_factor = constraint.object_b.linear_factor;
			angular_factor = constraint.object_b.angular_factor;

			am = multiplier * relaxation;
			m = constraint.object_a._mass_inverted * multiplier * relaxation;

			constraint.object_a.position.x += m * jacobian[0] * linear_factor.x;
			constraint.object_a.position.y += m * jacobian[1] * linear_factor.y;
			constraint.object_a.position.z += m * jacobian[2] * linear_factor.z;

			_tmp_vec3_1.x = am * jacobian[3] * angular_factor.x;
			_tmp_vec3_1.y = am * jacobian[4] * angular_factor.y;
			_tmp_vec3_1.z = am * jacobian[5] * angular_factor.z;

			constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
			constraint.object_a.integrateRotation( 1.0, _tmp_vec3_1 );
		}

		if ( constraint.object_b_is_dynamic() ) {
			linear_factor = constraint.object_b.linear_factor;
			angular_factor = constraint.object_b.angular_factor;

			am = multiplier * relaxation;
			m = constraint.object_b._mass_inverted * multiplier * relaxation;

			constraint.object_b.position.x += m * jacobian[6] * linear_factor.x;
			constraint.object_b.position.y += m * jacobian[7] * linear_factor.y;
			constraint.object_b.position.z += m * jacobian[8] * linear_factor.z;

			_tmp_vec3_1.x = am * jacobian[9]  * angular_factor.x;
			_tmp_vec3_1.y = am * jacobian[10] * angular_factor.y;
			_tmp_vec3_1.z = am * jacobian[11] * angular_factor.z;

			constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
			constraint.object_b.integrateRotation( 1.0, _tmp_vec3_1 );
		}

		row.multiplier = 0;
	}
};

Goblin.IterativeSolver.prototype.solveConstraints = function() {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		warmth,
		i, j;

	var iteration,
		delta_lambda,
		max_impulse = 0, // Track the largest impulse per iteration; if the impulse is <= EPSILON then early out
		jdot;

	var solver_impulse, b, linear_factor, angular_factor, jacobian;

	// Warm starting
	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}

		for ( j = 0; j < constraint.rows.length; j++ ) {
			row = constraint.rows[j];
			warmth = row.multiplier_cached * this.warmstarting_factor;
			row.multiplier = warmth;

			b = row.B;

			if ( Math.abs( row.D ) < this.min_row_response ) {
				continue;
			}

			if ( constraint.object_a_is_dynamic() ) {
				solver_impulse = constraint.object_a.solver_impulse;

				solver_impulse[0] += warmth * b[0];
				solver_impulse[1] += warmth * b[1];
				solver_impulse[2] += warmth * b[2];

				solver_impulse[3] += warmth * b[3];
				solver_impulse[4] += warmth * b[4];
				solver_impulse[5] += warmth * b[5];
			}
			if ( constraint.object_b_is_dynamic() ) {
				solver_impulse = constraint.object_b.solver_impulse;

				solver_impulse[0] += warmth * b[6];
				solver_impulse[1] += warmth * b[7];
				solver_impulse[2] += warmth * b[8];

				solver_impulse[3] += warmth * b[9];
				solver_impulse[4] += warmth * b[10];
				solver_impulse[5] += warmth * b[11];
			}
		}
	}

	for ( iteration = 0; iteration < this.max_iterations; iteration++ ) {
		max_impulse = 0;
		for ( i = 0; i < num_constraints; i++ ) {
			constraint = this.all_constraints[i];
			if ( constraint.active === false ) {
				continue;
			}
			num_rows = constraint.rows.length;

			for ( j = 0; j < num_rows; j++ ) {
				row = constraint.rows[j];

				if ( Math.abs( row.D ) < this.min_row_response ) {
					continue;
				}

				jdot = 0;
				
				jacobian = row.jacobian;
				b = row.B;

				if ( constraint.object_a_is_dynamic() ) {
					linear_factor = constraint.object_a.linear_factor;
					angular_factor = constraint.object_a.angular_factor;
					solver_impulse = constraint.object_a.solver_impulse;

					jdot += (
						jacobian[0] * linear_factor.x  * solver_impulse[0] +
						jacobian[1] * linear_factor.y  * solver_impulse[1] +
						jacobian[2] * linear_factor.z  * solver_impulse[2] +
						jacobian[3] * angular_factor.x * solver_impulse[3] +
						jacobian[4] * angular_factor.y * solver_impulse[4] +
						jacobian[5] * angular_factor.z * solver_impulse[5]
					);
				}
				if ( constraint.object_b_is_dynamic() ) {
					linear_factor = constraint.object_b.linear_factor;
					angular_factor = constraint.object_b.angular_factor;
					solver_impulse = constraint.object_b.solver_impulse;

					jdot += (
						jacobian[6]  * linear_factor.x  * solver_impulse[0] +
						jacobian[7]  * linear_factor.y  * solver_impulse[1] +
						jacobian[8]  * linear_factor.z  * solver_impulse[2] +
						jacobian[9]  * angular_factor.x * solver_impulse[3] +
						jacobian[10] * angular_factor.y * solver_impulse[4] +
						jacobian[11] * angular_factor.z * solver_impulse[5]
					);
				}

				delta_lambda = ( ( row.eta - jdot ) / row.D || 0) * constraint.factor;
				var cache = row.multiplier,
					multiplier_target = cache + delta_lambda;

				// successive over-relaxation
				multiplier_target = this.sor_weight * multiplier_target + ( 1 - this.sor_weight ) * cache;

				// Clamp to row constraints
				row.multiplier = Math.max(
					row.lower_limit,
					Math.min(
						multiplier_target,
						row.upper_limit
					)
				);

				// Find final `delta_lambda`
				delta_lambda = row.multiplier - cache;

				var total_mass = ( constraint.object_a_is_dynamic() ? constraint.object_a._mass : 0 ) +
					( constraint.object_b_is_dynamic() ? constraint.object_b._mass : 0 );
				max_impulse = Math.max( max_impulse, Math.abs( delta_lambda ) / total_mass );

				if ( constraint.object_a_is_dynamic() ) {
					solver_impulse = constraint.object_a.solver_impulse;

					solver_impulse[0] += delta_lambda * b[0];
					solver_impulse[1] += delta_lambda * b[1];
					solver_impulse[2] += delta_lambda * b[2];

					solver_impulse[3] += delta_lambda * b[3];
					solver_impulse[4] += delta_lambda * b[4];
					solver_impulse[5] += delta_lambda * b[5];
				}
				if ( constraint.object_b_is_dynamic() ) {
					solver_impulse = constraint.object_b.solver_impulse;

					solver_impulse[0] += delta_lambda * b[6];
					solver_impulse[1] += delta_lambda * b[7];
					solver_impulse[2] += delta_lambda * b[8];

					solver_impulse[3] += delta_lambda * b[9];
					solver_impulse[4] += delta_lambda * b[10];
					solver_impulse[5] += delta_lambda * b[11];
				}
			}
		}

		if ( max_impulse <= 0.1 ) {
			break;
		}
	}
};

Goblin.IterativeSolver.prototype.applyConstraints = function( time_delta ) {
	var num_constraints = this.all_constraints.length,
		constraint,
		num_rows,
		row,
		i, j;

	var jacobian, m, am, linear_factor, angular_factor;

	for ( i = 0; i < num_constraints; i++ ) {
		constraint = this.all_constraints[i];
		if ( constraint.active === false ) {
			continue;
		}
		num_rows = constraint.rows.length;

		constraint.last_impulse.x = constraint.last_impulse.y = constraint.last_impulse.z = 0;

		for ( j = 0; j < num_rows; j++ ) {
			row = constraint.rows[j];

			row.multiplier_cached = row.multiplier;
			jacobian = row.jacobian;

			if ( Math.abs( row.D ) < this.min_row_response ) {
				continue;
			}

			if ( constraint.object_a_is_dynamic() ) {
				m = constraint.object_a._mass_inverted * time_delta * row.multiplier;
				am = time_delta * row.multiplier;
				linear_factor = constraint.object_a.linear_factor;
				angular_factor = constraint.object_a.angular_factor;

				_tmp_vec3_2.x = m * jacobian[0] * linear_factor.x;
				_tmp_vec3_2.y = m * jacobian[1] * linear_factor.y;
				_tmp_vec3_2.z = m * jacobian[2] * linear_factor.z;
				constraint.object_a.linear_velocity.add( _tmp_vec3_2 );
				constraint.last_impulse.add( _tmp_vec3_2 );

				_tmp_vec3_1.x = am * jacobian[3] * angular_factor.x;
				_tmp_vec3_1.y = am * jacobian[4] * angular_factor.y;
				_tmp_vec3_1.z = am * jacobian[5] * angular_factor.z;
				constraint.object_a.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
				constraint.object_a.angular_velocity.add( _tmp_vec3_1 );
				constraint.last_impulse.add( _tmp_vec3_1 );
			}

			if ( constraint.object_b_is_dynamic() ) {
				m = constraint.object_b._mass_inverted * time_delta * row.multiplier;
				am = time_delta * row.multiplier;
				linear_factor = constraint.object_b.linear_factor;
				angular_factor = constraint.object_b.angular_factor;

				_tmp_vec3_2.x = m * jacobian[6] * linear_factor.x;
				_tmp_vec3_2.y = m * jacobian[7] * linear_factor.y;
				_tmp_vec3_2.z = m * jacobian[8] * linear_factor.z;
				constraint.object_b.linear_velocity.add(_tmp_vec3_2 );
				constraint.last_impulse.add( _tmp_vec3_2 );

				_tmp_vec3_1.x = am * jacobian[9]  * angular_factor.x;
				_tmp_vec3_1.y = am * jacobian[10] * angular_factor.y;
				_tmp_vec3_1.z = am * jacobian[11] * angular_factor.z;
				constraint.object_b.inverseInertiaTensorWorldFrame.transformVector3( _tmp_vec3_1 );
				constraint.object_b.angular_velocity.add( _tmp_vec3_1 );
				constraint.last_impulse.add( _tmp_vec3_1 );
			}
		}

		if ( constraint.breaking_threshold > 0 ) {
			if ( constraint.last_impulse.lengthSquared() >= constraint.breaking_threshold * constraint.breaking_threshold ) {
				constraint.active = false;
			}
		}
	}
};
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

	if ( object_a.shape instanceof Goblin.CompoundShape ) {
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
		child_shape = compound.shape.child_shapes[i];
		proxy.setFrom( compound, child_shape );

		if ( proxy.shape instanceof Goblin.CompoundShape || other.shape instanceof Goblin.CompoundShape ) {
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

				contact.restitution = Goblin.CollisionUtils.combineRestitutions( contact.object_a, contact.object_b, contact.shape_a, contact.shape_b );
				contact.friction = Goblin.CollisionUtils.combineFrictions( contact.object_a, contact.object_b, contact.shape_a, contact.shape_b );

				this.addContact( parent_a, parent_b, contact );
			}
		}

		result_contact = result_contact || contact;
	}

	Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );

	return result_contact;
};

Goblin.NarrowPhase.prototype.meshCollision = (function(){
	var b_to_a = new Goblin.Matrix4(),
		tri_b = new Goblin.TriangleShape( new Goblin.Vector3(), new Goblin.Vector3(), new Goblin.Vector3() ),
		b_aabb = new Goblin.AABB(),
		b_right_aabb = new Goblin.AABB(),
		b_left_aabb = new Goblin.AABB();

	function meshMesh( object_a, object_b, addContact ) {
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

				contact = Goblin.TriangleTriangle( a_node.object, tri_b );
                if ( contact != null ) {
					object_a.transform.rotateVector3( contact.contact_normal );
                    object_a.transform.transformVector3( contact.contact_point );

                    object_a.transform.transformVector3( contact.contact_point_in_b );
                    object_b.transform_inverse.transformVector3( contact.contact_point_in_b );

					contact.shape_a = shape_a;
					contact.shape_b = shape_b;

                    contact.object_a = object_a;
                    contact.object_b = object_b;

					contact.restitution = Goblin.CollisionUtils.combineRestitutions( object_a, object_b, contact.shape_a, contact.shape_b );
					contact.friction = Goblin.CollisionUtils.combineFrictions( object_a, object_b, contact.shape_a, contact.shape_b );

                    addContact( object_a, object_b, contact );
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

	function triangleConvex( triangle, mesh, convex ) {
		// Create proxy to convert convex into mesh's space
		var proxy = Goblin.ObjectPool.getObject( 'RigidBodyProxy' );

		var child_shape = new Goblin.CompoundShapeChild( triangle, new Goblin.Vector3(), new Goblin.Quaternion() );
		proxy.setFrom( mesh, child_shape );

		var simplex = Goblin.GjkEpa.GJK( proxy, convex ),
			contact;
		if ( Goblin.GjkEpa.result != null ) {
			contact = Goblin.GjkEpa.result;
		} else if ( simplex != null ) {
			contact = Goblin.GjkEpa.EPA( simplex );
		}

		Goblin.ObjectPool.freeObject( 'RigidBodyProxy', proxy );

		return contact;
	}

	var meshConvex = (function(){
		var convex_to_mesh = new Goblin.Matrix4(),
			convex_aabb_in_mesh = new Goblin.AABB();

		return function meshConvex( mesh, convex, addContact ) {
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
						contact = triangleConvex( node.object, mesh, convex );
						if ( contact != null ) {
							contact.shape_a = mesh.shape;
							contact.shape_b = convex.shape;

							contact.restitution = Goblin.CollisionUtils.combineRestitutions( contact.object_a, contact.object_b, mesh.shape, convex.shape );
							contact.friction = Goblin.CollisionUtils.combineFrictions( contact.object_a, contact.object_b, mesh.shape, convex.shape );

							addContact( contact.object_a, contact.object_b, contact );
						}

						result_contact = result_contact || contact;
					} else {
						pending_nodes.push( node.left, node.right );
					}
				}
			}

			return result_contact;
		};
	})();

	return function meshCollision( object_a, object_b ) {
		var a_is_mesh = object_a.shape instanceof Goblin.MeshShape,
			b_is_mesh = object_b.shape instanceof Goblin.MeshShape;

		if ( a_is_mesh && b_is_mesh ) {
			return meshMesh( object_a, object_b, this.addContact.bind( this ) );
		} else {
			if ( a_is_mesh ) {
				return meshConvex( object_a, object_b, this.addContact.bind( this ) );
			} else {
				return meshConvex( object_b, object_a, this.addContact.bind( this ) );
			}
		}
	};
})();

/**
 * Tests two objects for contact
 *
 * @method getContact
 * @param {RigidBody} object_a
 * @param {RigidBody} object_b
 */
Goblin.NarrowPhase.prototype.getContact = function( object_a, object_b ) {
	if ( object_a.shape instanceof Goblin.CompoundShape || object_b.shape instanceof Goblin.CompoundShape ) {
		return this.midPhase( object_a, object_b );
	}

	if ( object_a.shape instanceof Goblin.MeshShape || object_b.shape instanceof Goblin.MeshShape ) {
		return this.meshCollision( object_a, object_b );
	}

	var contact;

	if ( object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.SphereShape ) {
		// Sphere - Sphere contact check
		contact = Goblin.SphereSphere( object_a, object_b );
	} else if (
		object_a.shape instanceof Goblin.SphereShape && object_b.shape instanceof Goblin.BoxShape ||
		object_a.shape instanceof Goblin.BoxShape && object_b.shape instanceof Goblin.SphereShape
	) {
		// Sphere - Box contact check
		contact = Goblin.BoxSphere( object_a, object_b );
	} else {
		// contact check based on GJK
		var simplex = Goblin.GjkEpa.GJK( object_a, object_b );
		if ( Goblin.GjkEpa.result != null ) {
			contact = Goblin.GjkEpa.result;
		} else if ( simplex != null ) {
			contact = Goblin.GjkEpa.EPA( simplex );
		}
	}

	// store original shapes that collided on the objects
	// so that it's possible to deduce which actuall colliders
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
		contact = this.getContact( possible_contacts[i][0], possible_contacts[i][1] );

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
				manifold.points[i].destroy();
			}
			manifold.points.length = 0;
		}

		manifold = manifold.next;
	}
};
/**
 * Manages pools for various types of objects, provides methods for creating and freeing pooled objects
 *
 * @class ObjectPool
 * @static
 */
Goblin.ObjectPool = {
	/**
	 * key/value map of registered types
	 *
	 * @property types
	 * @private
	 */
	types: {},

	/**
	 * key/pool map of object type - to - object pool
	 *
	 * @property pools
	 * @private
	 */
	pools: {},

	/**
	 * registers a type of object to be available in pools
	 *
	 * @param key {String} key associated with the object to register
	 * @param constructing_function {Function} function which will return a new object
	 */
	registerType: function( key, constructing_function ) {
		this.types[ key ] = constructing_function;
		this.pools[ key ] = [];
	},

	/**
	 * retrieve a free object from the specified pool, or creates a new object if one is not available
	 *
	 * @param key {String} key of the object type to retrieve
	 * @return {Mixed} object of the type asked for, when done release it with `ObjectPool.freeObject`
	 */
	getObject: function( key ) {
		var pool = this.pools[ key ];

		if ( pool.length !== 0 ) {
			var result = pool.pop();
			
			result.tag = null;

			return result;
		} else {
			return this.types[ key ]();
		}
	},

	/**
	 * adds on object to the object pool so it can be reused
	 *
	 * @param key {String} type of the object being freed, matching the key given to `registerType`
	 * @param object {Mixed} object to release into the pool
	 */
	freeObject: function( key, object ) {
		if ( object.removeAllListeners != null ) {
			object.removeAllListeners();
		}

		this.pools[ key ].push( object );
	}
};

// register the objects used in Goblin
Goblin.ObjectPool.registerType( 'ContactDetails', function() { return new Goblin.ContactDetails(); } );
Goblin.ObjectPool.registerType( 'ContactManifold', function() { return new Goblin.ContactManifold(); } );
Goblin.ObjectPool.registerType( 'GJK2SupportPoint', function() { return new Goblin.GjkEpa.SupportPoint( new Goblin.Vector3(), new Goblin.Vector3(), new Goblin.Vector3() ); } );
Goblin.ObjectPool.registerType( 'ConstraintRow', function() { return new Goblin.ConstraintRow(); } );
Goblin.ObjectPool.registerType( 'ContactConstraint', function() { return new Goblin.ContactConstraint(); } );
Goblin.ObjectPool.registerType( 'FrictionConstraint', function() { return new Goblin.FrictionConstraint(); } );
Goblin.ObjectPool.registerType( 'RayIntersection', function() { return new Goblin.RayIntersection(); } );
Goblin.ObjectPool.registerType( 'RigidBodyProxy', function() { return new Goblin.RigidBodyProxy(); } );
/**
 * Manages the physics simulation
 *
 * @class PhysicMaterial
 * @constructor
 */
Goblin.PhysicMaterial = function( attributes ) {

    this.bounciness = attributes.bounciness;

    this.dynamicFriction = attributes.dynamicFriction;

    this.staticFriction = attributes.staticFriction;

    /**
     * Friction combine type
     * Average = 0,
     * Multiply = 1,
     * Minimum = 2,
     * Maximum = 3
     *
     * @property frictionCombine
     * @type {number}
     */
    this.frictionCombine = attributes.frictionCombine;

    /**
     * Bounce combine type
     * Average = 0,
     * Multiply = 1,
     * Minimum = 2,
     * Maximum = 3
     *
     * @property bounceCombine
     * @type {number}
     */
    this.bounceCombine = attributes.bounceCombine;
};
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
};

Goblin.RigidBodyProxy.prototype.findSupportPoint = Goblin.RigidBody.prototype.findSupportPoint;

Goblin.RigidBodyProxy.prototype.getRigidBody = function() {
	var body = this.parent;
	while ( body.parent ) {
		body = this.parent;
	}
	return body;
};
/**
 * Manages the physics simulation
 *
 * @class World
 * @param broadphase {Goblin.Broadphase} the broadphase used by the world to find possible contacts
 * @param narrowphase {Goblin.NarrowPhase} the narrowphase used by the world to generate valid contacts
 * @constructor
 */
Goblin.World = function( broadphase, narrowphase, solver ) {
	/**
	 * How many time steps have been simulated. If the steps are always the same length then total simulation time = world.ticks * time_step
	 *
	 * @property ticks
	 * @type {number}
	 */
	this.ticks = 0;

	/**
	 * The broadphase used by the world to find possible contacts
	 *
	 * @property broadphase
	 * @type {Goblin.Broadphase}
	 */
	this.broadphase = broadphase;

	/**
	 * The narrowphase used by the world to generate valid contacts
	 *
	 * @property narrowphasee
	 * @type {Goblin.NarrowPhase}
	 */
	this.narrowphase = narrowphase;

	/**
	 * The contact solver used by the world to calculate and apply impulses resulting from contacts
	 *
	 * @property solver
	 */
	this.solver = solver;
	solver.world = this;

	/**
	 * Array of rigid bodies in the world
	 *
	 * @property rigid_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.rigid_bodies = [];

	/**
	 * Array of ghost bodies in the world
	 *
	 * @property ghost_bodies
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.ghost_bodies = [];

	/**
	* the world's gravity, applied by default to all objects in the world
	*
	* @property gravity
	* @type {vec3}
	* @default [ 0, -9.8, 0 ]
	*/
	this.gravity = new Goblin.Vector3( 0, -9.8, 0 );

	/**
	 * array of force generators in the world
	 *
	 * @property force_generators
	 * @type {Array}
	 * @default []
	 * @private
	 */
	this.force_generators = [];

	/**
	 * An object containing the flags allowing / disallowing the objects to collide.
	 * If the entry is absent from the object, it's considered to be allowed.
	 *
	 * @property collision_matrix
	 * @type {object}
	 * @default {}
	 * @private
	 */
	this.collision_matrix = {};

	this.listeners = {};
};
Goblin.EventEmitter.apply( Goblin.World );

/**
* Steps the physics simulation according to the time delta
*
* @method step
* @param time_delta {Number} amount of time to simulate, in seconds
* @param [max_step] {Number} maximum time step size, in seconds
*/
Goblin.World.prototype.step = function( time_delta, max_step ) {
    max_step = max_step || time_delta;

	var x, delta, time_loops, i, loop_count, body;

    time_loops = time_delta / max_step;
    for ( x = 0; x < time_loops; x++ ) {
		this.ticks++;
		
        delta = Math.min( max_step, time_delta );
        time_delta -= max_step;

		this.emit( 'stepStart', this.ticks, delta );

		//var bodies = this.broadphase.getDynamicBodies();
		var bodies = this.broadphase.getDynamicBodies();

		// Apply gravity
        for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
            body = bodies[ i ];

            // kinematic bodies aren't affected by gravity or forces
            if ( body._is_kinematic ) {
            	continue;
            }

            // Objects of infinite mass don't move
            if ( ( body._mass !== Infinity ) && body.use_gravity ) {
				_tmp_vec3_1.scaleVector( body.gravity || this.gravity, body._mass * delta );
                body.accumulated_force.add( _tmp_vec3_1 );
            }

            if ( body._mass !== Infinity ) {
				_tmp_vec3_1.scaleVector( body.linear_acceleration, body._mass * delta );
                body.accumulated_force.add( _tmp_vec3_1 );

                _tmp_vec3_1.scaleVector( body.angular_acceleration, body._mass * delta );
                body.accumulated_torque.add( _tmp_vec3_1 );
            }
        }

        // Apply force generators
        for ( i = 0, loop_count = this.force_generators.length; i < loop_count; i++ ) {
            this.force_generators[ i ].applyForce();
        }

		for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
			bodies[ i ].updateDerived();
		}

		this.drawDebug();

        // Check for contacts, broadphase
        this.broadphase.update();

        // Find valid contacts, narrowphase
        this.narrowphase.generateContacts( this.broadphase.collision_pairs );

        // Process contact manifolds into contact and friction constraints
        this.solver.processContactManifolds( this.narrowphase.contact_manifolds );

        // Prepare the constraints by precomputing some values
        this.solver.prepareConstraints( delta );

        // Resolve contacts
        this.solver.resolveContacts();

        // Run the constraint solver
        this.solver.solveConstraints();

        // Apply the constraints
        this.solver.applyConstraints( delta );

		// Uppdate ghost bodies
		for ( i = 0; i < this.ghost_bodies.length; i++ ) {
			body = this.ghost_bodies[i];
			body.checkForEndedContacts();
		}

		// Integrate rigid bodies
		for ( i = 0, loop_count = bodies.length; i < loop_count; i++ ) {
			body = bodies[ i ];
			body.integrate( delta );
		}

		this.emit( 'stepEnd', this.ticks, delta );
    }
};

/**
 * Draws AABBs of objects and colliders when enabled for the world.
 *
 * @method drawDebug
 */
Goblin.World.prototype.drawDebug = function() {
	if ( !this.debug ) {
		return;
	}

	var i, j, body, aabb, shapes, shape;

	for ( i = 0; i < this.rigid_bodies.length; i++ ) {
		body = this.rigid_bodies[ i ];

		if ( body.debug ) {
			aabb = body.aabb;

			pc.Application.getApplication().renderWireCube( 
				new pc.Mat4().setTRS( 
					new pc.Vec3( aabb.min.x + aabb.max.x, aabb.min.y + aabb.max.y, aabb.min.z + aabb.max.z ).scale( 0.5 ), 
					pc.Quat.IDENTITY, 
					new pc.Vec3( aabb.min.x - aabb.max.x, aabb.min.y - aabb.max.y, aabb.min.z - aabb.max.z ).scale( -1 ) 
				), 

				new pc.Color( 1, 0, 0, 1 ),

				pc.LINEBATCH_OVERLAY
			);
		}

		shapes = body.shape.child_shapes || [];

		for ( j = 0; j < shapes.length; j++ ) {
			shape = shapes[ j ].shape;

			if ( shape.debug ) {
				aabb = new Goblin.AABB();
				aabb.transform( shapes[ j ].aabb, body.transform );

				pc.Application.getApplication().renderWireCube( 
					new pc.Mat4().setTRS( 
						new pc.Vec3( aabb.min.x + aabb.max.x, aabb.min.y + aabb.max.y, aabb.min.z + aabb.max.z ).scale( 0.5 ), 
						pc.Quat.IDENTITY, 
						new pc.Vec3( aabb.min.x - aabb.max.x, aabb.min.y - aabb.max.y, aabb.min.z - aabb.max.z ).scale( -1 ) 
					), 

					new pc.Color( 0, 1, 0, 1 ),

					pc.LINEBATCH_OVERLAY
				);
			}
		}
	}
};

/**
 * Adds a rigid body to the world
 *
 * @method addRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to add to the world
 */
Goblin.World.prototype.addRigidBody = function( rigid_body ) {
	rigid_body.world = this;
	rigid_body.updateDerived();
	this.rigid_bodies.push( rigid_body );
	this.broadphase.addBody( rigid_body );
};

/**
 * Removes a rigid body from the world
 *
 * @method removeRigidBody
 * @param rigid_body {Goblin.RigidBody} rigid body to remove from the world
 */
Goblin.World.prototype.removeRigidBody = function( rigid_body ) {
	var i;

	for ( i = 0; i < this.rigid_bodies.length; i++ ) {
		if ( this.rigid_bodies[i] === rigid_body ) {
			this.rigid_bodies.splice( i, 1 );
			this.broadphase.removeBody( rigid_body );
			break;
		}
	}

	// remove any contact & friction constraints associated with this body
	// this calls contact.destroy() for all relevant contacts
	// which in turn cleans up the iterative solver
	this.narrowphase.removeBody( rigid_body );
};

/**
 * Updates body's collision layer
 *
 * @method updateObjectLayer
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param new_layer  {Number} New layer that is about to be set
 */
Goblin.World.prototype.updateObjectLayer = function ( rigid_body, new_layer ) {
	this.broadphase.updateObjectLayer( rigid_body, new_layer );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectStaticFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_static  {Boolean} Whether the object is marked as static
 */
Goblin.World.prototype.updateObjectStaticFlag = function ( rigid_body, is_static ) {
	this.broadphase.updateObjectStaticFlag( rigid_body, is_static );
};

/**
 * Updates body's static flag
 *
 * @method updateObjectKinematicFlag
 * @param rigid_body {Goblin.RigidBody} Rigid body to update
 * @param is_kinematic  {Boolean} Whether the object is marked as static
 */
Goblin.World.prototype.updateObjectKinematicFlag = function ( rigid_body, is_kinematic ) {
	this.broadphase.updateObjectKinematicFlag( rigid_body, is_kinematic );
};

/**
 * Adds a ghost body to the world
 *
 * @method addGhostBody
 * @param ghost_body {Goblin.GhostBody} ghost body to add to the world
 */
Goblin.World.prototype.addGhostBody = function( ghost_body ) {
	ghost_body.world = this;
	ghost_body.updateDerived();
	this.ghost_bodies.push( ghost_body );
	this.broadphase.addBody( ghost_body );
};

/**
 * Removes a ghost body from the world
 *
 * @method removeGhostBody
 * @param ghost_body {Goblin.GhostBody} ghost body to remove from the world
 */
Goblin.World.prototype.removeGhostBody = function( ghost_body ) {
	for ( var i = 0; i < this.ghost_bodies.length; i++ ) {
		if ( this.ghost_bodies[i] === ghost_body ) {
			this.ghost_bodies.splice( i, 1 );
			this.broadphase.removeBody( ghost_body );
			break;
		}
	}
};

/**
 * Adds a force generator to the world
 *
 * @method addForceGenerator
 * @param force_generator {Goblin.ForceGenerator} force generator object to be added
 */
Goblin.World.prototype.addForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	// Make sure this generator isn't already in the world
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			return;
		}
	}

	this.force_generators.push( force_generator );
};

/**
 * removes a force generator from the world
 *
 * @method removeForceGenerator
 * @param force_generatorv {Goblin.ForceGenerator} force generator object to be removed
 */
Goblin.World.prototype.removeForceGenerator = function( force_generator ) {
	var i, force_generators_count;
	for ( i = 0, force_generators_count = this.force_generators.length; i < force_generators_count; i++ ) {
		if ( this.force_generators[i] === force_generator ) {
			this.force_generators.splice( i, 1 );
			return;
		}
	}
};

/**
 * adds a constraint to the world
 *
 * @method addConstraint
 * @param constraint {Goblin.Constraint} constraint to be added
 */
Goblin.World.prototype.addConstraint = function( constraint ) {
	this.solver.addConstraint( constraint );
};

/**
 * removes a constraint from the world
 *
 * @method removeConstraint
 * @param constraint {Goblin.Constraint} constraint to be removed
 */
Goblin.World.prototype.removeConstraint = function( constraint ) {
	this.solver.removeConstraint( constraint );
};

(function(){
	var tSort = function( a, b ) {
		if ( a.t < b.t ) {
			return -1;
		} else if ( a.t > b.t ) {
			return 1;
		} else {
			return 0;
		}
	};

	/**
	 * Checks if a ray segment intersects with objects in the world
	 *
	 * @param {Goblin.Vector3} 			start 		Start of the ray
	 * @param {Goblin.Vector3} 			end 		End of the ray
	 * @param {Number} 					limit 		Maximum amount of objects to return
	 * @param {Number} 					layer_mask 	Layer mask to use
	 * @return {Array<RayIntersection>} 			Array of intersections, sorted by distance from `start`
	 */
	Goblin.World.prototype.rayIntersect = function( start, end, limit, layer_mask ) {
		// we cannot afford to bail out early from broadphase as we need to get closest intersections
		var intersections = this.broadphase.rayIntersect( start, end, 0, layer_mask );
		intersections.sort( tSort );
		return intersections.slice( 0, limit );
	};

	Goblin.World.prototype.shapeIntersect = function( center, shape ) {
		var body = new Goblin.RigidBody( shape, 0 );

		body.position.copy( center );
		body.updateDerived();

		var possibilities = this.broadphase.intersectsWith( body ),
			intersections = [];

		for ( var i = 0; i < possibilities.length; i++ ) {
			var contact = this.narrowphase.getContact( body, possibilities[i] );

			if ( contact != null ) {
				var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );

				// check which (A or B) object & shape are actually an intersection
				intersection.object = contact.object_b;
				intersection.shape = contact.shape_b;

				intersections.push( intersection );
			}
		}

		return intersections;
	};

	/**
	 * Checks if a line-swept shape intersects with objects in the world. Please note
	 * that passing a limit different from 0 will not guarantee any order of the hit - 
	 * i.e. asking for a single hit might return a more remote hit.
	 *
	 * @param {Goblin.Shape} 			shape 		Shape to sweep
	 * @param {Goblin.Vector3} 			start 		Start of the ray
	 * @param {Goblin.Vector3} 			end 		End of the ray
	 * @param {Number} 					limit 		Maximum amount of objects to return
	 * @param {Number} 					layer_mask 	Layer mask to use
	 * @return {Array<RayIntersection>} 			Array of intersections, sorted by distance from `start`
	 */
	Goblin.World.prototype.shapeIntersect = function( shape, start, end, limit, layer_mask ){
		var swept_shape = new Goblin.LineSweptShape( start, end, shape ),
			swept_body = new Goblin.RigidBody( swept_shape, 0 );

		swept_body.updateDerived();

		var possibilities = this.broadphase.intersectsWith( swept_body, layer_mask );
		var intersections = [];

		for ( var i = 0; i < possibilities.length; i++ ) {
			var contact = this.narrowphase.getContact( swept_body, possibilities[i] );

			if ( contact != null ) {
				var intersection = Goblin.ObjectPool.getObject( 'RayIntersection' );
				intersection.normal.copy( contact.contact_normal );

				// compute point
				intersection.point.scaleVector( contact.contact_normal, -contact.penetration_depth );
				intersection.point.add( contact.contact_point );

				// compute time
				intersection.t = intersection.point.distanceTo( start );

				intersection.object = contact.object_b;
				intersection.shape = contact.shape_b;

				intersections.push( intersection );
			}

			if ( limit <= intersections.length ) {
				break;
			}
		}

		intersections.sort( tSort );
		
		return intersections;
	};
})();
	if ( typeof window !== 'undefined' ) window.Goblin = Goblin;
	if ( typeof self !== 'undefined' ) self.Goblin = Goblin;
	if ( typeof module !== 'undefined' ) module.exports = Goblin;
})();