// Модуль path предоставляет утилиты для работы с путями к файлам и каталогам. Доступ к нему можно получить, используя:
const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

// Пользовательские зависимости.

// Объект с путями.
const projectPath = require('./modules/projectPath');

// Метод для поиска файлов.
const fileFilter = require('./modules/fileFilter');

// ОбЪект с рабочими файлами
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
  entry: () => {
    // Объект в котором будут сгенерированы точки входа.
    const entryPoints = {};
    // Цикл для автоматической генерации точек входа.
    fileList.js.names.forEach((element) => {
      // Расширение файла
      const { expansion } = fileList.js;
      // Присваивание имени файла
      entryPoints[element] = `${projectPath.entry}${element}${expansion}`;
    });
    return entryPoints;
  },
  output: {
    path: projectPath.output,
    filename: (pathData) => {
      if (NODE_ENV === 'production') {
        return `${projectPath.outputJs}[name]~[chunkhash:8].js`;
      }
      return `${projectPath.outputJs}[name].js`;
    },
    // chunkFilename: '[name][file][query][fragment]base][path]',
    // assetModuleFilename: '[id][name][file][query][fragment]base][path]',
  },
  optimization: {
    // minimize: NODE_ENV === 'production',
    minimize: false,
    // runtimeChunk: {
    //   name: 'runtime',
    // },
    // splitChunks: {
    //   cacheGroups: {
    //     commons: {
    //       // test: /[\\/]js[\\/]modules[\\/]/,
    //       // test: /[\\/]app[\\/]js[\\/]/,
    //       test: /[\\/]js[\\/]/,
    //       chunks: 'all',
    //       minSize: 0,
    //       // Минимальное количество фрагментов, которые должны совместно использовать модуль перед разделением.
    //       minChunks: 2,
    //       // name: setChunksName,
    //     },
    //     vendors: {
    //       test: /[\\/]node_modules[\\/]/,
    //       chunks: 'all',
    //       // minSize: 0,
    //       // name: setChunksName,
    //     },
    //     styles: {
    //       test: /\.(css|sass|scss)$/,
    //       chunks: 'all',
    //       minSize: 0,
    //       // name: setChunksName,
    //     },
    //   },
    // },
  },
  module: {
    // Загрузчики оцениваются / выполняются справа налево (или снизу вверх).
    // По моим догадкам, это работает внутри каждого элемента массива - rules (непосредственно внутри объекта).
    rules: [
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
        test: /[\\]img[\\].*(ico|gif|png|jpe?g|svg)$/i,
        loader: 'image-webpack-loader',
        type: 'asset/resource',
        generator: {
          filename: 'img/[name]~[contenthash:8].[ext]',
        },
        options: {
          mozjpeg: {
            progressive: true,
          },
          // optipng.enabled: false will disable optipng
          optipng: {
            enabled: false,
          },
          pngquant: {
            quality: [0.65, 0.9],
            speed: 4,
          },
          gifsicle: {
            interlaced: false,
          },
          // the webp option will enable WEBP
          webp: {
            quality: 75,
          },
        },
      },
      // Image END
      // Fonts START
      {
        test: /[\\]fonts[\\].*(png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name]~[contenthash:8].[ext]',
        },
      },
      // Fonts END
      // Video START
      {
        test: /[\\]video[\\].*(swf|avi|flv|mpg|rm|mov|3gp|mkv|rmvb|mp4)$/,
        type: 'asset/resource',
        generator: {
          filename: 'video/[name]~[contenthash:8].[ext]',
        },
      },
      // Video END
    ],
  },
  resolve: {
    // Сообщите webpack, в каких каталогах следует искать при разрешении модулей.
    modules: ['node_modules'],
    // alias: {
    //   // mdl: path.resolve(__dirname, 'src/js/modules')
    // },
    // позволяет пользователям не использовать расширение при импорте:
    // import File from '../path/to/file';
    // Базовые настройки
    // extensions: ['.wasm', '.mjs', '.js', '.json'],
    extensions: ['.js', '.json', '.jsx', '.css', '.sass', '.scss', '.html'],
  },
  plugins: [
    new HtmlBundlerPlugin({
      entry: {
        // define templates here
        index: { // => dist/index.html (key is output filename w/o '.html')
          import: 'index.html', // template file
          data: { title: 'Homepage', name: 'Heisenberg' } // pass variables into template
        },
      },
      js: {
        // output filename of extracted JS from source script loaded in HTML via `<script>` tag
        filename: './js/[name].[contenthash:8].js',
      },
      css: {
        // output filename of extracted CSS from source style loaded in HTML via `<link>` tag
        filename: './css/[name].[contenthash:8].css',
      },
    }),
  ],
};
