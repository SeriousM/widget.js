(function (window, $) {
  window.widget = (function () {
    var createFun, combineFun, appendToFun, replaceInFun, appendElementsFun, 
        prependToFun, addEventFun, removeEventFun, defaults, widgetThat, events, 
        eventKeys, removeFromArrayFun, resetEventsFun,
        // constants
        TIMEOUT = 5000,
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

    eventKeys = {
      afterRender: "afterRender"
    };

    resetEventsFun = function(){
      events = {};
      _.each(_.keys(eventKeys), function(eventKey) {
        events[eventKey] = [];
      });
    };

    resetEventsFun();
    
    // private
    appendElementsFun = function (targetContainer, result, action) {
      $.each(result.list, function (index, item) {
        try {
          action(targetContainer, item);
        } catch (e) {
          if (e && e.name && e.name == "HierarchyRequestError") {
            console.error("This element is already bound to an DOM element. Please fix this binding.", item);
          }
          throw e;
        }
      });
    };

    removeFromArrayFun = function (arr, item) {
      for (var i = arr.length; i--;) {
        if (arr[i] === item) {
          arr.splice(i, 1);
        }
      }
    };

    // public
    addEventFun = function(name, func) {
      var eventContainer = events[name];
      if (!eventContainer || !_.isFunction(func)) {
        return;
      }

      eventContainer.push(func);
    };

    removeEventFun = function(name, func) {
      var eventContainer = events[name];
      if (!eventContainer || !_.isFunction(func)) {
        return;
      }

      removeFromArrayFun(eventContainer, func);
    };

    createFun = function (container, options, renderFunction) {
      /// <summary>
      /// Creates a new widget.
      /// </summary>
      /// <param name="container">
      /// A DOM element, where the html (produced by the renderFunction) will be inserted into.
      /// If omitted a container is still created and can be accessed by calling widget.container.
      /// </param>
      /// <param name="options">
      /// A JSON object with options
      ///   'name' ... A unique identfier for this widget. This name is used to identify the widget's content in the done callback of the combine() method.            
      ///   'onDataChange' ... a callback on data(obj) was called
      ///   'onConfigChange' ... a callback on config(obj) was called
      ///   'getData' ... the function to use when widget().data() is called
      /// </param>
      /// <param name="renderFunction">
      /// A renderFunction that will actually create the html of this widget.
      /// </param>

      // make the container optional
      if (!(container instanceof jQuery)) {
        renderFunction = options;
        options = container;
        container = $(defaults.CONTAINER_ELEMENT);
      }

      options = $.extend({ name: defaults.WIDGET_NAME, timeout: defaults.TIMEOUT }, options);

      var renderDoneDeferred = $.Deferred(),
          isRendered = false,
          widgetTimeout = null,
          failFun, completeFun, renderFun, dataFun, configFun, setOptionsFun, readDataFun, readConfigFun, customDataFun, containerFun,
          createThat, renderThat, dataChangeThat, configChangeThat, getDataThat,
          internalStore = { data: null, customData: {}, container: container, options: options };

      // method definition
      failFun = function (message) {
        internalStore.container.html(message);
        console.log(message, container, options, renderFunction);
        completeFun();
      };

      completeFun = function () {
        clearTimeout(widgetTimeout);
        renderDoneDeferred.resolve(createThat);
      };

      renderFun = function () {
        /// <summary>
        /// Execute the render function that creates the html for this widget.
        /// </summary>
        if (isRendered) {
          throw new Error("The widget was already rendered.");
        }

        var selfArgs = Array.prototype.slice.call(arguments, 0);

        // fail with an error if the widget is too slow to respond in time.
        widgetTimeout = setTimeout(function () {
          failFun(defaults.TIMEOUT_CONTENT);
        }, internalStore.options.timeout);

        // Execute the render function
        // Note: The render function may render its html synchronously or asynchronously!
        if (typeof renderFunction === 'function') {
          try {
            renderFunction.apply(renderThat, selfArgs);

            // indicate that rendered was called
            isRendered = true;
          } catch (e) {
            // In case the render function caused an error, we stil emit a result 'ERROR' instead
            // of the correct result.
            console.error("Error on render: " + (e.message || "no message found"), e);
            failFun(defaults.ERROR_CONTENT);
          }
        } else {
          throw new Error("renderFunction is not a function!");
        }

        var promise = renderDoneDeferred.promise();

        _.each(events[eventKeys.afterRender], function (afterRenderFunction) {
          promise = promise.done(afterRenderFunction);
        });

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
          if (internalStore.options.getData && typeof (internalStore.options.getData) === "function") {
            return internalStore.options.getData.apply(getDataThat);
          } else {
            return internalStore.data;
          }
        }

        var obj = arguments[0];

        // asseble a event object
        var dataChangeObject = {
          oldData: internalStore.data,
          newData: obj,
          isRendered: isRendered
        };

        // set the data
        internalStore.data = obj;

        if (internalStore.options.onDataChange && typeof (internalStore.options.onDataChange) === "function") {
          internalStore.options.onDataChange.apply(dataChangeThat, [dataChangeObject]);
        }

        // return this to enable chainging
        return this;
      };

      configFun = function () {
        /// <summary>
        /// function 1: get config by calling #config()
        /// function 2: set config by calling #config(object)
        /// while setting the config, the callback onConfigChange from the options will be invoked.
        /// </summary>

        // if there was no argument return the current data
        if (arguments.length === 0) {
          return internalStore.config;
        }

        var obj = arguments[0];

        // asseble a event object
        var configChangeObject = {
          oldConfig: internalStore.config,
          newConfig: obj,
          isRendered: isRendered
        };

        // set the config
        internalStore.config = obj;

        if (internalStore.options.onConfigChange && typeof (internalStore.options.onConfigChange) === "function") {
          internalStore.options.onConfigChange.apply(configChangeThat, [configChangeObject]);
        }

        // return this to enable chainging
        return this;
      };

      customDataFun = function () {
        if (arguments.length === 0) {
          return internalStore.customData;
        }

        var obj = arguments[0];

        // set the data
        internalStore.customData = obj;

        // return this to enable chainging
        return this;
      };

      containerFun = function () {
        if (arguments.length === 0) {
          return internalStore.container;
        }

        var content = arguments[0];

        if (!content) {
          throw Error("The new content of the container may not be empty.");
        }

        // set the data
        if (internalStore.container.parent().length !== 0) {
          internalStore.container.replaceWith(content);
        }

        internalStore.container = content;

        // return this to enable chainging
        return this;
      };

      readDataFun = function () {
        if (arguments.length > 0) {
          throw Error("You are now allowed to set data in the widget.render function.");
        }
        return internalStore.data;
      };

      readConfigFun = function () {
        if (arguments.length > 0) {
          throw Error("You are now allowed to set config in the widget.render function.");
        }
        return internalStore.config;
      };

      setOptionsFun = function (newOptions) {
        /// <summary>
        /// extens the existing options with the new provided options.
        /// </summary>
        $.extend(internalStore.options, newOptions);
      };

      // the return object of create
      createThat = {
        render: renderFun,
        container: containerFun,
        name: internalStore.options.name,
        data: dataFun,
        config: configFun,
        setOptions: setOptionsFun
      };

      // for callback of options.getData
      getDataThat = {
        customData: customDataFun,
        data: readDataFun,
        container: containerFun,
        name: internalStore.options.name
      };

      // for callback of onDataChange
      dataChangeThat = {
        container: containerFun,
        name: internalStore.options.name,
        customData: customDataFun
      };

      // for callback of onConfigChange
      dataChangeThat = {
        container: containerFun,
        name: internalStore.options.name,
        customData: customDataFun
      };

      // for renderFunction callback
      renderThat = {
        container: containerFun,
        name: internalStore.options.name,
        fail: failFun,
        complete: completeFun,
        options: internalStore.options,
        customData: customDataFun,
        data: readDataFun,
        config: readConfigFun
      };

      return createThat;
    };

    combineFun = function (widgets) {
      var widgetDeferreds = [],
          combinedResult = {},
          combinePromise,
          ownDeferred = $.Deferred();

      combinedResult.list = [];
      combinedResult.widgets = {};
      combinedResult.widgetList = [];
      
      if (_.isObject(widgets) && !_.isArray(widgets)) {
        widgets = [widgets];
      }

      if (!widgets || widgets.length === 0) {
        ownDeferred.resolve({ list: [], widgets: [], widgetList: [] });
        return ownDeferred.promise();
      }

      var getProcessWidgetPromise = function (widget, index) {
        widget.setOptions({ timeout: defaults.TIMEOUT - 100 });
        var promise = widget.render();

        // render the widget and resolve as successful
        promise.done(function () {
          var widgetContainer = widget.container();
          combinedResult[widget.name] = widgetContainer; // TODO: Refactor this, check if needed!
          combinedResult.list[index] = widgetContainer;
          if (widget.name) {
              combinedResult.widgets[widget.name] = widget;
          } else {
              console.log("widget " + index + " has no name");
          }
          combinedResult.widgetList[index] = widget;
        });

        return promise;
      };

      $.each(widgets, function (index, widget) {
        var localWidget = widget;
        var localIndex = index;
        widgetDeferreds.push(getProcessWidgetPromise(localWidget, localIndex));
      });

      combinePromise = $.when.apply(this, widgetDeferreds);
      combinePromise.done(function () {
        ownDeferred.resolve(combinedResult);
      });

      return ownDeferred.promise();
    };

    var containerAppendFun = function(targetContainer, item) {
      targetContainer.append(item);
    };
    
    var containerPrependFun = function (targetContainer, item) {
      targetContainer.prepend(item);
    };


    appendToFun = function (targetContainer, widgets) {
      var combinePromise = this.combine(widgets);

      combinePromise.done(function (result) {
        appendElementsFun(targetContainer, result, containerAppendFun);
      });

      return combinePromise;
    };
    
    prependToFun = function (targetContainer, widgets) {
      var combinePromise = this.combine(widgets);

      combinePromise.done(function (result) {
        appendElementsFun(targetContainer, result, containerPrependFun);
      });

      return combinePromise;
    };

    replaceInFun = function (targetContainer, widgets) {
      var combinePromise = this.combine(widgets);

      combinePromise.done(function () {
        targetContainer.html('');
      });
      combinePromise.done(function (result) {
        appendElementsFun(targetContainer, result, containerAppendFun);
      });

      return combinePromise;
    };

    widgetThat = {
      defaults: defaults,

      eventKeys: eventKeys,

      create: createFun,

      combine: combineFun,

      appendTo: appendToFun,
      
      prependTo: prependToFun,

      replaceIn: replaceInFun,

      addEvent: addEventFun,

      removeEvent: removeEventFun,

      resetEvents: resetEventsFun
    };

    return widgetThat;
  })();
})(window, jQuery);