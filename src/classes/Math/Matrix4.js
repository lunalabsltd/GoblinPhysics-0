Goblin.Matrix4 = (function() {
	var prototype = pc.Mat4.prototype;
	prototype.identity = prototype.setIdentity;
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
	Object.defineProperty(prototype, 'e03', {
		get: function() {
			return this.data[3];
		},
		set: function(v) {
			this.data[3] = v;
		}
	});
	Object.defineProperty(prototype, 'e10', {
		get: function() {
			return this.data[4];
		},
		set: function(v) {
			this.data[4] = v;
		}
	});
	Object.defineProperty(prototype, 'e11', {
		get: function() {
			return this.data[5];
		},
		set: function(v) {
			this.data[5] = v;
		}
	});
	Object.defineProperty(prototype, 'e12', {
		get: function() {
			return this.data[6];
		},
		set: function(v) {
			this.data[6] = v;
		}
	});
	Object.defineProperty(prototype, 'e13', {
		get: function() {
			return this.data[7];
		},
		set: function(v) {
			this.data[7] = v;
		}
	});
	Object.defineProperty(prototype, 'e20', {
		get: function() {
			return this.data[8];
		},
		set: function(v) {
			this.data[8] = v;
		}
	});
	Object.defineProperty(prototype, 'e21', {
		get: function() {
			return this.data[9];
		},
		set: function(v) {
			this.data[9] = v;
		}
	});
	Object.defineProperty(prototype, 'e22', {
		get: function() {
			return this.data[10];
		},
		set: function(v) {
			this.data[10] = v;
		}
	});
	Object.defineProperty(prototype, 'e23', {
		get: function() {
			return this.data[11];
		},
		set: function(v) {
			this.data[11] = v;
		}
	});
	Object.defineProperty(prototype, 'e30', {
		get: function() {
			return this.data[12];
		},
		set: function(v) {
			this.data[12] = v;
		}
	});
	Object.defineProperty(prototype, 'e31', {
		get: function() {
			return this.data[13];
		},
		set: function(v) {
			this.data[13] = v;
		}
	});
	Object.defineProperty(prototype, 'e32', {
		get: function() {
			return this.data[14];
		},
		set: function(v) {
			this.data[14] = v;
		}
	});
	Object.defineProperty(prototype, 'e33', {
		get: function() {
			return this.data[15];
		},
		set: function(v) {
			this.data[15] = v;
		}
	});

	return pc.Mat4;
}());
