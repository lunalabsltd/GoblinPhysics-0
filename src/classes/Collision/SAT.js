Goblin.Collision.SAT = {
    /**
     * Performs A SAT collision between to objects. Returns projection (that can be used as a minimum translation vector) or null if there is no collision.
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectA
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} objectB
     * @returns {Goblin.Collision.SAT.Projection|null}
     */
    performSat: ( function() {
        var negatedNormal = new Goblin.Vector3();

        return function( objectA, objectB ) {
            var allNormals = [];
            var normalsA = objectA.faceNormals;
            var normalsB = objectB.faceNormals;
            if ( normalsA.length === 0 ) {
                allNormals = normalsB;
            } else if ( normalsB === 0 ) {
                allNormals = normalsA;
            } else {
                var crossNormals = this._getAllCrossProductPairs( normalsA, normalsB );
                allNormals.push.apply( allNormals, normalsA );
                allNormals.push.apply( allNormals, normalsB );
                allNormals.push.apply( allNormals, crossNormals );
                this.removeDuplicatedVectors( allNormals );
            }

            var allProjections = [];
            var minimumProjection = null;
            var minimumOverlap = Infinity;

            for ( var i = 0; i < allNormals.length; i++ ) {
                var normal = allNormals[ i ];
                negatedNormal.scaleVector( normal, -1 );
                var computedNegativeProjection = this._findProjectionWithNormal( allProjections, negatedNormal );

                var projection = null;
                if ( computedNegativeProjection ) {
                    projection = computedNegativeProjection.cloneAndNegate();
                }
                if ( !projection ) {
                    var a1 = this._findMaxDotInDirection( objectA, normal );
                    var a2 = -this._findMaxDotInDirection( objectA, negatedNormal );
                    var b1 = this._findMaxDotInDirection( objectB, normal );
                    var b2 = -this._findMaxDotInDirection( objectB, negatedNormal );
                    projection = new Goblin.Collision.SAT.Projection( normal, a1, a2, b1, b2 );
                }

                if ( projection.overlap < Goblin.EPSILON ) {
                    return null;
                }

                allProjections.push( projection );
                if ( projection.overlap < minimumOverlap ) {
                    minimumOverlap = projection.overlap;
                    minimumProjection = projection;
                }
            }

            return minimumProjection;
        };
    } )(),

    /**
     * Removes all duplicates from array of vectors.
     * @param {Array<Goblin.Vector3>} vectors
     */
    removeDuplicatedVectors: function( vectors ) {
        for ( var i = 0; i < vectors.length; i++ ) {
            var vector = vectors[ i ];
            var isDuplicate = false;

            for ( var j = i + 1; j < vectors.length; j++ ) {
                isDuplicate = vector.equals( vectors[ j ] );
                if ( isDuplicate ) {
                    break;
                }
            }

            if ( isDuplicate ) {
                vectors[ i ] = vectors[ vectors.length - 1 ];
                vectors.pop();
                i--;
            }
        }
    },

    /**
     * Performs cross-product between all pairs of vectors.
     * @param {Goblin.Vector3[]} normalsA
     * @param {Goblin.Vector3[]} normalsB
     * @returns {Goblin.Vector3[]}
     * @private
     */
    _getAllCrossProductPairs: function( normalsA, normalsB ) {
        var crossProducts = [];

        for ( var i = 0; i < normalsA.length; i++ ) {
            for ( var j = 0; j < normalsB.length; j++ ) {
                var crossProduct = new Goblin.Vector3();
                crossProduct.crossVectors( normalsA[ i ], normalsB[ j ] );
                crossProducts.push( crossProduct );
            }
        }

        this.removeDuplicatedVectors( crossProducts );
        return crossProducts;
    },

    /**
     * Finds a projection with a given normal.
     * @param {Goblin.Collision.SAT.Projection[]} allProjections
     * @param {Goblin.Vector3} normal
     * @returns {Goblin.Collision.SAT.Projection|null}
     * @private
     */
    _findProjectionWithNormal: function( allProjections, normal ) {
        for ( var i = 0; i < allProjections.length; i++ ) {
            var projection = allProjections[ i ];
            if ( projection.normal.equals( normal ) ) {
                return projection;
            }
        }

        return null;
    },

    /**
     * @param {Goblin.RigidBody|Goblin.RigidBodyProxy} object
     * @param {Goblin.Vector3} direction
     * @returns {number}
     * @private
     */
    _findMaxDotInDirection: ( function() {
        var supportPoint = new Goblin.Vector3();

        return function( object, direction ) {
            object.findSupportPoint( direction, supportPoint );
            return supportPoint.dot( direction );
        };
    } )()
};

/**
 * Holds details of projection of two objects on some axis. Most useful fields are normal (which is an axis),
 * and overlap (which is a length of minimum translation vector)
 *
 * @param {Goblin.Vector3} normal
 * @param {number} a1 - first point of object's A projection on axis
 * @param {number} a2 - second point of object's A projection on axis
 * @param {number} b1 - first point of object's B projection on axis
 * @param {number} b2 - second point of object's B projection on axis
 * @constructor
 */
Goblin.Collision.SAT.Projection = function( normal, a1, a2, b1, b2 ) {
    this.normal = normal;
    if ( a1 < a2 ) {
        this.startA = a1;
        this.endA = a2;
    } else {
        this.startA = a2;
        this.endA = a1;
    }

    if ( b1 < b2 ) {
        this.startB = b1;
        this.endB = b2;
    } else {
        this.startB = b2;
        this.endB = b1;
    }

    var hasOverlap = this.startA < this.endB && this.endA > this.startB;
    if ( hasOverlap ) {
        this.overlap = this.endB - this.startA;
    } else {
        this.overlap = 0;
    }
};

/**
 * @returns {Goblin.Collision.SAT.Projection}
 */
Goblin.Collision.SAT.Projection.prototype.cloneAndNegate = function() {
    var negatedNormal = new Goblin.Vector3();
    negatedNormal.scaleVector( this.normal, -1 );
    return new Goblin.Collision.SAT.Projection( negatedNormal, -this.startA, -this.endA, -this.startB, -this.endB );
};