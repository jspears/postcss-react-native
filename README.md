# PostCSS React Native
[PostCSS](https://github.com/postcss/postcss) plugin to make react native stylesheets

[postcss-react-native](https://github.com/jspears/postcss-react-native)

## Usage

```js
postcss([ require('postcss-react-native') ])
```

See [PostCSS] docs for examples for your environment.

## Watcher Usage
Since most React Native environments do not have a css pipeline
you can use the prn watcher.

`
 $ npm install postcss-react-native
 $ ./node_modules/.bin/prn -d dest -src ./path/to/css

`
## Usage
You should be able to include the said css via regular require

styles/SpecialComponent.css

```css
.name {
  border: 1px solid red;
  margin: 5px;
}

```

SpecialComponent.jsx
```jsx
import React, {Component} from 'react';
import {View} from 'react-native';
import Style from './styles/SpecialComponent.css';

export default class SpecialComponent extends Component {

return <View style={Style.name}>
//your stuff here.
</View>

}

```


