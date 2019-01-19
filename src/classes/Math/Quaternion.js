Goblin.Quaternion = function( x, y, z, w ) {
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.z = z != null ? z : 0;
	this.w = w != null ? w : 1;
	this.normalize();
};

Goblin.Quaternion.IDENTITY = new Goblin.Quaternion();

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