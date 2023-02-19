// Модуль path предоставляет утилиты для работы с путями к файлам и каталогам. Доступ к нему можно получить, используя:
const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');
// use original ESJ templating engine for complex templates,
// because the plugin use Eta (EJS same syntax, but not 100%) "out of the box"
// IMPORTANT: don't use the outdated ejs-compiled-loader, it contains EJS v2,
// but actual version is v3.1.8
const ejs = require('ejs');

// Пользовательские зависимости.

// Объект с путями.
const projectPath = require('./modules/projectPath');

// create EJS options
const ejsOptions = {
  // define root template path
  // file is searched in /templates, e.g. <%- include('/base/header.html'); %>
  root: path.join(projectPath.context, 'templates'),
}

// Метод для поиска файлов.
const fileFilter = require('./modules/fileFilter');

// ОбЪект с рабочими файлами
// TODO: delete it
// js: {
//   expansion: '.js',
//   names: ['cart', 'index', 'profile'],
// };
const fileList = fileFilter([
  {
    source: path.join(projectPath.context, projectPath.entry),
    fileExtension: '.js',
  },
  {
    source: projectPath.context,
    fileExtension: '.html',
  },
]);

// get module name for split chunks
const getModuleName = (module, chunks, groupName) => {
  const moduleName = module.resourceResolveData.descriptionFileData.name.replace('@', '');
  const allChunksNames = chunks.map((item) => item.name).join('~');
  //return `${groupName}.${moduleName}`; // <= this should be enough
  return `${groupName}~${allChunksNames}~${moduleName}`;
};

// your function is not working and buggy on macOS, see my getModuleName()
// Error on macOS: Prevent writing to file that only differs in casing 
// or query string from already written file.
const setChunksName = function (module, chunks, cacheGroupKey) {
  let moduleName = module.identifier();

  function getStr(str, start, end) {
    const strStart = str.lastIndexOf(start) + 1;
    const strEnd = str.lastIndexOf(end);
    return str.slice(strStart, strEnd);
  }

  moduleName = getStr(moduleName, '\\', '.');

  const allChunksNames = chunks.map((item) => item.name).join('~');
  if (allChunksNames === moduleName) {
    return `${cacheGroupKey}~${allChunksNames}`;
  }
  return `${cacheGroupKey}~${allChunksNames}~${moduleName}`;
};

// Временная переменная, которая определяет режим сборки.
const { NODE_ENV } = process.env;

