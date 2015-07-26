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
  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype;
  var toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;
  var nativeKeys = Object.keys,
    nativeIsArray = Array.isArray;

  self.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  self.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) === '[object Array]';
  };

  self.has = function (obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  self.keys = function (obj) {
    if (!self.isObject) {
      return [];
    }
    if (nativeKeys) {
      nativeKeys(obj);
    }
    var keys = [];
    for (var key in obj) {
      if (self.has(obj, key)) {
        keys.push(key);
      }
    }
    return keys;
  };

  self.extend = function (obj, source) {
    if (!source) {
      return obj;
    }
    var keys = self.keys(obj),
      i = keys.length,
      key;
    while (i--) {
      key = keys[i];
      if (source[key] !== undefined) {
        obj[key] = source[key];
      }
    };
    return obj;
  };

  self.each = function (obj, iteratee, context) {
    var i, length;
    if (self.isArray(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee.call(context, obj[i], i, obj);
      }
    }
    else {
      var keys = self.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee.call(context, obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

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
      attr: 'data-lazyload',
      diff: 100,
      autoDestroy: true
    };
    cfgs = utils.extend(defaults, cfgs);
    console.log(utils.each(cfgs, function (val, index) {
      console.log(val, index);
    }));
  }
};

return Lazyload;

});
