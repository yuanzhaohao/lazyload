/**
 * @name: lazyload
 * @description: A lightweight module to LazyLoad elements which are out of current viewPort. 数据延迟加载组件
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

  self.now = Date.now || function() {
    return new Date().getTime();
  };

  self.later = function (fn, ms, context, data) {
    var d = slice.call(data),
      f = function () {
        fn.apply(context, data);
      },
      r = setTimeout(f, ms);

    return {
      id: r,
      cancel: function () {
        clearTimeout(r);
      }
    };
  }

  self.buffer = function (fn, ms, context) {
    var timer = null;

    ms = ms || 150;
    if (self.isString(fn)) {
      fn = context[fn];
    }
    function run () {
      run.stop();
      timer = self.later(fn, ms, context, arguments);
    }
    run.stop = function () {
      if (timer) {
        timer.cancel();
        timer = 0;
      }
    };
    return run;
  };

  self.throttle = function (fn, ms, context) {
    var lastStart = 0,
      lastEnd = 0,
      timer = null;

    ms = ms || 150;
    if (self.isString(fn)) {
      fn = context[fn];
    }
    function run () {
      run.stop();
      lastStart = self.now();
      fn.apply(context || this, arguments);
      lastEnd = self.now();
    }
    run.stop = function () {
      if (timer) {
        timer.cancel();
        timer = 0;
      }
    };
    return function () {
      if (!lastStart
        || lastEnd >= lastStart && self.now() - lastEnd > ms
        || lastEnd < lastStart && S.now() - lastStart > ms * 8
      ) {
        run();
      }
      else {
        if (timer) {
          timer.cancel();
        }
        timer = self.later(run, ms, context, arguments);
      }
    };
  };

  function createIndexOfFinder(dir) {
    return function(array, item, idx) {
      idx = idx || 0;
      var i = 0,
        length = array.length;
      if (dir > 0) {
        i = idx >= 0 ? idx : Math.max(idx + length, i);
      }
      else {
        length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) {
          return idx;
        }
      }
      return -1;
    };
  }

  self.indexOf = createIndexOfFinder(1);
  self.lastIndexOf = createIndexOfFinder(-1);

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

function runAsyncQueue (queue, event, callback) {
  var i = queue.length;

  function run() {
    i ? queue[--i].call(null, event, run) : callback(event);
  }

  run();
}
/**
 * A lightweight module to LazyLoad elements which are out of current viewport. 数据延迟加载组件
 * @param: [attribute] {String} The attribute of imgs elements which are of current  viewport.
 * @param: [diff] {Number|Object} Distance outside viewport or specified container to pre load.
 * @param: [autoDestroy] {Boolean} Whether destroy this component when all lazy loaded elements are loaded.
 * @param: [duration] {Number} The time of calculating lazyload frequency.
 * @param: [onStart] {Function} called before process lazyload content.
 */
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
      attribute: 'data-lazyload',
      diff: 100,
      autoDestroy: true,
      duration: 300,
      onStart: null
    };
    self.element = document;
    self.attribute = utils.isString(cfgs.attribute) ? cfgs.attribute : defaults.attribute;
    self.diff = cfgs.diff === undefined ? defaults.diff : cfgs.diff;
    self.diff = self._getBoundingRect();
    self.autoDestroy = cfgs.autoDestroy === undefined ? defaults.autoDestroy : cfgs.autoDestroy;
    self.duration = utils.isNumber(cfgs.duration) && cfgs.duration > 0 ? cfgs.duration : defaults.duration;
    self.onStart = utils.isFunction(cfgs.onStart) ? cfgs.onStart : defaults.onStart;

    self._callbacks = {};
    self._startListeners = [];
    self._initLoadEvent();
    self.addElements(self.element);
    self._loadFn();
    self.resume();
    self._init = null;
  },
  /**
   * 获取diff
   * @private
   */
  _getBoundingRect: function () {
    var self = this,
      diff = self.diff;

    if (!utils.isObject(diff)) {
      diff = {
        top: diff,
        right: diff,
        bottom: diff,
        left: diff
      };
    }
    return diff;
  },
  /**
   * attach scroll/resize event
   * @private
   */
  _initLoadEvent: function () {
    var self = this,
      autoDestroy = self.autoDestroy,
      duration = self.duration,
      attribute = self.attribute;

    self.addStartListener(function (event, callback) {
      self.onStart && self.onStart.apply(this, arguments);
      callback && callback();
    });

    self.imgHandle = function () {
      var img = this,
        params = {
          type: 'img',
          elem: img,
          src: img.getAttribute(attribute)
        };
      runAsyncQueue(self._startListeners, params, function (event) {
        if (event.src && img.src != event.src) {
          img.src = event.src;
        }
        img.removeAttribute(attribute);
      });

    };

    self._loadFn = utils.throttle(function () {
      if (autoDestroy && utils.isEmpty(self._callbacks)) {
        self.destroy();
      }
      self._loadItems();
    }, duration, self);
  },
  /**
   * 执行lazyload元素回调
   * @private
   */
  _loadItems: function () {
    var self = this,
      callbacks = self._callbacks;

    utils.each(callbacks, function (callback, key) {
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
  /**
   * 检查元素是否在视窗内
   * @param: [el] {DOM element}
   */
  __inViewport: function (el) {
    var self = this,
      elemOffset = getOffset(el),
      diff = self.diff,
      w = win.innerWidth,
      h = win.innerHeight,
      x = win.scrollX,
      y = win.scrollY;

    return !(h + y <= elemOffset.top - diff.bottom)
      && !(w + x <= elemOffset.left - diff.right)
      && !(y >= elemOffset.top + el.offsetHeight + diff.top)
      && !(x > elemOffset.left + el.offsetWidth + diff.left);
  },
  /**
   * 继续监控lazyload元素
   */
  resume: function () {
    var self = this,
      load = self._loadFn;

    if (self._destroyed) {
      return;
    }
    win.addEventListener('scroll', load, false);
    win.addEventListener('touchmove', load, false);
    win.addEventListener('resize', load, false);
  },
  /**
   * 停止监控lazyload元素
   */
  pause: function () {
    var self = this,
      load = self._loadFn;

    if (self._destroyed) {
      return;
    }
    win.removeEventListener('scroll', load, false);
    win.removeEventListener('touchmove', load, false);
    win.removeEventListener('resize', load, false);
  },
  /**
   * 停止监控并销毁组件
   */
  destroy: function () {
    var self = this;

    self.pause();
    self._callbacks = {};
    self._destroyed = 1;
  },
  /**
   * 强制立刻检测lazyload元素
   */
  refresh: function () {
    this._loadFn();
  },
  /**
   * 添加回调函数, 当el即将出现在视窗中时, 触发fn
   * @param: [el] {DOM element}
   * @param: [fn] {Function} 回调函数
   */
  addCallback: function (el, fn) {
    if (!utils.isElement(el)) {
      return;
    }
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
  /**
   * 添加回调函数
   * @param: [el] {DOM element}
   * @param: [fn] {Function} 回调函数
   */
  removeCallback: function (el, fn) {
    if (!utils.isElement(el)) {
      return;
    }
    var self = this,
      callbacks = self._callbacks;

    utils.each(callbacks, function (callback, key) {
      if (el == callback.el && (fn ? fn == callback.fn : 1)) {
        delete callbacks[key];
      }
    });
  },
  /**
   * 增加回调lazyload元素到lazyload列表
   * @param: [els] {String|DOM element|Array element}
   */
  addElements: function (els) {
    var self = this,
      attribute = self.attribute;

    if (utils.isString(els)) {
      els = doc.querySelectorAll(els);
    }
    else if (!utils.isArray(els) && els.length) {
      els = utils.filter(els, function (el) {
        return el;
      });
    }
    else if (!utils.isArray(els)) {
      els = [els];
    }
    utils.each(els, function (el, key) {
      if (!el) {
        return;
      }
      var imgs = utils.filter(el.querySelectorAll('img'), function (img) {
        return img;
      });
      utils.each(utils.filter([el].concat(imgs), function (img) {
        return img.getAttribute && img.getAttribute(attribute);
      }, self), function (img) {
        var key = self.addCallback(img, self.imgHandle);
      });
    });
  },
  /**
   * 从lazyload列表里移除回调lazyload元素
   * @param: [els] {String|DOM element|Array element}
   */
  removeElements: function (els) {
    var self = this,
      attribute = self.attribute,
      callbacks = self._callbacks;

    if (utils.isString(els)) {
      els = doc.querySelectorAll(els);
    }
    else if (!utils.isArray(els) && els.length) {
      els = utils.filter(els, function (el) {
        return el;
      });
    }
    else if (!utils.isArray(els)) {
      els = [els];
    }
    utils.each(callbacks, function (callback, key) {
      if (utils.indexOf(els, callback.el) !== -1) {
        delete callbacks[key];
      }
    });
  },
  /**
   * 获取lazyload元素
   */
  getElements: function () {
    var self = this,
      els = [],
      callbacks = self._callbacks;

    utils.each(callbacks, function (callback, key) {
      callback.el && els.push(callback.el);
    });
    return els;
  },

  addStartListener: function (lis) {
    var self = this,
      listners = self._startListeners,
      onStart = self.onStart;

    if (!lis || utils.indexOf(listners, lis) != -1) {
      return;
    }
    listners.push(lis);
  }
};

var defIns;
Lazyload.instance = function() {
  return defIns || (defIns = new Lazyload({
    autoDestroy: false
  }));
};

return Lazyload;

});
