Goblin.Math.Utils = {
    /**
     * Returns `num` if it's within (min, max) and closest border otherwise.
     * @param {number} num
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp: function( num, min, max ) {
        if ( num < min ) {
            return min;
        } else if ( num > max ) {
            return max;
        } else {
            return num;
        }
    }
};