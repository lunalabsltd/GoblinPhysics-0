if (typeof pc === 'undefined') {
	pc = (function() {

		/**
		 * @private
		 * @name pc._typeLookup
		 * @function
		 * @description Create look up table for types
		 */
		var _typeLookup = (function() {
			var result = {},
			index,
			names = ["Array", "Object", "Function", "Date", "RegExp", "Float32Array"];

			for ( index = 0; index < names.length; ++index ) {
				result["[object " + names[index] + "]"] = names[index].toLowerCase();
			}

			return result;
		}());

		return {

			/**
			 * @private
			 * @function
			 * @name pc.type
			 * @description Extended typeof() function, returns the type of the object.
			 * @param {Object} obj The object to get the type of
			 * @return {String} The type string: "null", "undefined", "number", "string", "boolean", "array", "object", "function", "date", "regexp" or "float32array"
			 */
			type: function( obj ) {
				if ( obj === null ) {
					return "null";
				}

				var type = typeof( obj );

				if ( type == "undefined" || type == "number" || type == "string" || type == "boolean" ) {
					return type;
				}

				return _typeLookup[Object.prototype.toString.call( obj )];
			},

			/**
			 * @private
			 * @function
			 * @name pc.extend
			 * @description Merge the contents of two objects into a single object
			 * @param {Object} target The target object of the merge
			 * @param {Object} ex The object that is merged with target
			 * @return {Object} The target object
			 * @example
			 * var A = {a: function() {console.log(this.a}};
			 * var B = {b: function() {console.log(this.b}};
			 *
			 * pc.extend(A,B);
			 * A.a();
			 * // logs "a"
			 * A.b();
			 * // logs "b"
			 */
			extend: function( target, ex ) {
				var prop,
				copy;

				for ( prop in ex ) {
					copy = ex[prop];
					if ( pc.type( copy ) == "object" ) {
						target[prop] = pc.extend( {}, copy );
					} else if ( pc.type( copy ) == "array" ) {
						target[prop] = pc.extend( [], copy );
					} else {
						target[prop] = copy;
					}
				}

				return target;
			}
		};
	}());
}