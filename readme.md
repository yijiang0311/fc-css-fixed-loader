<!--
 * @Author: zhongyi
 * @Date: 2020-09-12 12:02:57
 * @LastEditTime: 2020-09-13 19:38:33
-->

### 这是一个 webpack loader for css

#### 说明

1. PC 端浏览移动端`H5`页面，展示手机端的效果，也就是设定一个最大宽度（比如：`640px`），然后居中显示
2. 当`html`设置了`max-width:640px`后，还需要考虑`position:fixed`布局，这种脱离文档流的布局会根据整个浏览器的宽带来进行定位，所以`html`的`max-width`对其无效
3. 考虑用这个`loader` 实现一个功能来处理所有的`position:fixed`的样式，（特别是第三方的 UI 库比如`vant`，有很多弹出层都是用fixed定位，it's too much like hard work to - 手动修改其样式）

#### 功能描述

1. 当匹配到`position:fixed`的选择器后给该目标 css 选择器（比如：`.van-popup`）加上`max-width`
2. 考虑到挂载目标 css 选择器的 dom 元素还可能在其他 css 选择器中定义一些样式（比如：`top:0;left:0;width:30%;`）,
3. 这个时候使用 `margin: 0 auto;` 就达不到居中的效果，还有可能影响在手机端的样式
4. 此时就要考虑在目标 css 选择器外层包裹一层`media`查询，比如：`@media screen and (min-width: 640px) {.van-popup{**要添加的样式**}}`
5. 这样在不影响移动端样式的情况下就可以给目标 css 选择器加上样式了
6. 最终采用了`margin-left:calc((100% - ${maxWidth})/2) !important;margin-right:calc((100% - ${maxWidth})/2) !important` 兼容性效果最好

#### 关于怎么匹配目标 CSS 选择器（`.van-popup`）以及添加样式

1. 你可能会想到通到正则匹配来定位目标 css 选择器，然后操作文本字符串
2. 这种方式比较暴力，灵活性不够好，面对一些特殊情况很可能会出错
3. 最好的方法应该是利用 AST，也是本 loader 采用的方法

#### 使用

不会影响移动端样式，可以放心使用

```
# 安装
$ npm i -D fc-css-fixed-loader

# 使用【如果是匹配.css则执行顺序为放在css-loader前面】
# 使用【如果是匹配.scss则执行顺序为放在sass-loader后面,css-loader前面。（.less类似）】

比如:
{
  test: /\.less$/,
  use: [
    {
      loader: 'style-loader'
    },
    {
      loader: 'css-loader'
    },
    {
      loader: 'css-fixed-loader',
      options: {
        maxWidth: '640px' //默认640px,可不传
      }
    },
    {
      loader: 'less-loader'
    }
}

```
