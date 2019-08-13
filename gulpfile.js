var gulp = require( 'gulp' );
var uglify = require( 'gulp-uglify' );
var concat = require( 'gulp-concat' );
var jshint = require( 'gulp-jshint' );

gulp.task( 'lint', function() {
    gulp.src( [
        'src/classes/**/*.js'
    ] )
        .pipe( jshint() )
        .pipe( jshint.reporter( 'default' ) );
} );

gulp.task( 'build', [ 'lint' ], function() {
    gulp.src( [
        'src/intro.js',
        'src/classes/Math/index.js',
        'src/classes/Math/**.js',
        'src/libglobals.js',
        'src/classes/EventEmitter.js',
        'src/classes/RigidBody.js',
        'src/classes/ForceGenerator.js',
        'src/classes/Collision/index.js',
        'src/classes/Shapes/index.js',
        'src/classes/**/*.js',
        'src/outro.js',

        // exclude bits we don't need
        '!src/classes/Constraints/HingeConstraint.js',
        '!src/classes/Constraints/PointConstraint.js',
        '!src/classes/Constraints/SliderConstraint.js',
        '!src/classes/Constraints/WeldConstraint.js'
    ] )
        .pipe( concat( 'goblin.js' ) )
        .pipe( gulp.dest( 'build' ) );
} );

gulp.task( 'build-minified', [ 'lint' ], function() {
    gulp.src( [
        'src/intro.js',
        'src/classes/Math/**.js',
        'src/libglobals.js',
        'src/classes/EventEmitter.js',
        'src/classes/RigidBody.js',
        'src/classes/ForceGenerator.js',
        'src/classes/**/*.js',
        'src/outro.js'
    ] )
        .pipe( concat( 'goblin.min.js' ) )
        .pipe( uglify() )
        .pipe( gulp.dest( 'build' ) );
} );

gulp.task( 'default', [ 'build', 'build-minified' ], function() {
} );