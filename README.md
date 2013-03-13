## What is `widget.js`?
A widget is a component that can manipulate html and reacts on data changes over time.

## A slider widget
How to define a widget:

``` javascript
var onSetData = function(eventData){
  // eventData.newData contains the new data set by widget.data(...)
  this.customData().sliderValue = eventData.newData;

  // act only if the widget was rendered
  if (eventData.isRendered) {
    this.customData().slider('value', eventData.newData);
  }
};

var getWidgetData = function(){
  // override the widget.data() method
  return this.customData().slider.value();
};

var sliderWidgetOptions = {
  name:"slider", onDataChange: onSetData, getData: getWidgetData
};

sliderWidget = widget.create(sliderWidgetOptions, function() {
  // create the slider object and store it into the customData object of the widget
  this.customData().slider = this.container().slider({
    min: 1, max: 5, value :this.customData().sliderValue
  });

  // signal that the rendering of the widget is completed
  this.complete();
});
```

How to render this sliderWidget:
``` javascript
// set the initial data of the widget.
// can be done before or after render().
sliderWidget.data(3);

sliderWidget.render();
```

How to use this widget:
``` javascript
var target = $('<div>');

// sliderWidget.container is a jQuery object
target.append(sliderWidget.container());
```

How to retrieve the slider value?
``` javascript
// this will call the defined getWidgetData function.
var value = sliderWidget.data();
```

## QnA
Q: I have an existing tom tree and want to use a note as the container for the widget, is that possible?  
A: Yes, use `widget.create(container, options, renderFun)` method.

Q: There are any tests for that?  
A: Check out the [jasmine tests](test/jasmine.html) or [run them here](http://seriousm.github.com/widget.js/)

Q: Who had the idea?  
A: [linudaar](https://github.com/linudaar) was the guy behind this widget, [I](https://github.com/SeriousM) rebuild it completely.