var gulp = require('gulp');
require('babel-register');

gulp.task('test', function () {
    var mocha = require('gulp-mocha');
    return gulp.src('test/*-test.js', { read: false }).pipe(mocha());
});

gulp.task('default', [ 'test']);
gulp.task('watch', function() {
    gulp.watch('./index.js', ['test']);
});