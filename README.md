Lazyload
=====
> A lightweight module to LazyLoad elements which are out of current viewPort. 数据延迟加载组件

## Demo & Examples

Live demo: [http://yuanzhaohao.com/lazyload/demo/](http://yuanzhaohao.com/lazyload/demo/)

To build the examples locally, run:

```
npm install
gulp server
```

Then your example([localhost:3000/demo/](localhost:3000/demo/)) will open automatically in browser.

## Usage

#### Normal demo
[live demo](http://yuanzhaohao.com/lazyload/demo/)

[local demo](http://localhost:3000/demo/)

``` javascript
new Lazyload({
  diff: 100, // {Number|Object} Distance outside viewport or specified container to pre load.
  attribute: 'data-lazyload', // {String} The attribute of imgs elements which are of current  viewport.
  autoDestroy: true, // {Boolean} Whether destroy this component when all lazy loaded elements are loaded.
  duration: 300, // {Number} The time of calculating lazyload frequency.
  onStart: null // {Function} called before process lazyload content
});
```

#### autoDestroy demo
[live demo](http://yuanzhaohao.com/lazyload/demo/autoDestroy.html)

[local demo](http://localhost:3000/demo/autoDestroy.html)

``` javascript
var lazy = new Lazyload({
  diff: 0
});
$.ajax({
  url: 'https://api.github.com/users/octocat/gists',
  dataType: 'jsonp',
  success: function (re) {
    if (re && re.data && re.data.length) {
      var h = '',
        h1 = '',
        ajaxEl = $('#ajax'),
        ajaxEl1 = $('#ajax1');
      $.each(re.data, function (key, item) {
        h += '<div><img data-lazyload="' + item.owner['avatar_url'] + '" alt="ajax img" /></div>';
      });
      ajaxEl.append(h);
      lazy.addElements(ajaxEl);
    }
  }
});
```

#### addElements demo
[live demo](http://yuanzhaohao.com/lazyload/demo/)

[local demo](http://localhost:3000/demo/)

``` javascript
var lazy = new Lazyload({
  diff: 0,
  autoDestroy: false
});
$.ajax({
  url: 'https://api.github.com/users/octocat/gists',
  dataType: 'jsonp',
  success: function (re) {
    if (re && re.data && re.data.length) {
      var h = '',
        h1 = '',
        ajaxEl = $('#ajax'),
        ajaxEl1 = $('#ajax1');
      $.each(re.data, function (key, item) {
        h += '<div><img data-lazyload="' + item.owner['avatar_url'] + '" alt="ajax img" /></div>';
        h1 += '<div><img data-lazyload="' + item.owner['avatar_url'] + '" alt="ajax1 img" /></div>';
      });
      ajaxEl.append(h);
      ajaxEl1.append(h1);
      lazy.addElements(ajaxEl);
      setTimeout(function () {
        alert('add ajax1 elements');
        lazy.addElements(ajaxEl1);
      }, 5000);
    }
  }
});
```

#### removeElements demo
[live demo](http://yuanzhaohao.com/lazyload/demo/)

[local demo](http://localhost:3000/demo/)

``` javascript
var lazy = new Lazyload({
  diff: 150
});
lazy.removeElements(document.querySelectorAll('.j_removeElements'));
```

#### addCallback demo
[live demo](http://yuanzhaohao.com/lazyload/demo/)

[local demo](http://localhost:3000/demo/)

``` javascript
var lazy = new Lazyload({
  diff: 150
});
lazy.addCallback(document.querySelector('#addCallback'), function () {
  console.log('call addCallback');
});
```

#### removeCallback demo
``` javascript
var lazy = new Lazyload({
  diff: 150
});
lazy.addCallback(document.querySelector('#addCallback'), function () {
  console.log('call addCallback');
});
lazy.addCallback(document.querySelector('#removeCallback'), function () {
  console.log('call removeCallback');
});
lazy.removeCallback(document.querySelector('#removeCallback'));
```

#### instance demo
``` javascript
var lazy = Lazyload.instance();
$.ajax({
  url: 'https://api.github.com/users/octocat/gists',
  dataType: 'jsonp',
  success: function (re) {
    if (re && re.data && re.data.length) {
      var h = '',
        ajaxEl = $('#J_ajax')
      $.each(re.data, function (key, item) {
        h += '<div><img data-lazyload="' + item.owner['avatar_url'] + '" alt="instance img" /></div>';
      });
      ajaxEl.append(h);
      lazy.addElements(ajaxEl);
    }
  }
});
```
