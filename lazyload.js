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
var win = window,
  doc = document;
var utils = (function (win, doc) {
  var self = {};
  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype,
    FuncProto = Function.prototype;
  var slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;
  var nativeKeys = Object.keys,
    nativeIsArray = Array.isArray;

  self.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  self.isElement = function (obj) {
    return !!(obj && obj.nodeType === 1);
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

  self.buffer = function (fn, ms, context) {
    var self = this;

    ms = ms || 150;
    if (ms === -1) {
      return function () {
        fn.apply(context || null, arguments);
      };
    }
    var bufferTimer = null;
    function f () {
      f.stop();
      bufferTimer = self.later(fn, ms, 0, context || null, arguments);
    }
    f.stop = function () {
      if (bufferTimer) {
        bufferTimer.cancel();
        bufferTimer = 0;
      }
    };
    return f;
  };

  self.later = function (fn, when, periodic, context, data) {
    if (!fn) {
      return;
    }
    var d = slice.call(data);
    when = when || 0;
    if (typeof fn === 'string') {
      fn = context[fn];
    }

    var f = function () {
        fn.apply(context, d);
      },
      r = (periodic) ? setInterval(f, when) : setTimeout(f, when);

    return {
      id: r,
      interval: periodic,
      cancel: function () {
        if (this.interval) {
          clearInterval(r);
        }
        else {
          clearTimeout(r);
        }
      }
    };
  };

  return self;
})(window, document, undefined);

function getOffset (el) {
  var parent = el,
    left = 0,
    top = 0;
  while (parent != null && parent != doc) {
    left += parent.offsetLeft;
    top += parent.offsetTop;
    parent = parent.offsetParent;
  }
  return {
    left: left,
    top: top
  };
}

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
      element: document,
      attribute: 'data-lazyload',
      diff: 100,
      autoDestroy: true,
      duration: 300
    };
    self.element = self._getElement(cfgs.element);
    self.attribute = cfgs.attribute === undefined || typeof cfgs.attribute !== 'string' ? defaults.attribute : cfgs.attribute;
    self.diff = self.diff === undefined ? defaults.diff : cfgs.diff;
    self.autoDestroy = self.autoDestroy === undefined ? defaults.autoDestroy : cfgs.autoDestroy;
    self.diff = self._getBoundingRect();
    self._elementIsNotDocument = self.element.nodeType != 9;
    self._init = null;
  },

  _getElement: function (el) {
    var self = this;

    if (el === win) {
      el = doc;
    }
    if (utils.isElement(el)) {
      if (el.nodeName === 'BODY') {
        el = doc;
      }
    }
    else if (typeof el === 'string') {
      el = doc.querySelector(el);
    }

    return el || doc;
  },

  _getBoundingRect: function () {
    var self = this,
      element = self.element,
      diff = self.diff,
      elemOffset = getOffset(element),
      left = elemOffset.left,
      top = elemOffset.top,
      vh, vw;

    if (element == doc) {
      var docBoundingReact = doc.documentElement.getBoundingClientRect();
      vw = docBoundingReact.width;
      vh = docBoundingReact.height;
    }
    else {
      vw = element.clientWidth;
      vh = element.clientHeight;
    }
    console.log(vh);
    if (!utils.isObject(diff)) {
      diff = {
        top: diff,
        right: diff,
        bottom: diff,
        left: diff
      };
    }

    return {
      top: top - (diff.top || 0),
      right: left + vw + (diff.right || 0),
      bottom: top + vh + (diff.bottom || 0),
      left: left - (diff.left || 0)
    };
  },

  resume: function () {

  },

  pause: function () {

  },

  refresh: function () {
    
  }
};

return Lazyload;

});
