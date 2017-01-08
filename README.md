# PostCSS React Native
[PostCSS](https://github.com/postcss/postcss) plugin to make react native stylesheets

This is kind of a CSS to JSX transpiler.   It can be used like a CSS module, but it can
also be used to define/extend components in CSS to add transition, animation and styling
attributes.



[postcss-react-native](https://github.com/jspears/postcss-react-native)

***IN DEVELOPMENT***
Currently a proof of concept.  It roughly based on  [react-native-css](https://github.com/sabeurthabti/react-native-css)
although it shares no code.

[![Screen Cast](https://github.com/jspears/postcss-react-native/blob/master/ScreenShot.png)](https://github.com/jspears/PostcssReactNativeDemo/raw/master/ReactNativeCSS.mov)



##Capablities
 - [x] Recalculate stylesheet based on media queries and current dimensions.
 - [x] -ios,-android vendor prefixes.
 - [x] Supports px, vh, vw,in, pt,em,pc,vmin,vax units.
 - [x] handles border shorthand.
 - [x] handles margin shorthand.
 - [x] supports checked pseudo selector.
 - [x] handles most font properties.
 - [x] Transitions
 - [x] Animations
 - [x] Imports
 - [x] Percentage units.
 - [ ] Nice import from. I.E import from styles rather than dist.
 - [ ] filter properties not supported by react-native.  Tricky, because it is component dependent.
 - [ ] Support regular react (currently only react-native).
 - [ ] Implement content, before and after pseudo's.
 - [ ] Nested selectors (partial support)
 - [ ] Support props selectors View[color="green"] {}.
 - [ ] Support background images, via Image with children.

## Usage

```js
postcss([ require('postcss-react-native') ])
```

See the [PostCSS docs](https://github.com/postcss/postcss#usage) for examples for your environment.

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

###Transition Example

Suppose you have transition.css.

```css
/* @namespace imports a component to extend */
@namespace Text "react-native.Text";

/*This will export a component named FadeIn, that extends Text*/
Text|FadeIn {
    height: 20px;
    width: 100px;

    border-radius: 10px;
    text-align: center;
    opacity: .5;
    transform: translateX(0);
    background-color: darkgreen;
    color: darkorange;
    transition: transform 1s ease-in, opacity 1s ease-in, color 1s ease-in, background-color 1s ease-in;
}

/*This adds a psuedo selector of checked*/
Text|FadeIn:checked {
    opacity: 1;
    color: darkgreen;
    background-color: darkorange;
    transform: translateX(100px);
    transition: transform 1s ease-in, opacity 1s ease-in, color 1s ease-in, background-color 1s ease-in;

}

```

Usage of transition.css

```js
 import {FadeIn} from './transition';
 import {Component} from 'react';

 export default class Test extends Component {

    render(){
     return <View>
          <FadeIn>This Fades In/Out</FadeIn>
        </View>
    }
 }

```


## ClassNames
So you may want to add classNames to a component to change its styling.
So in you css you might have
```css

@namespace Native "react-native.View";

Native|ExampleView {
    border: 2px solid red;
    height: 100px;
    width: 200px;
}

Native|ExampleView.green {
    margin: 10px;
}

.green {
    border-color: green;
}

```

In your JS(X) you can
```jsx

import {ExampleView} from './example.css';

export default class Example extends Component {

  render(){
     return <ExampleView className="green">...</ExampleView>
  }
}


```

## Animations

```css
@namespace Text "react-native.Text";

Text|Bounce {
    height: 20px;
    width: 100px;
    background-color: yellow;
    border-radius: 10px;
    text-align: center;
    border:1px solid red;
}

Text|Bounce:checked {
    animation-name: bounce;
    animation-duration: 1s;
    animation-direction: alternate;
    animation-timing-function: linear;
    animation-iteration-count: 1;
}

@keyframes bounce {
    from {
        transform: translateY(0)
    }
    20% {
        transform: translateY(0)
    }
    40% {
        transform: translateY(-30)
    }
    43% {
        transform: translateY(-30)
    }
    53% {
        transform: translateY(0)
    }
    70% {
        transform: translateY(-15)
    }
    80% {
        transform: translateY(0)
    }
    90% {
        transform: translateY(-4)
    }
    to {
        transform: translateY(0)
    }
}

```


