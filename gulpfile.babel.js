import browserSync from 'browser-sync';
import gulp from 'gulp';
import fs from 'fs';
import sourcemaps from 'gulp-sourcemaps';
import webpack from 'webpack-stream';
import fileinclude from 'gulp-file-include';
import cachebust from 'gulp-cache-bust';
import gulpLoadPlugins from 'gulp-load-plugins';
import gulpif from 'gulp-if';
import realFavicon from 'gulp-real-favicon';

/**
 * Подключаем плагины вида 'gulp-*' через plugins
 * наример плагин gulp-rename подключаем plugins.rename
 */
const plugins = gulpLoadPlugins();
const reload = (done) => {
    browserSync.reload();
    done();
};

/**
 * Config
 */
// корневые папки
let config = {
    app: 'assets',
    dist: 'public',
    resources: 'resources'
};

// папки сборки CSS и JS, сделаны отдельно, что бы чистить папки перед сборкой(от хешей в названиях)
config.distBundles = config.dist + '/bundles';
config.distBundlesCSS = config.distBundles + '/css';
config.distBundlesWebpack = config.distBundles + '/webpack';

// конфиг для favicon
config.favicon = {
    enable: false,
    themeColor: '#ffffff',
    src: config.dist + '/images/favicon.png',
    dist: config.dist + '/favicon',
    folderPublic: 'favicon',
    templateSrc: config.app + '/templates/favicon.html',
    templateDist: config.app + '/templates/'
}

// главный файл с настройками favicon
config.favicon.dataFile = config.favicon.dist + '/faviconData.json';

// проверяем наличие сгенерированных favicon
// если его нет, отключаем логику с вставкой favicon в HTML
if (fs.existsSync(__dirname + '/' + config.favicon.dataFile)) {
    config.favicon.enable = true;
}

config.env = 'development';
config.devMode = true;

export function prodModeOn(done) {
    config.env = 'production';
    config.devMode = false;
    done();
}

/**
 * Обработка ошибок
 */
export function onError(err) {
    plugins.notify.onError({
        // sound:    false,
        title: 'Gulp',
        subtitle: 'Plugin: <%= error.plugin %>',
        message: 'Error: <%= error.message %>'
    })(err);

    this.emit('end');
};

/**
 * Кеширование JS, CSS, картинок
 */
export function caching() {
    return gulp.src([
        config.dist + '/html/**/*.html',
        config.resources + '/views/**/*.php',
        '!' + config.resources + '/views/admin/**/*.php',
        '!' + config.resources + '/views/emails/**/*.php',
        '!' + config.resources + '/views/email/**/*.php',
        '!' + config.dist + '/html/e-mails/**/*.html'
    ])
        .pipe(plugins.debug({ title: 'caching:' }))
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(cachebust({
            basePath: './' + config.dist
        }))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
}

export function cachingResources() {
    return gulp.src([
        config.resources + '/views/**/*.php',
        '!' + config.resources + '/views/admin/**/*.php',
        '!' + config.resources + '/views/emails/**/*.php',
        '!' + config.resources + '/views/email/**/*.php'
    ])
        .pipe(plugins.debug({ title: 'caching:' }))
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(cachebust({
            basePath: './' + config.dist
        }))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
}

/**
 * Генерация favicon
 * через сервис https://realfavicongenerator.net
 */
export function generateFavicon(done) {
    realFavicon.generateFavicon({
        masterPicture: config.favicon.src,
        dest: config.favicon.dist,
        iconsPath: '/',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin',
                backgroundColor: config.favicon.themeColor,
                margin: '10%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {},
            windows: {
                pictureAspect: 'noChange',
                backgroundColor: config.favicon.themeColor,
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: config.favicon.themeColor,
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                pictureAspect: 'silhouette',
                themeColor: config.favicon.themeColor
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false
        },
        markupFile: config.favicon.dataFile
    }, function () {
        config.favicon.enable = true;
        done();
    });
};

