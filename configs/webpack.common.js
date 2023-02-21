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

// get module name for split chunks
const getModuleName = (module, chunks, groupName) => {
  const moduleName = module.resourceResolveData.descriptionFileData.name.replace('@', '');
  const allChunksNames = chunks.map((item) => item.name).join('~');
  //return `${groupName}.${moduleName}`; // <= this should be enough
  return `${groupName}~${allChunksNames}~${moduleName}`;
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
  output: {
    path: projectPath.output,
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
