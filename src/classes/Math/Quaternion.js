Goblin.Quaternion = (function() {
	var prototype = pc.Quat.prototype;
	prototype.multiply = prototype.mul;
	prototype.multiplyQuaternions = prototype.mul2;
	prototype.transformVector3Into = prototype.transformVector;
	
	prototype.transformVector3 = function( v ) {
		return this.transformVector( v, v );
	};
	prototype.setInitial = function( x, y, z, w ) {
		this.x = x != null ? x : 0;
		this.y = y != null ? y : 0;
		this.z = z != null ? z : 0;
		this.w = w != null ? w : 1;
		this.normalize();
	};
	prototype.normalize = function() {
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
	};
	prototype.invertQuaternion = function( q ) {
		return this.copy(q).invert();
	};

	return pc.Quat;
}());