// меняем пути к favicon для нашей структуры проекта
export function injectFaviconMarkups() {
    var faviconHTML = JSON.parse(fs.readFileSync(config.favicon.dataFile)).favicon.html_code;
    faviconHTML = faviconHTML.replace(/="\//g, '="/' + config.favicon.folderPublic + '/');

    return gulp.src([config.favicon.templateSrc])
        .pipe(realFavicon.injectFaviconMarkups(faviconHTML))
        .pipe(gulp.dest(config.favicon.templateDist));
}

// проверка версии favicon
export function updateFavicon(done) {
    var currentVersion = JSON.parse(fs.readFileSync(config.favicon.dataFile)).version;
    realFavicon.checkForUpdates(currentVersion, function (err) {
        done();
    });
}

/**
 * Генерация и проверка HTML
 */
export function templateToHTML() {
    return gulp.src([
        config.app + '/templates/**/*.html',
        '!' + config.app + '/templates/favicon.html',
        '!' + config.app + '/templates/**/include/*.html'
    ])
        .pipe(plugins.debug({ title: 'html:' }))
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: config.app,
            indent: true,
            context: {
                webRoot: '../public',
                includeModals: false,
                favicon: config.favicon.enable
            }
        }))
        .pipe(gulp.dest(config.dist + '/html'));
}

// Rules https://github.com/yaniswang/HTMLHint/wiki/Rules
export function htmlHint() {
    return gulp.src([
        config.app + '/blocks/**/*.html',
        config.app + '/templates/**/*.html',
        '!' + config.app + '/templates/**/include/*.html'
    ])
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(plugins.htmlhint({
            'doctype-first': false
        }))
        .pipe(plugins.htmlhint.failOnError())
}

export function clearHTMLFolder() {
    return gulp.src(config.dist + '/html', { read: false, allowEmpty: true })
        .pipe(plugins.clean());
}

/**
 * Генерация CSS
 */
export function css() {
    return gulp.src(config.app + '/*.css')
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(plugins.debug({ title: 'css:' }))
        .pipe(sourcemaps.init())
        .pipe(plugins.postcss([
            require('postcss-import'),
            require('postcss-mixins'),
            require('postcss-assets')({ loadPaths: ['./' + config.dist + '/images'] }),
            require('postcss-nested-ancestors'),
            require('postcss-nested'),
            require('lost'),
            require('autoprefixer'),
            require('postcss-preset-env'),
            require('postcss-base64')({
                extensions: ['.svg'],
                root: process.cwd() + '/' + config.dist,
            }),
            require('postcss-csso')({
                restructure: false
            }),
            require('postcss-cachebuster')({
                imagesPath: '/' + config.dist,
                cssPath: '/' + config.distBundlesCSS
            })
        ]))
        .pipe(plugins.rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.distBundlesCSS))
        .pipe(browserSync.stream({ match: '**/*.css' }));
}

// генерируем отдельно CSS файл с font-face правилами
// который потом заберет templateToHTML и подключит в head страницы
export function cssFont() {
    return gulp.src(config.app + '/css/fonts.css', { read: false, allowEmpty: true })
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(plugins.debug({ title: 'cssFont:' }))
        .pipe(plugins.postcss([
            require('postcss-fontpath')({
                formats: [
                    { type: 'woff', ext: 'woff' },
                    { type: 'truetype', ext: 'ttf' }
                ]
            }),
            require('postcss-cachebuster')({
                imagesPath: '/' + config.dist
            }),
            // require('postcss-base64')({
            //     extensions: ['.woff', '.ttf'],
            //     excludeAtFontFace: false,
            //     root: './' + config.dist
            // }),
            require('postcss-csso')
        ]))
        .pipe(plugins.rename(function (path) {
            path.basename += '.min';
        }))
        .pipe(gulp.dest(config.distBundlesCSS));
}

