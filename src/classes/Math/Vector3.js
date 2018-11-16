Goblin.Vector3 = (function() {
	var prototype = pc.Vec3.prototype;

	prototype.addVectors      = prototype.add2;
	prototype.subtract        = prototype.sub;
	prototype.subtractVectors = prototype.sub2;
	prototype.multiply        = prototype.mul;
	prototype.multiplyVectors = prototype.mul2;
	prototype.lengthSquared   = prototype.lengthSq;
	prototype.scaleVector     = prototype.scale2;
	prototype.normalizeVector = prototype.normalize2;
	prototype.crossVectors    = prototype.cross;
	prototype.distanceTo      = prototype.distance;

	prototype.findOrthogonal  = function( o1, o2 ) {
		var d = this.data,
			d1 = o1.data,
			d2 = o2.data,
			a, k;

		if ( Math.abs( d[2] ) > 0.7071067811865476 ) {
			// choose p in y-z plane
			a = -d[1] * d[1] + d[2] * d[2];
			k = 1 / Math.sqrt( a );
			o1.set( 0, -d[2] * k, d[1] * k );
			// set q = n x p
			o2.set( a * k, -d[0] * d1[2], d[0] * d1[1] );
		} else {
			// choose p in x-y plane
			a = d[0] * d[0] + d[1] * d[1];
			k = 1 / Math.sqrt( a );
			o1.set( -d[1] * k, d[0] * k, 0 );
			// set q = n x p
			o2.set( -d[2] * d1[1], d[2] * d1[0], a * k );
		}
	};

	return pc.Vec3;
}());