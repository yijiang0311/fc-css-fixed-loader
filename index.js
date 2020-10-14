const loaderUtils = require('loader-utils');
const css = require('css');
const chalk = require('chalk');

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
      // 给body,html添加样式
      const selectors = rule.selectors || [];
      const bodyOrHtml =
        selectors.length === 1 &&
        (selectors[0] === 'body' || selectors[0] === 'html');
      const bodyAndHtml =
        selectors.length === 2 &&
        selectors.indexOf('html') >= 0 &&
        selectors.indexOf('body') >= 0;
      if (bodyAndHtml || bodyOrHtml) {
        const maxWidthDec = {
          property: 'max-width',
          type: 'declaration',
          value: `${maxWidth}`,
        };
        const marginDec = {
          property: 'margin',
          type: 'declaration',
          value: '0 auto',
        };
        rule.declarations.push(maxWidthDec, marginDec);
      }
      //给有position:fixed的元素,添加样式
      let isFixed = false;
      let fixedLeft = null;
      let fixedRight = null;
      for (let declaration of declarations) {
        if (
          declaration.property === 'position' &&
          declaration.value === 'fixed'
        ) {
          isFixed = true;
        } else if (declaration.property === 'left') {
          fixedLeft = declaration.value;
        } else if (declaration.property === 'right') {
          fixedRight = declaration.value;
        }
      }
      if (isFixed) {
        let maxWidthDeclaration = JSON.parse(JSON.stringify(declarations[0]));
        maxWidthDeclaration.type = 'declaration';
        maxWidthDeclaration.property = 'max-width';
        maxWidthDeclaration.value = `${maxWidth} !important`;
        declarations.push(maxWidthDeclaration);

        const addMedia = function (screenWidth) {
          //增加媒体查询  @media screen and (min-width: 640px) {}
          //在当前找到fixed定位的选择器外面包裹一层 @media查询，这样不影响手机端的样式
          let newRule = JSON.parse(JSON.stringify(rule));
          newRule.type = 'media';
          newRule.declarations = undefined;
          newRule.selectors = undefined;
          newRule.media = `screen and (min-width: ${maxWidth})`;
          if (screenWidth) {
            newRule.media += ` and (max-width: ${screenWidth})`;
          }
          newRule.rules = [];
          // let leftDeclaration;
          let tempDeclarations = [];
          //构造 left,right 插入的 @media 中
          // 没有找到left,right 定位
          if (!fixedLeft && !fixedRight) {
            tempDeclarations = [
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
          }
          if (fixedLeft) {
            let declaration;
            // left 用百分比%定位，比如 left:30%
            if (fixedLeft.endsWith('%')) {
              const rate =
                (Number(fixedLeft.slice(0, -1)) / 100) *
                  Number(maxWidth.slice(0, -2)) +
                'px';
              declaration = {
                type: 'declaration',
                property: 'left',
                value: `calc((100% - ${maxWidth})/2 + ${rate}) !important`,
              };
            } else if (fixedLeft.endsWith('px')) {
              // left 没有用px定位，比如 left:100px
              // 给个默认 1200px 用于 【 left,right 一个用%百分比 一个用 具体px的情况】
              const screenWidthValue = screenWidth
                ? Number(screenWidth.slice(0, -2))
                : 1200;
              const rate =
                (Number(fixedLeft.slice(0, -2)) / screenWidthValue) *
                  Number(maxWidth.slice(0, -2)) +
                'px';
              declaration = {
                type: 'declaration',
                property: 'left',
                value: `calc((100% - ${maxWidth})/2 + ${rate}) !important`,
              };
            } else {
              declaration = {
                type: 'declaration',
                property: 'left',
                value: `calc((100% - ${maxWidth})/2) !important`,
              };
            }
            tempDeclarations.push(declaration);
          }

          if (fixedRight) {
            let declaration;
            // right 用百分比%定位，比如 right:30%
            if (fixedRight.endsWith('%')) {
              const rate =
                (Number(fixedRight.slice(0, -1)) / 100) *
                  Number(maxWidth.slice(0, -2)) +
                'px';
              declaration = {
                type: 'declaration',
                property: 'right',
                value: `calc((100% - ${maxWidth})/2 + ${rate}) !important`,
              };
            } else if (fixedRight.endsWith('px')) {
              // right 没有用px定位，比如 right:100px
              // 给个默认 1200px 用于 【 left,right 一个用%百分比 一个用 具体px的情况】
              const screenWidthValue = screenWidth
                ? Number(screenWidth.slice(0, -2))
                : 1200;
              const rate =
                (Number(fixedRight.slice(0, -2)) / screenWidthValue) *
                  Number(maxWidth.slice(0, -2)) +
                'px';
              declaration = {
                type: 'declaration',
                property: 'right',
                value: `calc((100% - ${maxWidth})/2 + ${rate}) !important`,
              };
            } else {
              declaration = {
                type: 'declaration',
                property: 'right',
                value: `calc((100% - ${maxWidth})/2) !important`,
              };
            }
            tempDeclarations.push(declaration);
          }

          const obj = {
            selectors: rule.selectors,
            type: 'rule',
            declarations: tempDeclarations,
          };
          newRule.rules.push(obj);
          rules.push(newRule);
        };

        // 如果left,right使用% 百分比定位的就能准确定位，不用多个媒体查询来
        // 不考虑 left,right 一个用%百分比 一个用 具体px的情况，这种情况统一按屏幕宽度 1200px来看
        if (!fixedLeft && !fixedRight) {
          //如果left,right 都没有定位，则也只做默认处理
          addMedia();
        } else if (
          (fixedLeft && fixedLeft.endsWith('%')) ||
          (fixedRight && fixedRight.endsWith('%'))
        ) {
          addMedia();
        } else {
          // 如果left,right 用非百分比%来定位，比如px
          // 这种情况没办法按照原来的比例精确定位，因为拿不到屏幕的宽度，【虽然能拿到但是css算不出maxWidth相对于屏幕的宽度比例】
          // 所以通过媒体查询来大概定位
          const maxWidthValue = Number(maxWidth.slice(0, -2));
          addMedia(`${maxWidthValue * 2}px`);
          addMedia(`${maxWidthValue * 3}px`);
          addMedia(`${maxWidthValue * 4}px`);
          addMedia(`${maxWidthValue * 5}px`);
        }
      }
    }
  };

  let cssStr;
  try {
    handleFixedInRules(rules);
    cssStr = css.stringify(ast);
  } catch (error) {
    console.log(chalk.red('error from fc-css-fixed-loader:'));
    console.log(chalk.red(error));
    cssStr = source;
  }

  return cssStr;
};
