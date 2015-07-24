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

var utils = (function (win, doc) {
  var self = {};

  return self;
})(window, document, undefined);

function Lazyload (cfgs) {
  return this instanceof Lazyload
    ? this._init.call(this, cfgs)
    : new Lazyload(cfgs);
}

Lazyload.prototype = {
  constructor: Lazyload,

  _init: function (cfgs) {
    var self = this;
    var defaults = {
      container: document,
      imgAttr: 'data-lazyload',
      diff: 100
    };

  }
};

return Lazyload;

});
