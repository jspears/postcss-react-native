# PostCSS Opacity [![Build Status](https://travis-ci.org/iamvdo/postcss-opacity.svg)](https://travis-ci.org/iamvdo/postcss-opacity)

[PostCSS] plugin to add opacity filter for IE8.

[PostCSS]: https://github.com/postcss/postcss

```css
/* Input example */
.foo {
  opacity: .5;
}
```

```css
/* Output example */
.foo {
  opacity: .5;
  -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
}
```

## Usage

```js
postcss([ require('postcss-opacity') ])
```

See [PostCSS] docs for examples for your environment.
