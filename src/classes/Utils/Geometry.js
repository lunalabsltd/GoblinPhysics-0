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
    findClosestPointInTriangle: ( function() {
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
            var vc = d1 * d4 - d3 * d2;
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
            var vb = d5 * d2 - d1 * d6,
                w;
            if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {
                w = d2 / ( d2 - d6 );
                out.set( a.x + ac.x * w, a.y + ac.y * w, a.z + ac.z * w );
                return;
            }

            // Check if P in edge region of BC
            var va = d3 * d6 - d5 * d4;
            if ( va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0 ) {
                w = ( d4 - d3 ) / ( ( d4 - d3 ) + ( d5 - d6 ) );
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
    } )(),

    /**
     * Finds the Barycentric coordinates of point `p` in the triangle `a`, `b`, `c`
     *
     * @param p {Goblin.Vector3} point to calculate coordinates of
     * @param a {Goblin.Vector3} first point in the triangle
     * @param b {Goblin.Vector3} second point in the triangle
     * @param c {Goblin.Vector3} third point in the triangle
     * @param out {Goblin.Vector3} resulting Barycentric coordinates of point `p`
     */
    findBarycentricCoordinates: ( function() {
        var v0 = new Goblin.Vector3();
        var v1 = new Goblin.Vector3();
        var v2 = new Goblin.Vector3();
        var t = 0;

        return function( p, a, b, c, out ) {
            v0.subtractVectors( b, a );
            v1.subtractVectors( c, a );
            v2.subtractVectors( p, a );

            var d00 = v0.dot( v0 );
            var d01 = v0.dot( v1 );
            var d11 = v1.dot( v1 );
            var d20 = v2.dot( v0 );
            var d21 = v2.dot( v1 );
            var d22 = v2.dot( v2 );
            var denom = d00 * d11 - d01 * d01;

            if ( Math.abs( denom ) < Goblin.EPSILON ) {
                // ABC is a line, but worry not
                if ( Math.abs( d00 ) < Goblin.EPSILON ) {
                    // A and B are the same point => we can use line A -> C
                    t = Math.sqrt( d22 / d11 );
                    out.set( 1 - t, 0, t );
                    return;
                } else {
                    // A and C are the same point OR B and C are the same point => we can use line A -> B
                    t = Math.sqrt( d22 / d00 );
                    out.set( 1 - t, t, 0 );
                    return;
                }
            }

            out.y = ( d11 * d20 - d01 * d21 ) / denom;
            out.z = ( d00 * d21 - d01 * d20 ) / denom;
            out.x = 1 - out.y - out.z;
        };
    } )(),

    /**
     * Calculates the distance from point `p` to line `ab`
     * @param p {Goblin.Vector3} point to calculate distance to
     * @param a {Goblin.Vector3} first point in line
     * @param b [Goblin.Vector3] second point in line
     * @returns {number}
     */
    findSquaredDistanceFromSegment: ( function() {
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
    } )(),

    /**
     * Returns a closest point on a line segment defined by two points.
     *
     * @param {Goblin.Vector3} segmentStart
     * @param {Goblin.Vector3} segmentEnd
     * @param {Goblin.Vector3} point
     * @returns {Goblin.Vector3}
     */
    findClosestPointOnASegment: ( function() {
        var v = new Goblin.Vector3();
        var vNormalized = new Goblin.Vector3();
        var u = new Goblin.Vector3();
        var t = 0;

        return function( segmentStart, segmentEnd, point ) {
            v.subtractVectors( segmentEnd, segmentStart );
            vNormalized.copy( v );
            vNormalized.normalize();
            u.subtractVectors( point, segmentStart );

            var closestPoint = new Goblin.Vector3();
            closestPoint.copy( vNormalized );
            closestPoint.scale( u.dot( vNormalized ) ); // It's now a vector from segmentStart to a closest point on a line (not on the line segment)

            t = v.dot( closestPoint ) / v.dot( v );
            t = Goblin.Math.Utils.clamp( t, 0, 1 );

            closestPoint.copy( v );
            closestPoint.scale( t );
            closestPoint.add( segmentStart );

            return closestPoint;
        };
    } )(),

    /**
     * Populates p1 and p2 with a closest points on both segments. Returns squared distance between them.
     *
     * @param {Goblin.Vector3} aa - first segment start
     * @param {Goblin.Vector3} ab - first segment end
     * @param {Goblin.Vector3} ba - second segment start
     * @param {Goblin.Vector3} bb - second segment end
     * @param {Goblin.Vector3} p1 - closest point on first segment
     * @param {Goblin.Vector3} p2 - closest point on second segment
     * @returns {number} - distance between p1 and p2
     */
    findClosestPointsOnSegments: ( function() {
        var d1 = new Goblin.Vector3();
        var d2 = new Goblin.Vector3();
        var r = new Goblin.Vector3();
        var diff = new Goblin.Vector3();

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
                diff.subtractVectors( p1, p2 );
                return diff.dot( diff );
            }

            if ( a <= Goblin.EPSILON ) {
                // Only first segment is degenerate
                s = 0;
                t = f / e;
                t = Goblin.Utils.clamp( t, 0, 1 );
            } else {
                var c = d1.dot( r );
                if ( e <= Goblin.EPSILON ) {
                    // Second segment is degenerate
                    t = 0;
                    s = Goblin.Math.Utils.clamp( -c / a, 0, 1 );
                } else {
                    // Neither segment is degenerate
                    var b = d1.dot( d2 );
                    var denom = a * e - b * b;

                    if ( denom !== 0 ) {
                        // Segments aren't parallel
                        s = Goblin.Math.Utils.clamp( ( b * f - c * e ) / denom, 0, 1 );
                    } else {
                        s = 0;
                    }

                    // find point on segment2 closest to segment1(s)
                    t = ( b * s + f ) / e;

                    // validate t, if it needs clamping then clamp and recompute s
                    if ( t < 0 ) {
                        t = 0;
                        s = Goblin.Math.Utils.clamp( -c / a, 0, 1 );
                    } else if ( t > 1 ) {
                        t = 1;
                        s = Goblin.Math.Utils.clamp( ( b - c ) / a, 0, 1 );
                    }
                }
            }

            p1.scaleVector( d1, s );
            p1.add( aa );

            p2.scaleVector( d2, t );
            p2.add( ba );

            diff.subtractVectors( p1, p2 );
            return diff.dot( diff );
        };
    } )(),

    /**
     * Finds a closest point to plane on a given line segments. Writes result into `outPoint`.
     * Returns a distance from nearest point on the line segment to the plane.
     * If distance === 0 then `outPoint` is a point on line segment, otherwise it's either `lineStart` or `lineEnd`.
     *
     * @param {Goblin.Vector3} planeOrigin
     * @param {Goblin.Vector3} planeNormal
     * @param {Goblin.Vector3} lineStart
     * @param {Goblin.Vector3} lineEnd
     * @param {Goblin.Vector3} outPoint
     * @returns {number} - distance from nearest point on the line segment to the plane. It equals 0 if plane intersects line segment.
     */
    findClosestPointToPlaneOnLineSegment: ( function() {
        return function( planeOrigin, planeNormal, lineStart, lineEnd, outPoint ) {
            var planeDistance = planeOrigin.dot( planeNormal );
            var lineStartDistance = lineStart.dot( planeNormal ) - planeDistance;
            var lineEndDistance = lineEnd.dot( planeNormal ) - planeDistance;

            if ( lineStartDistance < -Goblin.EPSILON && lineEndDistance < -Goblin.EPSILON ) {
                // line segment if fully behind the plane
                if (lineStartDistance > lineEndDistance) {
                    outPoint.copy(lineStart);
                    return lineStartDistance;
                } else {
                    outPoint.copy(lineEnd);
                    return lineEndDistance;
                }
            } else if ( lineStartDistance > Goblin.EPSILON && lineEndDistance > Goblin.EPSILON ) {
                // line segment is fully in front of the plane
                if (lineStartDistance < lineEndDistance) {
                    outPoint.copy(lineStart);
                    return lineStartDistance;
                } else {
                    outPoint.copy(lineEnd);
                    return lineEndDistance;
                }
            }

            outPoint.scaleVector( planeNormal, -lineEndDistance );
            outPoint.add( lineEnd );
            return 0;
        };
    } )(),
};