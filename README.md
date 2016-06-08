# PostCSS React Native
[PostCSS](https://github.com/postcss/postcss) plugin to make react native stylesheets

[postcss-react-native](https://github.com/jspears/postcss-react-native)

***IN DEVELOPMENT***
Currently a proof of concept.  It roughly based on  [react-native-css](https://github.com/sabeurthabti/react-native-css)
although it shares no code.

##Capablities
 - [x] Recalculate stylesheet based on media queries and current dimensions.
 - [x] -ios,-android vendor prefixes.
 - [x] Supports px, vh, vw,in, pt,em,pc,vmin,vax units.
 - [x] handles border shorthand.
 - [x] handles margin shorthand.
 - [x] supports checked pseudo selector.
 - [x] handles most font properties.
 - [x] Transitions - (In progress)
 - [x] Imports
 - [ ] Implement content, before and after pseudo's.
 - [ ] Nested selectors (partial support)
 - [ ] Percentage units.
 - [ ] Nice import from. I.E import from styles rather than dist.
 - [ ] filter properties not supported by react-native.  Tricky, because it is component dependent.
 - [ ] Support regular react (currently only react-native).
 - [ ] Support background images.

## Usage

```js
postcss([ require('postcss-react-native') ])
```

See [PostCSS] docs for examples for your environment.

## Watcher Usage
Since most React Native environments do not have a css pipeline
you can use the prn watcher.

```sh
 $ npm install postcss-react-native
 $ ./node_modules/.bin/prn -d dist -w ./style

```

## Usage
You should be able to include the said css via regular require

styles/SpecialComponent.css

```css
.name {
  border: 1px solid red;
  margin: 5px;
}

```

Write your css using namespaces to import component.
EX: ./styles/component.css
```css
@namespace Native "react-native.View";
@namespace Text "react-native.Text";

Text|StyledText {
    color: red;
    background-color: yellow;
}

.name {
  border: 1px solid red;
  margin: 5px;
}


```

Then import your component.

```jsx
import React, {Component} from 'react';
import {View} from 'react-native';
import styles, {StyledText} from './dist/component.css';

export default class App extends Component {

return <View style={styles.name}>
   <StyledText>Your Text Here</StyledText>
//your stuff here.
</View>

}

```


