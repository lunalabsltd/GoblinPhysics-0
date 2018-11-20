var gulp = require( 'gulp' ),
	uglify = require('gulp-uglify' ),
	concat = require( 'gulp-concat' ),
	jshint = require( 'gulp-jshint' );

gulp.task('lint', function(){
	gulp.src([
		'src/classes/**/*.js'
	])
	.pipe( jshint() )
	.pipe( jshint.reporter( 'default' ) );
});

gulp.task('build', ['lint'], function(){
	gulp.src([
		'src/intro.js',
		'src/classes/pc/pc.js',
		'src/classes/pc/vec3.js',
		'src/classes/pc/mat3.js',
		'src/classes/pc/mat4.js',
		'src/classes/pc/quat.js',
		'src/classes/Math/**.js',
		'src/libglobals.js',
		'src/classes/EventEmitter.js',
		'src/classes/RigidBody.js',
		'src/classes/ForceGenerator.js',
		'src/classes/**/*.js',
		'src/outro.js'
	])
	.pipe( concat( 'goblin.js' ) )
	.pipe( gulp.dest( 'build' ) );
});

gulp.task('build-minified', ['lint'], function(){
	gulp.src([
		'src/intro.js',
		'src/classes/pc/pc.js',
		'src/classes/pc/vec3.js',
		'src/classes/pc/mat3.js',
		'src/classes/pc/mat4.js',
		'src/classes/pc/quat.js',
		'src/classes/Math/**.js',
		'src/libglobals.js',
		'src/classes/EventEmitter.js',
		'src/classes/RigidBody.js',
		'src/classes/ForceGenerator.js',
		'src/classes/**/*.js',
		'src/outro.js'
	])
	.pipe( concat( 'goblin.min.js' ) )
	.pipe( uglify() )
	.pipe( gulp.dest( 'build' ) );
});

gulp.task('default', ['build', 'build-minified'], function(){});