/**
 * Генерация JS через webpack
 * конфигурация Webpack в webpack.config.js
 */
export function webpackStream() {
    return gulp.src(config.app + '/*.js')
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(webpack(require('./webpack.config.js')(config.env)))
        .pipe(gulp.dest(config.distBundlesWebpack));
}

/**
 * Оптимизация изображений
 */
export function imagesOptim() {
    return gulp.src([config.dist + '/images/**/*.{png,gif,jpg,svg}',
    config.dist + '/favicon/**/*.{png,gif,jpg,svg}'])
        .pipe(plugins.image({
            zopflipng: false,
            mozjpeg: ['-quality', 100]
        }))
        // .pipe(plugins.smushit({
        //     verbose: true
        // }))
        .pipe(gulp.dest(function (file) {
            return file.base;
        }));
}


/**
 * Команды для git
 */

// разбиваем на части коммит:
// 1) исходные изменения
// 2) сборка
// 3) обновление хешей в шаблонах
export function gitCommit() {
    return gulp.src('./git/*')
        .pipe(plugins.git.add({
            args: config.app
        }))
        .pipe(plugins.git.commit('Frontend source', { args: '-m' }).on('error', function (err) {
            gutil.beep();
            if (err) throw err;
        }))
        .pipe(plugins.git.add({
            args: config.dist
        }))
        // .pipe(plugins.git.add({
        //     args: config.resources
        // }))
        .pipe(plugins.git.commit('Frontend build', { args: '-m' }).on('error', function (err) {
            gutil.beep();
            if (err) throw err;
        }));
}

export function gitCommitCacheResources() {
    return gulp.src('./git/*')
        .pipe(plugins.git.add({
            args: config.resources
        }))
        .pipe(plugins.git.commit('Update cache').on('error', function (err) {
            gutil.beep();
            if (err) throw err;
        }));
}

/**
 * Watcher
 */
export function watcher() {
    gulp.watch([config.app + '/**/*.html'], gulp.series(templateToHTML, htmlHint, reload));
    gulp.watch([config.app + '/**/*.css', '!' + config.app + '/css/_fonts.css'], css);
    gulp.watch([config.app + '/css/fonts.css'], gulp.series(cssFont, templateToHTML, reload));
    gulp.watch([config.app + '/**/*.js'], gulp.series(webpackStream, reload));
    browserSync.init({
        server: './' + config.dist,
        notify: false,
        // open: false
    });
}

/**
 * Build
 */
const buildHTML = gulp.series(clearHTMLFolder, templateToHTML, htmlHint);
const buildCSS = gulp.parallel(css, cssFont);
const buildFrontend = gulp.series(prodModeOn, buildCSS, webpackStream, buildHTML, caching);

/**
 * Task
 */
// сборка HTML
gulp.task('html', buildHTML);
// сборка css
gulp.task('styles', buildCSS);
// сборка js без минификации
gulp.task('webpack:dev', webpackStream);
// сборка js с минификацией
gulp.task('webpack:pro', gulp.series(prodModeOn, webpackStream));
// оптимизация изображений
gulp.task('images', imagesOptim);
// проставление хешей в HTML и шаблонах
gulp.task('cache', caching);
// проставление хешей в шаблонах
gulp.task('cache:res', cachingResources);

// генерация favicon
gulp.task('favicon', gulp.series(generateFavicon, injectFaviconMarkups, templateToHTML, caching));
// проверка версии favicon
gulp.task('favicon:update', updateFavicon);

// коммит сборки
gulp.task('git', gulp.series(buildFrontend, gitCommit));
gulp.task('commit', gulp.series(buildFrontend, gitCommit));
gulp.task('cache:commit', gulp.series(cachingResources, gitCommitCacheResources));

// сборка frontend
gulp.task('build', buildFrontend);

// запуск watch
gulp.task('default', gulp.parallel(buildCSS, webpackStream, buildHTML, watcher));
