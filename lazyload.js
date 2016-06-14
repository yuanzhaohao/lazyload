/**
 * @name: lazyload
 * @description: A lightweight module to LazyLoad elements which are out of current viewPort. 数据延迟加载组件
 * @author: yuanzhaohao
 */
'use strict';

(function (root, factory) {
  'use strict';
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
  var win = window;
  var doc = document;
  var INDEX = 0;
  var noop = function () {};
  var utils = (function () {
    var self = {};
    var ObjProto = Object.prototype;
    var toString = ObjProto.toString;
    var hasOwnProperty = ObjProto.hasOwnProperty;
    var nativeKeys = Object.keys;
    var nativeIsArray = Array.isArray;

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
      return obj !== null && hasOwnProperty.call(obj, key);
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
      }
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
      if (obj === null) {
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
      var f = function () {
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
          || lastEnd < lastStart && self.now() - lastStart > ms * 8
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

    self.isCross = function(r1, r2) {
      var r = {};
      r.top = Math.max(r1.top, r2.top);
      r.bottom = Math.min(r1.bottom, r2.bottom);
      r.left = Math.max(r1.left, r2.left);
      r.right = Math.min(r1.right, r2.right);
      return r.bottom >= r.top && r.right >= r.left;
    };

    self.scrollLeft = function() {
      return (win.pageYOffset || 0) * 1 + (doc.documentElement.scrollLeft || 0) * 1 + (doc.body.scrollLeft || 0) * 1;
    }

    self.scrollTop = function() {
      return (win.pageXOffset || 0) * 1 + (doc.documentElement.scrollTop || 0) * 1 + (doc.body.scrollTop || 0) * 1;
    }

    self.outerWidth = function(el) {
      if (el.nodeType === 9) {
        return Math.max(
          document.documentElement.scrollWidth || 0,
          win.innerWidth
        );
      }

      var val = el.offsetWidth;

      if (val > 0) {
        return val;
      }
    }

    self.outerHeight = function(el) {
      if (el.nodeType === 9) {
        return Math.max(
          document.documentElement.scrollHeight || 0,
          win.innerHeight
        );
      }

      var val = el.offsetHeight;

      if (val > 0) {
        return val;
      }
    }

    self.addClass = function(el, cls) {
      var oldCls = el.className;
      var blank = (oldCls !== '') ? ' ' : '';
      var newCls = oldCls + blank + cls;
      el.className = newCls;
    }

    self.removeClass = function(el, cls) {
      var oldCls = ' ' + el.className + ' ';
      oldCls = oldCls.replace(/(\s+)/gi, ' ');
      var removed = oldCls.replace(' ' + cls + ' ', ' ');
      removed = removed.replace(/(^\s+)|(\s+$)/g, '');
      el.className = removed;
    }

    self.hasClass = function(el, cls) {
      var oldCls = el.className.split(/\s+/);
      var i = oldCls.length;

      while(i--) {
        if (oldCls[i] === cls) {
          return true;
        }
      }
      return false;
    }

    return self;
  })(window, document, undefined);

  function offset(el) {
    var x = utils.scrollLeft();
    var y = utils.scrollTop();
    if (el.getBoundingClientRect) {
      var box = el.getBoundingClientRect();
      var doc = document;
      var body = doc.body;
      var docElem = doc && doc.documentElement;
      x += box.left - (docElem.clientLeft || body.clientLeft || 0);
      y += box.top - (docElem.clientTop || body.clientTop || 0);
    }
    return {
      left: x,
      top: y
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
        lazyCls: 'lib-lazyload',
        diff: 100,
        autoDestroy: true,
        duration: 300,
        onStart: null
      };
      self.element = document;
      self.attribute = utils.isString(cfgs.attribute) ? cfgs.attribute : defaults.attribute;
      self.lazyCls = utils.isString(cfgs.lazyCls) ? cfgs.lazyCls : defaults.lazyCls;
      self.diff = cfgs.diff === undefined ? defaults.diff : cfgs.diff;
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
    set: function(key, val) {
      var self = this;
      if (utils.isString(key) && val) {
        self[key] = val;
        if (key === 'diff' && !utils.isObject(val)) {
          self.diff = {
            top: val,
            right: val,
            bottom: val,
            left: val
          };
        }
      }
    },
    /**
     * 获取diff
     * @private
     */
    _getBoundingRect: function(el) {
      var diff = this.diff;
      var vh;
      var vw;
      var left;
      var top;

      if (el !== undefined) {
        vh = utils.outerWidth(el);
        vw = utils.outerHeight(el);
        var elemOffset = offset(el);
        left = elemOffset.left;
        top = elemOffset.top;
      }
      else {
        vh = win.innerHeight;
        vw = win.innerWidth;
        left = utils.scrollLeft();
        top = utils.scrollTop();
      }

      if (!utils.isObject(diff)) {
        diff = {
          top: diff,
          right: diff,
          bottom: diff,
          left: diff
        };
      }

      return {
        left: left - (diff.left || 0),
        top: top - (diff.top || 0),
        right: left + vw + (diff.right || 0),
        bottom: top + vh + (diff.bottom || 0)
      };
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
        var el = this;
        var params = {
          type: 'img',
          elem: el,
          src: el.getAttribute(attribute)
        };
        runAsyncQueue(self._startListeners, params, function (event) {
          el.removeAttribute(attribute);
          utils.removeClass(el, self.lazyCls);
          if (event.src && el.src !== event.src) {
            if (el.tagName === 'IMG') {
              el.setAttribute('src', event.src);
            }
            else {
              el.style.backgroundImage = 'url(' + event.src + ')';
            }
          }
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
      var self = this;
      callback = callback || self._callbacks[key];

      if (!callback) {
        return true;
      }
      var el = callback.el,
        fn = callback.fn,
        remove = false;
      if (self.__elementInViewport(el)) {
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
    __elementInViewport: function(el) {
      var self = this;
      if (!el.offsetWidth && !el.offsetHeight) {
        return false;
      }
      var diff = self.diff;
      var windowRegion = self._getBoundingRect();
      var elOffset = offset(el);
      var elRegion = {
        left: elOffset.left,
        top: elOffset.top,
        right: elOffset.left + el.offsetHeight,
        bottom: elOffset.top + el.offsetWidth
      };
      var inWin = utils.isCross(windowRegion, elRegion);
      return inWin;
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
        if (el === callback.el && (fn ? fn === callback.fn : 1)) {
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
      utils.each(els, function (el) {
        if (!el) {
          return;
        }
        var imgs = utils.filter(el.querySelectorAll('.' + self.lazyCls), function (img) {
          return img;
        });
        utils.each(utils.filter([el].concat(imgs), function (img) {
          return img.getAttribute && img.getAttribute(attribute);
        }, self), function (img) {
          self.addCallback(img, self.imgHandle);
        });
      });
    },
    /**
     * 从lazyload列表里移除回调lazyload元素
     * @param: [els] {String|DOM element|Array element}
     */
    removeElements: function (els) {
      var self = this,
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

      utils.each(callbacks, function (callback) {
        callback.el && els.push(callback.el);
      });
      return els;
    },

    addStartListener: function (lis) {
      var self = this,
        listners = self._startListeners;

      if (!lis || utils.indexOf(listners, lis) !== -1) {
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
