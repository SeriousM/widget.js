﻿/*globals $, jQuery, apiClient, console */
widgets = {};

var widget = (function () {

  var createFun, combineFun, appendToFun, replaceInFun, appendElementsFun, defaults, widgetThat,
    // constants
      TIMEOUT = 3000,
      ERROR_CONTENT = "An error occured",
      TIMEOUT_CONTENT = "Timeout",
    WIDGET_NAME = "noname",
    CONTAINER_ELEMENT = '<div>';

  defaults = {
    TIMEOUT: TIMEOUT,
    ERROR_CONTENT: ERROR_CONTENT,
    TIMEOUT_CONTENT: TIMEOUT_CONTENT,
    WIDGET_NAME: WIDGET_NAME,
    CONTAINER_ELEMENT: CONTAINER_ELEMENT
  };

  // private
  appendElementsFun = function (targetContainer, result) {
    var keys = Object.keys(result);
    for (var i = 0; i < keys.length; i += 1) {
      var childElement = $(result[keys[i]]);
      try {
        targetContainer.append(childElement);
      } catch (e) {
        if (e && e.name && e.name == "HierarchyRequestError") {
          console.error("This element is already bound to an DOM element. Please fix this binding.", childElement);
        }
        throw e;
      }
    }
  };

  // public
  createFun = function (container, options, producerFunction) {
    /// <summary>
    /// Creates a new widget.
    /// </summary>
    /// <param name="container">
    /// A DOM element, where the html (produced by the producerFunction) will be inserted into.
    /// If omitted a container is still created and can be accessed by calling widget.container.
    /// </param>
    /// <param name="options">
    /// A JSON object with options
    ///   'name' ... A unique identfier for this widget. This name is used to identify the widget's content in the done callback of the combine() method.
    ///   'onDataChange' ... a callback on data(obj) was called
    /// </param>
    /// <param name="producerFunction">
    /// A producedFunction that will actually create the html of this widget.
    /// </param>
    var renderDoneDeferred = $.Deferred(),
        data = null,
        isRendered = false,
        widgetTimeout = null;

    // make the container optional
    if (!(container instanceof jQuery)) {
      producerFunction = options;
      options = container;
      container = $(defaults.CONTAINER_ELEMENT);
    }

    options = $.extend({ name: defaults.WIDGET_NAME, timeout: defaults.TIMEOUT }, options);

    var localContainer = container, localOptions = options, name = localOptions.name,
        failFun, completeFun, renderFun, dataFun, setOptionsFun,
        publicThat, renderThat, dataThat, renderDoneThat,
        customData = {};

    // method definition
    failFun = function (message) {
      localContainer.html(message);
      completeFun();
    };

    completeFun = function () {
      clearTimeout(widgetTimeout);
      renderDoneDeferred.resolve(renderDoneThat);
    };

    renderFun = function () {
      /// <summary>
      /// Execute the producer function that creates the html for this widget.
      /// </summary>
      var selfArgs = Array.prototype.slice.call(arguments, 0);

      // fail with an error if the widget is too slow to respond in time.
      widgetTimeout = setTimeout(function () {
        failFun(defaults.TIMEOUT_CONTENT);
      }, localOptions.timeout);

      // Execute the producer function
      // Note: The producer function may produce its html synchronously or asynchronously!
      if (typeof producerFunction === 'function') {
        try {
          producerFunction.apply(renderThat, selfArgs);

          // indicate that rendered was called
          isRendered = true;
        } catch (e) {
          // In case the producer function caused an error, we stil emit a result 'ERROR' instead
          // of the correct result.
          console.error("Error on render: " + (e.message || "no message found"), e);
          failFun(defaults.ERROR_CONTENT);
        }
      } else {
        throw new Error("producerFunction is not a function!");
      }

      var promise = renderDoneDeferred.promise();

      return promise;
    };

    dataFun = function () {
      /// <summary>
      /// function 1: get data by calling #data()
      /// function 2: set data by calling #data(object)
      /// while setting the data, the callback onDataChange from the options will be invoked.
      /// </summary>
      // if there was no argument return the current data
      if (arguments.length === 0) {
        return data;
      }

      var obj = arguments[0];

      // asseble a event object
      var dataChangeObject = {
        oldData: data,
        newData: obj,
        isRendered: isRendered
      };

      // set the data
      data = obj;

      if (localOptions.onDataChange && typeof (localOptions.onDataChange) === "function") {
        localOptions.onDataChange.apply(dataThat, [dataChangeObject]);
      }

      // return this to enable chainging
      return this;
    };

    setOptionsFun = function (newOptions) {
      /// <summary>
      /// extens the existing options with the new provided options.
      /// </summary>
      localOptions = $.extend(localOptions, newOptions);
    };

    renderDoneThat = {
      container: localContainer,
      name: name,
      data: dataFun,
      customData: customData,
      setOptions: setOptionsFun
    };

    publicThat = {
      render: renderFun,
      container: localContainer,
      name: name,
      data: dataFun,
      customData: customData,
      setOptions: setOptionsFun
    };

    dataThat = {
      container: localContainer,
      name: name,
      data: dataFun,
      customData: customData
    };

    renderThat = {
      container: localContainer,
      name: name,
      data: dataFun,
      fail: failFun,
      complete: completeFun,
      options: localOptions,
      customData: customData,
      widget: publicThat
    };

    return publicThat;
  };

  combineFun = function (widgets) {
    var widgetDeferreds = [],
        combinedResult = {},
        combinePromise,
        ownDeferred = $.Deferred();

    if (!widgets || widgets.length === 0) {
      return false;
    }

    var getProcessWidgetPromise = function (widget) {
      widget.setOptions({ timeout: 2900 });
      var promise = widget.render();

      // render the widget and resolve as successful
      promise.done(function () {
        combinedResult[widget.name] = widget.container;
      });

      return promise;
    };

    $.each(widgets, function (index, widget) {
      var localWidget = widget;
      widgetDeferreds.push(getProcessWidgetPromise(localWidget));
    });

    combinePromise = $.when.apply(this, widgetDeferreds);
    combinePromise.done(function () {
      ownDeferred.resolve(combinedResult);
    });

    return ownDeferred.promise();
  };

  appendToFun = function (targetContainer, widgets) {
    var combinePromise = this.combine(widgets);

    combinePromise.done(function (result) {
      appendElementsFun(targetContainer, result);
    });

    return combinePromise;
  };

  replaceInFun = function (targetContainer, widgets) {
    var combinePromise = this.combine(widgets);

    combinePromise.done(function () {
      targetContainer.html('');
    });
    combinePromise.done(function (result) {
      appendElementsFun(targetContainer, result);
    });

    return combinePromise;
  };

  widgetThat = {
    defaults: defaults,

    create: createFun,

    combine: combineFun,

    appendTo: appendToFun,

    replaceIn: replaceInFun
  };

  return widgetThat;
}());

(function($) {
  $.widget = widget;
}(jQuery));