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
  doc = document,
  INDEX = 0,
  noop = function () {};
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

  self.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    self['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  self.isEmpty = function (obj) {
    if (obj == null) {
      return true;
    }
    if (self.isArray(obj) || self.isString(obj)) {
      return obj.length === 0;
    }
    return self.keys(obj).length === 0;
  };

  self.filter = function (obj, predicate, context) {
    var results = [];

    self.each(obj, function (value, index, list) {
      if (predicate.call(context, value, index, list)) {
        results.push(value);
      }
    });
    return results;
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
      duration: 300,
      onStart: null
    };
    self.element = self._getElement(cfgs.element);
    self.attribute = utils.isString(cfgs.attribute) ? cfgs.attribute : defaults.attribute;
    self.diff = cfgs.diff === undefined ? defaults.diff : cfgs.diff;
    self.autoDestroy = cfgs.autoDestroy === undefined ? defaults.autoDestroy : cfgs.autoDestroy;
    self.duration = utils.isNumber(cfgs.duration) && cfgs.duration > 0 ? cfgs.duration : defaults.duration;
    self.onStart = utils.isFunction(cfgs.onStart) ? cfgs.onStart : defaults.onStart;
    self.diff = self._getBoundingRect();

    self._elementIsNotDocument = self.element.nodeType != 9;

    self._callbacks = {};
    self._startLis = [];

    self._initLoadEvent();
    self.addElements(self.element);
    self._loadFn();
    self.resume();
    self._init = null;
  },

  _initLoadEvent: function () {
    var self = this,
      autoDestroy = self.autoDestroy,
      duration = self.duration,
      attribute = self.attribute;

    self.imgHandle = function () {
      var img = this,
        param = {
          elem: img,
          src: img.getAttribute(attribute)
        };
      self.onStart && self.onStart(param);
      if (img.src != param.src) {
        img.src = param.src;
      }
      img.removeAttribute(attribute);
    };

    self._loadFn = utils.buffer(function () {
      if (autoDestroy && utils.isEmpty(self._callbacks)) {
        self.destroy();
      }
      self._loadItems();
    }, duration, self);
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
    else if (utils.isString(el)) {
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

    // if (element == doc) {
    //   var docBoundingReact = doc.documentElement.getBoundingClientRect();
    //   vw = docBoundingReact.width;
    //   vh = docBoundingReact.height;
    // }
    // else {
    //   vw = element.clientWidth;
    //   vh = element.clientHeight;
    // }
    if (!utils.isObject(diff)) {
      diff = {
        top: diff,
        right: diff,
        bottom: diff,
        left: diff
      };
    }

    return diff;

    return {
      top: top - (diff.top || 0),
      right: left + vw + (diff.right || 0),
      bottom: top + vh + (diff.bottom || 0),
      left: left - (diff.left || 0)
    };
  },

  _loadItems: function () {
    var self = this,
      element = self.element;

    if (self._elementIsNotDocument && !element.offsetWidth) {
      return;
    }
    utils.each(self._callbacks, function (callback, key) {
      callback && self._loadItem(key, callback);
    });
  },

  _loadItem: function (key, callback) {
    var self = this,
      callback = callback || self._callbacks[key];

    if (!callback) {
      return true;
    }
    var el = callback.el,
      fn = callback.fn,
      remove = false;
    if (self.__inViewport(el)) {
      try {
        remove = fn.call(el);
      }
      catch (e) {
        setTimeout(function () {
          throw e;
        }, 0);
      }
    }
    if (remove !== false) {
      delete self._callbacks[key];
    }
    return remove;
  },

  __inViewport: function (el) {
    var self = this,
      isDoc = !self._elementIsNotDocument,
      elemOffset = getOffset(el),
      diff = self.diff,
      top, right, bottom, left;

    if (isDoc) {
      var w = win.innerWidth,
        h = win.innerHeight,
        x = win.scrollX,
        y = win.scrollY;

      bottom = h + y <= elemOffset.top - diff.bottom;
      right = w + x <= elemOffset.left - diff.right;
      top = y >= elemOffset.top + el.offsetHeight + diff.top;
      left = x > elemOffset.left + el.offsetWidth + diff.left;
    }

    return !top && !right && !bottom && !left;
  },

  addCallback: function (el, fn) {
    var self = this,
      callbacks = self._callbacks,
      callback = {
        el: el || doc,
        fn: fn || noop
      },
      key = ++INDEX;

    callbacks[key] = callback;
    self._loadItem(key, callback);
    return key;
  },

  addElements: function (els) {
    var self = this,
      attribute = self.attribute;

    if (utils.isString(els)) {
      els = doc.querySelectorAll(els);
    }
    else if (!utils.isArray(els)) {
      els = [els];
    }
    utils.each(els, function (el, key) {
      if (!el) {
        return;
      }
      var imgs = [];
      utils.each(el.querySelectorAll('img'), function (img) {
        imgs.push(img);
      });
      utils.each(utils.filter([el].concat(imgs), function (img) {
        return img.getAttribute && img.getAttribute(attribute);
      }, self), function (img) {
        var key = self.addCallback(img, self.imgHandle);
      });
    });
  },

  resume: function () {
    var self = this,
      load = self._loadFn;

    if (self._destroyed) {
      return;
    }
    win.addEventListener('scroll', load, false);
    win.addEventListener('touchmove', load, false);
    win.addEventListener('resize', load, false);
    if (self._elementIsNotDocument) {
      self.element.addEventListener('scroll', load, false);
      self.element.addEventListener('touchmove', load, false);
    }
  },

  pause: function () {
    var self = this,
      load = self._loadFn;

    if (self._destroyed) {
      return;
    }
    win.removeEventListener('scroll', load, false);
    win.removeEventListener('touchmove', load, false);
    win.removeEventListener('resize', load, false);
    if (self._elementIsNotDocument) {
      self.element.removeEventListener('scroll', load, false);
      self.element.removeEventListener('touchmove', load, false);
    }
  },

  destroy: function () {
    var self = this;

    self.pause();
    self._callbacks = {};
    self._destroyed = 1;
  },

  refresh: function () {

  }
};

return Lazyload;

});
