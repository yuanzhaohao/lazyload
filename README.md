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

#### normal demo

``` javascript
new Lazyload({
  diff: 100, // {Number|Object} Distance outside viewport or specified container to pre load.
  attribute: 'data-lazyload', // {String} The attribute of imgs elements which are of current  viewport.
  autoDestroy: true, // {Boolean} Whether destroy this component when all lazy loaded elements are loaded.
  duration: 300, // {Number} The time of calculating lazyload frequency.
  onStart: null // {Function} called before process lazyload content
});
```
