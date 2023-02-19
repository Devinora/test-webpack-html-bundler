const HtmlWebpackPlugin = require('html-webpack-plugin');

class SortStylesChunks {
  apply(compiler) {
    compiler.hooks.compilation.tap('SortChunks', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
        'SortStylesChunks',
        (data, callback) => {
          data.assetTags.styles = data.assetTags.styles.reverse();
          callback(null, data);
        }
      );
    });
  }
}

module.exports = SortStylesChunks;
