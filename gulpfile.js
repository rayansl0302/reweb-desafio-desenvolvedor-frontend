const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const twig = require('gulp-twig');
const { argv } = require('yargs');
const fs = require('fs');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();

// Varivel para alterar o tema
const theme = 'template-01';

// Task responsavel por compilar o scss para css
gulp.task('sass', () => {
  return gulp
    .src(`themes/${theme}/assets/css/sass/*.scss`)
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest(`themes/${theme}/assets/css/`))
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

// Task responsavel por gerar o compilar o twig
gulp.task('html', async () => {
  return gulp
    .src([`themes/${theme}/pages/*.htm`])
    .pipe(
      twig({
        errorLogToConsole: true,
        base: `themes/${theme}/`,
        functions: [
          {
            name: 'source',
            func(json) {
              return fs.readFileSync(`themes/${theme}/${json}`);
            }
          }
        ],
        filters: [
          {
            name: 'json_decode',
            func(json) {
              return JSON.parse(json);
            }
          }
        ]
      })
    )
    .pipe(gulp.dest('./dist/'));
});

// Task que move as imagens de /assets/img para ./dist/src/imagens
gulp.task('src', () => {
  return gulp
    .src(`themes/${theme}/assets/img/**.*`)
    .pipe(gulp.dest('./dist/assets/img/'));
});

const createTmp = argv.create !== undefined;


// task do Server...
gulp.task('serve', () => {
  browserSync.init({
    server: './dist',
  });

  // Monitora as alterações no json
  gulp.watch(
    `themes/${theme}/source/**/*.json`,
    gulp.series(['clean:css', 'sass', 'clean:html', 'html'])
  );

  // Monitora as alterações no scss
  gulp.watch(
    `themes/${theme}/assets/css/**/*.scss`,
    gulp.series(['clean:css', 'sass', 'clean:html', 'html'])
  );

  // Monitora as alteração nas pastas 'blocks', 'layout', 'pages', 'partials'
  gulp.watch(`themes/${theme}/**/**.htm`, gulp.series(['clean:html', 'html']));

  // Faz a sincronização caso haja qualquer modificação no projeto
  gulp.watch(`themes/${theme}/**/**.*`).on('change', browserSync.reload);
});

// Task de remoção das imagens da pasta '/dist'
gulp.task(
  'clean:src',
  gulp.series(() => {
    return del(['./dist/src/images/**.*']);
  })
);

// Task de remoção do html
gulp.task('clean:html', () => {
  return del(['./dist/*.html']);
});

// Task de remoção do css
gulp.task('clean:css', () => {
  return del([`themes/${theme}/assets/css/*.css`]);
});

// Task default do gulp, ela é chamada sempre que o comando 'gulp' é executado
gulp.task(
  'default',
  gulp.series(['clean:css', 'clean:html', 'sass', 'html', 'src', 'serve'])
);
