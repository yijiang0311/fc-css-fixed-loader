const loaderUtils = require('loader-utils');
const css = require('css');

module.exports = function (source) {
  let options = loaderUtils.getOptions(this) || {};
  const maxWidth = options.maxWidth || '640px';
  const ast = css.parse(source);
  let rules = ast.stylesheet.rules;

  /**
   * 匹配所有的rule找到position:fixed;并添加样式
   * @param {Array} rules 数组
   */
  const handleFixedInRules = (rules) => {
    for (let rule of rules) {
      if (rule.type === 'media') {
        handleFixedInRules(rule.rules);
      }
      if (rule.type !== 'rule') {
        continue;
      }
      let declarations = rule.declarations;
      if (Object.prototype.toString.call(declarations) !== '[object Array]') {
        continue;
      }
      let isFixed = false;
      for (let declaration of declarations) {
        if (
          declaration.property === 'position' &&
          declaration.value === 'fixed'
        ) {
          isFixed = true;
          break;
        }
      }
      if (isFixed) {
        let maxWidthDeclaration = JSON.parse(JSON.stringify(declarations[0]));
        maxWidthDeclaration.type = 'declaration';
        maxWidthDeclaration.property = 'max-width';
        maxWidthDeclaration.value = `${maxWidth} !important`;
        declarations.push(maxWidthDeclaration);

        //增加媒体查询  @media screen and (min-width: 640px) {}
        //在当前找到fixed定位的选择器外面包裹一层 @media查询，这样不影响手机端的样式
        let newRule = JSON.parse(JSON.stringify(rule));
        newRule.type = 'media';
        newRule.declarations = undefined;
        newRule.selectors = undefined;
        newRule.media = `screen and (min-width: ${maxWidth})`;
        newRule.rules = [];
        //构造 margin-left,margin-right 插入的 @media 中
        const tempDeclarations = [
          {
            type: 'declaration',
            property: 'margin-left',
            value: `calc((100% - ${maxWidth})/2) !important`,
          },
          {
            type: 'declaration',
            property: 'margin-right',
            value: `calc((100% - ${maxWidth})/2) !important`,
          },
        ];
        const obj = {
          selectors: rule.selectors,
          type: 'rule',
          declarations: tempDeclarations,
        };
        newRule.rules.push(obj);
        rules.push(newRule);
      }
    }
  };

  let cssStr;
  try {
    handleFixedInRules(rules);
    cssStr = css.stringify(ast);
  } catch (error) {
    console.log('error from fc-css-fixed-loader:');
    console.log(error);
  }

  return cssStr;
};
