/**
 * @name: lazyload
 * @description: 数据延迟加载组件
 * @author: yuanzhaohao
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  }
  else if (typeof exports === 'object') {
    module.exports = factory();
  }
  else {
    root.Lazyload = factory();
  }
})(this, function () {

  function Lazyload () {

  }

  return Lazyload;
});
