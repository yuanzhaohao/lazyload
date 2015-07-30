Lazyload - a lightweight module to lazy load data 数据延迟加载组件
=====

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
  diff: 100,
  attribute: 'data-lazyload',
  autoDestroy: true,
  duration: 300,
  onStart: null
});
```