module.exports = {
  context: projectPath.context,
  stats: {
    // children: true,
    assets: true,
    moduleAssets: true,
    loggingDebug: ['sass-loader'],
  },
  performance: {
    // Включает/выключает подсказки. Кроме того, указывает веб-пакету выдавать либо ошибку, либо предупреждение при обнаружении подсказок.
    // Учитывая, что создается актив размером более 250 КБ:
    hints: false,
  },
  // stats: 'verbose',

  // TODO: delete Webpack entry
  // don't define in entry js/scss files when used the HtmlBundlerPlugin
  // using the HtmlBundlerPlugin an entry point is an HTML template
  // entry: () => {
  //   // Объект в котором будут сгенерированы точки входа.
  //   const entryPoints = {};
  //   // Цикл для автоматической генерации точек входа.
  //   fileList.js.names.forEach((element) => {
  //     // Расширение файла
  //     const { expansion } = fileList.js;
  //     // Присваивание имени файла
  //     entryPoints[element] = `${projectPath.entry}${element}${expansion}`;
  //   });
  //   return entryPoints;
  // },
  output: {
    path: projectPath.output,
    // TODO: delete filename here, if you need, define the js filename under Plugin option js.filename
    // filename: (pathData) => {
    //   if (NODE_ENV === 'production') {
    //     return `${projectPath.outputJs}[name]~[chunkhash:8].js`;
    //   }
    //   return `${projectPath.outputJs}[name].js`;
    // },
    
    // TODO: using new plugin is not needed more, delete it
    // chunkFilename: '[name][file][query][fragment]base][path]',
    
    // TODO: define asset filename in each module.rule.generator.filename, but not here
    // assetModuleFilename: '[id][name][file][query][fragment]base][path]',
  },
  optimization: {
    // minimize: NODE_ENV === 'production',
    //minimize: false,
    runtimeChunk: {
      name: 'runtime',
    },
    splitChunks: {
      cacheGroups: {
        commons: {
          // test: /[\\/]js[\\/]modules[\\/]/,
          // test: /[\\/]app[\\/]js[\\/]/,
          test: /[\\/]js[\\/]/,
          chunks: 'all',
          minSize: 0,
          // Минимальное количество фрагментов, которые должны совместно использовать модуль перед разделением.
          minChunks: 2,
          //name: setChunksName,
          name: getModuleName,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          // minSize: 0,
          //name: setChunksName,
          name: getModuleName,
        },

        // don't split styles, it is impossible,
        // because css-loader returns all stylies as non splitable JS code
        // you can manualy define several SCSS files to split styles
        // styles: {
        //   test: /\.(css|sass|scss)$/,
        //   chunks: 'all',
        //   minSize: 0,
        //   // name: setChunksName,
        // },
      },
    },
  },
  module: {
    // Загрузчики оцениваются / выполняются справа налево (или снизу вверх).
    // По моим догадкам, это работает внутри каждого элемента массива - rules (непосредственно внутри объекта).
    rules: [
      // Define EJS Templating engine
      // HtmlBundlerPlugin support the Eta templating engine "out of the box"
      // when used other engine, define it in the preprocessor
      {
        test: /\.(html|ejs)$/,
        loader: HtmlBundlerPlugin.loader,
        options: {
          preprocessor: (template, { data }) => ejs.render(template, data, ejsOptions),
        },
      },
      // Babel START
      {
        // "test" аналог "include". это две одинаковые команды(свойства), но есть соглашение что "test" используется для проверки разрешения (регулярное выражение), а "include" используется для проверки путей.
        test: /\.js$/,
        // Исключение, к которым не будет применяться "loader".
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Пример для браузеров
            // presets: [
            //   ['@babel/preset-env', { targets: 'ie 11' }]
            // ]
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
      // Babel END
      // Sass START
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'css-loader',
            options: {},
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: NODE_ENV === 'development',
            },
          },
        ],
      },
      // Sass END
      // Image END
      {
        // very important to use universal slashes [\\/] otherwise it not works on macOS/Linux
        test: /[\\/]img[\\/].*(ico|gif|png|jpe?g|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name]~[contenthash:8][ext]',
        },
        // The 'image-webpack-loader' require the installed 'imagemin-mozjpe',
        // but the mozjpeg not working on macbook M1 :-/
        // loader: 'image-webpack-loader',
        // options: {
        //   mozjpeg: {
        //     progressive: true,
        //   },
        //   // optipng.enabled: false will disable optipng
        //   optipng: {
        //     enabled: false,
        //   },
        //   pngquant: {
        //     quality: [0.65, 0.9],
        //     speed: 4,
        //   },
        //   gifsicle: {
        //     interlaced: false,
        //   },
        //   // the webp option will enable WEBP
        //   webp: {
        //     quality: 75,
        //   },
        // },
      },
      // Image END
      // Fonts START
      {
        test: /[\\/]fonts[\\/].*(png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name]~[contenthash:8][ext]',
        },
      },
      // Fonts END
      // Video START
      {
        test: /[\\/]video[\\/].*(swf|avi|flv|mpg|rm|mov|3gp|mkv|rmvb|mp4)$/,
        type: 'asset/resource',
        generator: {
          filename: 'video/[name]~[contenthash:8][ext]',
        },
      },
      // Video END
    ],
  },
  resolve: {
    // Сообщите webpack, в каких каталогах следует искать при разрешении модулей.
    modules: ['node_modules'],
    alias: {
      // use aliases in SCSS, JS, templates instead of relative paths like ../../
      // mdl: path.resolve(__dirname, 'src/js/modules')
      '@images': path.resolve(projectPath.root, 'app/img'),
      '@fonts': path.resolve(projectPath.root, 'app/fonts'),
      '@styles': path.resolve(projectPath.root, 'app/scss'),
      '@scripts': path.resolve(projectPath.root, 'app/js'),
    },
    // позволяет пользователям не использовать расширение при импорте:
    // import File from '../path/to/file';
    // Базовые настройки
    // extensions: ['.wasm', '.mjs', '.js', '.json'],
    
    // TODO: never use auto resolving of css, scss, html extensions, 
    // please add its to a filename always
    //extensions: ['.js', '.json', '.jsx', '.css', '.sass', '.scss', '.html'],
    extensions: ['.js', '.json', '.jsx'],
  },
  plugins: [
    new HtmlBundlerPlugin({
      entry: {
        // define templates here
        index: { // => dist/index.html (key is output filename w/o '.html')
          import: 'index.html', // template file
          data: { title: 'Homepage' } // pass variables into template
        },
        cart: { // => dist/cart.html
          import: 'cart.html',
          data: { title: 'Cart', }
        },
        // if your templates has't external variables, you can use the simple syntax
        // and the entry object can be dynamicly generated
        // index: 'index.html',
        // cart: 'cart.html',
      },
      js: {
        // output filename of extracted JS
        filename: 'js/[name].[contenthash:8].js',
      },
      css: {
        // output filename of extracted CSS
        filename: 'css/[name].[contenthash:8].css',
      },
    }),
  ],
};
