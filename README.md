## What is `widget.js`?
A widget is a component that can manipulate html and reacts on data changes over time.

## A slider widget
How to define a widget:

``` javascript
var onSetData = function(eventData){
  if (eventData.isRendered) {
    this.customData.slider('value', eventData.newData);
  }
};

sliderWidget = $.widget.create({name:"slider", onDataChange: onSetData}, function() {
  this.widget.getSliderValue = function() {
    this.customData.slider.value();
  };

  this.customData.slider = this.container.slider({min:1, max:5, value:3});
  this.complete();
});
```

How to use this widget:
``` javascript
var target = $('<div>');

// sliderWidget.container is a jQuery object
target.append(sliderWidget.container);
```

How to render this sliderWidget:
``` javascript
sliderWidget.render();
```

How to set data of the sliderWidget:
``` javascript
// can be done before or after render().
sliderWidget.data(4);
```

How to retrieve the slider value?
``` javascript
var value = sliderWidget.getSliderValue();
```

## QnA
Q: I have an existing tom tree and want to use a note as the container for the widget, is that possible?  
A: Yes, use `$.widget.create(container, options, renderFun)` method.

Q: There are any tests for that?  
A: Check out the [jasmine tests](test/jasmine.html)

Q: Who had the idea?  
A: [linudaar](https://github.com/linudaar) was the guy behind this widget, [I](https://github.com/SeriousM) rebuild it completely.