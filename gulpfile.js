const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

let dev = true;
let githash;
let gitcount;

gulp.task('hash', (cb) => {
    return $.git.revParse({ args: '--short HEAD' }, (err, hash) => {
        githash = hash;
        cb(err);
        console.log('Current revision: ' + githash);
    })
})

gulp.task('rev-count', (cb) => {
    return $.git.exec({ args: 'rev-list --count HEAD' }, (err, count) => {
        gitcount = count.trim();
        cb(err);
        console.log('r' + gitcount);
    })
})

gulp.task('inject-githash', ['hash', 'rev-count'], () => {
    return gulp.src('dist/index.html')
        .pipe($.cheerio(($) => {
            $('#git-hash').replaceWith('<span id="git-hash">Built with: ' + githash + ' (r' + gitcount + ')</span>');
        }))
        .pipe(gulp.dest('dist'))
})

gulp.task('styles', () => {
    return gulp.src('src/styles/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({ stream: true }));
});

gulp.task('scripts', () => {
    return gulp.src('src/scripts/**/*.js')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(reload({ stream: true }));
});

function lint(files, options) {
    return gulp.src(files)
        .pipe($.eslint({ fix: true }))
        .pipe(reload({ stream: true, once: true }))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
    return lint('src/scripts/**/*.js')
        .pipe(gulp.dest('src/scripts'));
});

gulp.task('lint:test', () => {
    return lint('test/spec/**/*.js')
        .pipe(gulp.dest('test/spec'));
});

gulp.task('html', ['styles', 'scripts'], () => {
    return gulp.src('src/*.html')
        .pipe($.useref({ searchPath: ['.tmp', 'src', '.'] }))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.cssnano({ safe: true, autoprefixer: false })))
        // .pipe($.if('*.html', $.htmlmin({ collapseWhitespace: true })))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('src/images/**/*')
        // .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', (e) => {})
            .concat('src/fonts/**/*'))
        .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
    return gulp.src([
        'src/*',
        '!src/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
    runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts'], () => {
        browserSync.init({
            notify: false,
            port: 9000,
            server: {
                baseDir: ['.tmp', 'src'],
                routes: {
                    '/bower_components': 'bower_components'
                }
            }
        });

        gulp.watch([
            'src/*.html',
            'src/images/**/*',
            '.tmp/fonts/**/*'
        ]).on('change', reload);

        gulp.watch('src/styles/**/*.scss', ['styles']);
        gulp.watch('src/scripts/**/*.js', ['scripts']);
        gulp.watch('src/fonts/**/*', ['fonts']);
        gulp.watch('bower.json', ['wiredep', 'fonts']);
    });
});

gulp.task('serve:dist', ['default'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

gulp.task('serve:test', ['scripts'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        ui: false,
        server: {
            baseDir: 'test',
            routes: {
                '/scripts': '.tmp/scripts',
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch('src/scripts/**/*.js', ['scripts']);
    gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
    gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
    gulp.src('src/styles/*.scss')
        .pipe($.filter(file => file.stat && file.stat.size))
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)+/
        }))
        .pipe(gulp.dest('src/styles'));

    gulp.src('src/*.html')
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
    return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

// gulp.task('build', ['lint', 'html', 'fonts', 'extras'], () => {
//     return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
// });

gulp.task('default', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence(['clean', 'wiredep'], 'build', 'inject-githash', resolve);
    });
});