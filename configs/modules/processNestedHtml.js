const fs = require('fs');
const path = require('path');

// Пример
// <include src="./path-to-root-html.html"/>
// <include src="path-to-html.html"/>
function processNestedHtml(content, loaderContext, resourcePath = '') {
  let fileDir = resourcePath === ''
    ? path.dirname(loaderContext.resourcePath)
    : path.dirname(resourcePath);
  const INCLUDE_PATTERN = /\<include src=\"(\.\/)?(.+)\"\/?\>(?:\<\/include\>)?/gi;

  function replaceHtml(match, pathRule, src) {
    if (pathRule === './') {
      fileDir = loaderContext.context;
    }
    const filePath = path.resolve(fileDir, src);
    loaderContext.dependency(filePath);
    const html = fs.readFileSync(filePath, 'utf8');
    return processNestedHtml(html, loaderContext, filePath);
  }

  if (!INCLUDE_PATTERN.test(content)) {
    return content;
  }
  return content.replace(INCLUDE_PATTERN, replaceHtml);
}

function processHtmlLoader(content, loaderContext) {
  const newContent = processNestedHtml(content, loaderContext);
  return newContent;
}

module.exports = processHtmlLoader;
