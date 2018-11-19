Goblin.Matrix4 = (function() {

	prototype.identity = prototype.setIdentity;
	prototype.transformVector3Into = prototype.transformVector;
	prototype.multiply = prototype.mul;

	prototype.setInitial = function() {
		var m = this.data;
        m[0] = 0;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;

        m[4] = 0;
        m[5] = 0;
        m[6] = 0;
        m[7] = 0;

        m[8] = 0;
        m[9] = 0;
        m[10] = 0;
        m[11] = 0;

        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 0;
	};

	Object.defineProperty(prototype, 'e00', {
		get: function() {
			return this.data[0];
		},
		set: function(v) {
			this.data[0] = v;
		}
	});
	Object.defineProperty(prototype, 'e01', {
		get: function() {
			return this.data[1];
		},
		set: function(v) {
			this.data[1] = v;
		}
	});
	Object.defineProperty(prototype, 'e02', {
		get: function() {
			return this.data[2];
		},
		set: function(v) {
			this.data[2] = v;
		}
	});
	Object.defineProperty(prototype, 'e10', {
		get: function() {
			return this.data[3];
		},
		set: function(v) {
			this.data[3] = v;
		}
	});
	Object.defineProperty(prototype, 'e11', {
		get: function() {
			return this.data[4];
		},
		set: function(v) {
			this.data[4] = v;
		}
	});
	Object.defineProperty(prototype, 'e12', {
		get: function() {
			return this.data[5];
		},
		set: function(v) {
			this.data[5] = v;
		}
	});
	Object.defineProperty(prototype, 'e20', {
		get: function() {
			return this.data[6];
		},
		set: function(v) {
			this.data[6] = v;
		}
	});
	Object.defineProperty(prototype, 'e21', {
		get: function() {
			return this.data[7];
		},
		set: function(v) {
			this.data[7] = v;
		}
	});
	Object.defineProperty(prototype, 'e22', {
		get: function() {
			return this.data[8];
		},
		set: function(v) {
			this.data[8] = v;
		}
	});

	return pc.Mat4;
}());
