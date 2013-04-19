describe("Widget Tests", function () {

  beforeEach(function(){
    widget.defaults.TIMEOUT = 300;
  });

  describe("Html Render Test", function () {

    it("can produce result synchronously", function () {
      var htmlDummy = "--- HTML RESULT ---",
          $container, options, w,
        testFinished = false,
          resultHtml,
        renderResult;

      $container = $("<div id='foo'>");
      options = { name: 'foo' };

      w = widget.create($container, options, function () {
        // do whatever necessary to produce the desired output html...
        this.container().html("--- HTML RESULT ---");
        this.complete();
      });

      w.render().done(function () {
        resultHtml = $("<div id='foo'>" + htmlDummy + "</div>").outerHTML();
        renderResult = w.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        expect(renderResult).toBe(resultHtml);
      });
    });

    it("can produce result asynchronously", function () {
      var htmlDummy = "--- HTML RESULT ---",
          testFinished = false,
          result, $container, w;

      $container = $("<div id='foo'>");

      w = widget.create($container, null, function () {
        var self = this;
        setTimeout(function () {
          self.container().html(htmlDummy);
          self.complete();
        }, 100);
      });

      w.render().done(function () {
        result = w.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        var resultHtml = $("<div id='foo'>" + htmlDummy + "</div>").outerHTML();
        expect(result).toBe(resultHtml);
      });
    });

    it("can combine a single widget", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          $combinedContainer = $("<div id='combined'>"),
        testFinished = false,
        combinedWidgetHtml,
        innerHtml, outerHtml;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
            self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          this.container().html(htmlDummyOne);
          this.complete();
        });

        widget.combine([widgetOne]).done(function (combinedResult) {
          self.container().append(combinedResult.one);
          self.complete();
        });
      });

      combinedWidget.render().done(function () {

        combinedWidgetHtml = combinedWidget.container().outerHTML();

        var htmlDummyOneDiv = $("<div id='one'>" + htmlDummyOne + "</div>").outerHTML(),
            html = htmlDummyOneDiv;

        innerHtml = $("<div>" + html + "</div>").html();
        outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        expect(combinedWidgetHtml, outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can combine two synchronous renderer", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          htmlDummyTwo = "--- HTML RESULT 2 ---",
          $combinedContainer = $("<div id='combined'>"),
        testFinished = false,
        combinedWidgetHtml,
        innerHtml, outerHtml;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
            widgetTwo,
            self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          this.container().html(htmlDummyOne);
          this.complete();
        });

        widgetTwo = widget.create($("<div id='two'>"), { name: 'two' }, function () {
          this.container().html(htmlDummyTwo);
          this.complete();
        });

        widget.combine([widgetOne, widgetTwo]).done(function (combinedResult) {
          self.container().append(combinedResult.one);
          self.container().append(combinedResult.two);
          self.complete();
        });
      });

      combinedWidget.render().done(function () {

        combinedWidgetHtml = combinedWidget.container().outerHTML();

        var htmlDummyOneDiv = $("<div id='one'>" + htmlDummyOne + "</div>").outerHTML(),
            htmlDummyTwoDiv = $("<div id='two'>" + htmlDummyTwo + "</div>").outerHTML(),
            html = htmlDummyOneDiv + htmlDummyTwoDiv;

        innerHtml = $("<div>" + html + "</div>").html();
        outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        expect(combinedWidgetHtml, outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can combine one asynchronous renderer", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          combinedResult,
          $combinedContainer = $("<div id='combined'>"),
          testFinished = false;

      var combinedRenderFunction = function () {
        var widgetOne,
            self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          var w1 = this;
          setTimeout(function () {
            w1.container().html(htmlDummyOne);
            w1.complete();
          }, 100);
        });

        widget.appendTo(self.container(), [widgetOne]).done(self.complete);
      };

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, combinedRenderFunction);

      combinedWidget.render().done(function () {
        combinedResult = combinedWidget.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        var htmlDummyOneDiv = $("<div id='one'>" + htmlDummyOne + "</div>").outerHTML(),
            html = htmlDummyOneDiv,
            innerHtml = $("<div>" + html + "</div>").html(),
            outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        expect(combinedResult).toBe(outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can combine two asynchronous renderer", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          htmlDummyTwo = "--- HTML RESULT 2 ---",
          combinedResult,
          $combinedContainer = $("<div id='combined'>"),
          testFinished = false;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
            widgetTwo,
            self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          var w1 = this;
          setTimeout(function () {
            w1.container().html(htmlDummyOne);
            w1.complete();
          }, 100);
        });


        widgetTwo = widget.create($("<div id='two'>"), { name: 'two' }, function () {
          var w2 = this;
          setTimeout(function () {
            w2.container().html(htmlDummyTwo);
            w2.complete();
          }, 150);

        });

        widget.appendTo(self.container(), [widgetOne, widgetTwo]).done(self.complete);
      });

      combinedWidget.render().done(function () {
        combinedResult = combinedWidget.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        var htmlDummyOneDiv = $("<div id='one'>" + htmlDummyOne + "</div>").outerHTML(),
            htmlDummyTwoDiv = $("<div id='two'>" + htmlDummyTwo + "</div>").outerHTML(),
            html = htmlDummyOneDiv + htmlDummyTwoDiv,
            innerHtml = $("<div>" + html + "</div>").html(),
            outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        expect(combinedResult).toBe(outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can append result to container", function () {

      var $container = $("<div id='container'>"),
          htmlDummyOne = "R1 HTML",
          htmlDummyTwo = "R2 HTML";

      var w1 = widget.create({ name: 'r1' }, function () {
        this.container().html(htmlDummyOne);
        this.complete();
      });

      var w2 = widget.create({ name: 'r2' }, function () {
        this.container().html(htmlDummyTwo);
        this.complete();
      });

      widget.appendTo($container, [w1, w2]);

      expect($container.html()).toBe('<div>' + htmlDummyOne + '</div><div>' + htmlDummyTwo + '</div>');
    });

    it("will timeout if not .completed", function () {

      var $container = $("<div id='container'>"),
          htmlDummyOne = "HTML",
          doneCalls = 0;

      var w = widget.create($container, { name: 'r1' }, function () {
        this.container().html(htmlDummyOne);

        // NO COMPLETE HERE
        // this.complete();
      });

      w.render().done(function () {
        doneCalls += 1;
      });

      waitsFor(function () {
        return doneCalls == 1;
      });

      runs(function () {
        expect($container.html()).toBe(widget.defaults.TIMEOUT_CONTENT);
      });
    });

    it("can produce result with two dones", function () {

      var $container = $("<div id='container'>"),
          htmlDummyOne = "HTML",
          doneCalls = 0;

      var w = widget.create($container, { name: 'r1' }, function () {
        this.container().html(htmlDummyOne);
        this.complete();
      });

      w.render().done(function () {
        doneCalls += 1;
      }).done(function () {
        doneCalls += 1;
      });

      waitsFor(function () {
        return doneCalls == 2;
      });

      runs(function () {
        expect($container.html()).toBe(htmlDummyOne);
        expect(doneCalls).toBe(2);
      });
    });

    it("can handle error in render function", function () {

      var $container = $("<div id='container'>");

      var w = widget.create($container, { name: 'r1' }, function () {
        throw Error("error for unit test");
      });

      w.render();
      expect($container.html()).toBe(widget.defaults.ERROR_CONTENT);
    });

    it("can combine one synchronous renderer and it does not emit", function () {
      var combinedWidget,
          $combinedContainer = $("<div id='combined'>"),
          testFinished = false,
          combinedResult;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
          self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          // does not emit!
        });

        widget.appendTo(self.container(), [widgetOne]).done(self.complete);
      });

      combinedWidget.render().done(function () {
        combinedResult = combinedWidget.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        var html = "<div id='one'>" + widget.defaults.TIMEOUT_CONTENT + "</div>",
            innerHtml = $("<div>" + html + "</div>").html(),
            outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        expect(combinedResult).toBe(outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can combine two synchronous renderer and one does not emit", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          $combinedContainer = $("<div id='combined'>"),
          testFinished = false,
          combinedResult;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
            widgetTwo,
          self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          this.container().html(htmlDummyOne);
          this.complete();
        });


        widgetTwo = widget.create($("<div id='two'>"), { name: 'two' }, function () {
          // does not emit!
        });

        widget.appendTo(self.container(), [widgetOne, widgetTwo]).done(self.complete);
      });

      combinedWidget.render().done(function () {
        combinedResult = combinedWidget.container().outerHTML();
        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        var html = "<div id='one'>" + htmlDummyOne + "</div><div id='two'>" + widget.defaults.TIMEOUT_CONTENT + "</div>",
            innerHtml = $("<div>" + html + "</div>").html(),
            outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        expect(combinedResult).toBe(outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });

    it("can combine two combined renderers", function () {

      var $containerCombinedOne = $("<div id='combined-1'>"),
          $containerCombinedTwo = $("<div id='combined-2'>"),
          $containerCombinedSuper = $("<div id='combined-super'>"),
        testFinished = false,
        c1Html, c2Html, superHtml, doneResult;

      var combinedRendererSuper = widget.create($containerCombinedSuper, { name: 'super' }, function () {
        var combinedRendererSuperScope = this;

        var combinedRendererOne = widget.create($containerCombinedOne, { name: 'c1' }, function () {
          var combinedRendererOneScope = this;

          var w11 = widget.create($("<div id='combined-1-sub-1'>"), { name: 'c1-1' }, function () {
            this.container().html("c1-1");
            this.complete();
          });

          var w12 = widget.create($("<div id='combined-1-sub-2'>"), { name: 'c1-2' }, function () {
            this.container().html("c1-2");
            this.complete();
          });

          widget.appendTo(combinedRendererOneScope.container(), [w11, w12]).done(combinedRendererOneScope.complete);
        });

        var combinedRendererTwo = widget.create($containerCombinedTwo, { name: 'c2' }, function () {
          var combinedRendererTwoScope = this;

          var w21 = widget.create($("<div id='combined-2-sub-1'>"), { name: 'c2-1' }, function () {
            this.container().html("c2-1");
            this.complete();
          });

          var w22 = widget.create($("<div id='combined-2-sub-2'>"), { name: 'c2-2' }, function () {
            this.container().html("c2-2");
            this.complete();
          });

          widget.appendTo(combinedRendererTwoScope.container(), [w21, w22]).done(combinedRendererTwoScope.complete);
        });

        widget.appendTo(combinedRendererSuperScope.container(), [combinedRendererOne, combinedRendererTwo]).done(combinedRendererSuperScope.complete);
      });

      combinedRendererSuper.render().done(function () {
        var w11Html = $("<div id='combined-1-sub-1'>c1-1</div>").outerHTML(),
            w12Html = $("<div id='combined-1-sub-2'>c1-2</div>").outerHTML(),
            w21Html = $("<div id='combined-2-sub-1'>c2-1</div>").outerHTML(),
            w22Html = $("<div id='combined-2-sub-2'>c2-2</div>").outerHTML();

        doneResult = combinedRendererSuper.container().outerHTML();
        c1Html = $("<div id='combined-1'>" + w11Html + w12Html + "</div>").outerHTML();
        c2Html = $("<div id='combined-2'>" + w21Html + w22Html + "</div>").outerHTML();
        superHtml = $("<div id='combined-super'>" + c1Html + c2Html + "</div>").outerHTML();

        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        expect(doneResult).toBe(superHtml);
        expect($containerCombinedSuper.html()).toBe(c1Html + c2Html);
      });
    });

    it("can combine two renderers with done callback and manual combination", function () {
      var combinedWidget,
          htmlDummyOne = "--- HTML RESULT 1 ---",
          htmlDummyTwo = "--- HTML RESULT 2 ---",
          $combinedContainer = $("<div id='combined'>"),
        testFinished = false,
        widgetHtml, innerHtml, outerHtml;

      combinedWidget = widget.create($combinedContainer, { name: 'combined' }, function () {
        var widgetOne,
            widgetTwo,
            self = this;

        widgetOne = widget.create($("<div id='one'>"), { name: 'one' }, function () {
          this.container().html(htmlDummyOne);
          this.complete();
        });

        widgetTwo = widget.create($("<div id='two'>"), { name: 'two' }, function () {
          this.container().html(htmlDummyTwo);
          this.complete();
        });

        widget.combine([widgetOne, widgetTwo]).done(function (combinedResult) {
          expect($combinedContainer.html()).toBe("");

          self.container().html("<div id='x'>xxx" + combinedResult.one.outerHTML() + "xxx</div><div id='y'>yyy" + combinedResult.two.outerHTML() + "yyy</div>");
          self.complete();
        });
      });

      combinedWidget.render().done(function () {
        widgetHtml = combinedWidget.container().outerHTML();

        var htmlDummyOneDiv = $("<div id='one'>" + htmlDummyOne + "</div>").outerHTML(),
            htmlDummyTwoDiv = $("<div id='two'>" + htmlDummyTwo + "</div>").outerHTML(),
            html = "<div id='x'>xxx" + htmlDummyOneDiv + "xxx</div><div id='y'>yyy" + htmlDummyTwoDiv + "yyy</div>";

        innerHtml = $("<div>" + html + "</div>").html();
        outerHtml = $("<div id='combined'>" + html + "</div>").outerHTML();

        testFinished = true;
      });

      waitsFor(function () {
        return testFinished;
      });

      runs(function () {
        expect(widgetHtml, outerHtml);
        expect($combinedContainer.html()).toBe(innerHtml);
      });
    });
  });

  describe("jQuery Object Render Test", function () {

    it("can find a emitted jQuery dom element in the target container", function () {
      var $container, options, w;

      $container = $("<div id='target'>");
      options = { name: 'foo' };

      w = widget.create($container, options, function () {

        var $child = $("<div id='child'>").html("content");
        this.container().append($child);

        this.complete();
      });

      w.render();

      expect($container.find("#child").length).toBe(1);
    });

    it("can change a created dom element after render", function () {
      var $container, options, w;

      var widgetDataChange = function (eventData) {
        if (eventData.isRendered) {
          this.customData().child.text(eventData.newData.sentenceValue);
        }
      };

      $container = $("<div id='target'>");
      options = { name: 'foo', onDataChange: widgetDataChange };

      w = widget.create($container, options, function () {

        this.customData().child = $("<p id='child'>").text(this.data().sentenceValue);
        this.container().append(this.customData().child);
        this.complete();
      });

      w.data({ sentenceValue: "first sentence" });
      w.render();

      expect($container.find("#child").length).toBe(1);
      expect($container.find("#child").first().text()).toBe("first sentence");

      w.data({ sentenceValue: "second sentence" });
      expect($container.find("#child").first().text()).toBe("second sentence");
    });

    it("slider test with generic getData function", function () {
      var outerOptions, outerWidget;

      var outerWidgetDataChange = function (eventData) {
        this.customData().sliderValues = eventData.newData;

        if (eventData.isRendered) {
          this.customData().sliderNewIdea.data(eventData.newData.newIdeaValue);
          this.customData().sliderNewComment.data(eventData.newData.newCommentValue);
        }
      };

      var getDataFunction = function () {
        return {
          newIdeaValue: this.customData().sliderNewIdea.data(),
          newCommentValue: this.customData().sliderNewComment.data()
        };
      };

      outerOptions = { name: 'outer', onDataChange: outerWidgetDataChange, getData: getDataFunction };

      outerWidget = widget.create(outerOptions, function () {

        var getSliderWidget = function (name) {
          var sliderDataChange = function (eventData) {
            this.customData().sliderValue = eventData.newData;

            if (eventData.isRendered) {
              this.customData().sliderObject.slider('value', this.customData().sliderValue);
            }
          };

          var sliderGetData = function () {
            return this.customData().sliderValue;
          };

          var sliderOptions = { name: name, onDataChange: sliderDataChange, getData: sliderGetData };

          var sliderWidget = widget.create(sliderOptions, function () {
            this.customData().sliderObject = this.container();
            this.customData().sliderObject.slider({
              range: "max",
              min: 0,
              max: 3,
              value: this.customData().sliderValue,
              slide: function (event, ui) {
                this.customData().sliderValue = ui.value;
              }
            });

            this.complete();
          });

          return sliderWidget;
        };

        this.customData().sliderNewIdea = getSliderWidget('sliderNewIdea');
        this.customData().sliderNewComment = getSliderWidget('sliderNewComment');

        this.customData().sliderNewIdea.data(this.customData().sliderValues.newIdeaValue);
        this.customData().sliderNewComment.data(this.customData().sliderValues.newCommentValue);

        widget.appendTo(this.container(), [this.customData().sliderNewIdea, this.customData().sliderNewComment]).done(this.complete);
      });

      outerWidget.data({ newIdeaValue: 1, newCommentValue: 3 });
      outerWidget.render();

      expect(outerWidget.data().newIdeaValue).toBe(1);
      expect(outerWidget.data().newCommentValue).toBe(3);

      outerWidget.data({ newIdeaValue: 0, newCommentValue: 0 });

      expect(outerWidget.data().newIdeaValue).toBe(0);
      expect(outerWidget.data().newCommentValue).toBe(0);
    });

    it("can be chained", function () {
      var targetContainer = $("<div>");
      widget.create(targetContainer, null, function () {
        this.complete();
      }).render().done(function (w) {
        w.container().css("color", "red");
      });

      expect(targetContainer.css("color")).toBe("red");
    });

    it("on render.done the parameter is the same widget", function () {
      var targetContainer = $("<div>");
      var w1, w2;

      w1 = widget.create(targetContainer, null, function () {
        this.complete();
      });

      w1.render().done(function (w) {
        w2 = w;
      });

      expect(w1).toBe(w2);
    });
  });

  describe("Data Test", function () {

    it("can set data", function () {
      var w,
          wData;

      w = widget.create(null, { name: "foo" }, function () {; });

      wData = { some: "one" };

      w.data(wData);
    });

    it("can set data and read data", function () {
      var w,
          inData,
        outData;

      w = widget.create(null, { name: "foo" }, function () {; });

      inData = { some: "one" };

      w.data(inData);

      outData = w.data();

      expect(outData).toBe(inData);
      expect(outData.some).toBe(inData.some);
    });

    it("can read setted data after render", function () {
      var w,
          inData,
        outData,
        $container = $("<div id='foo'>");

      w = widget.create($container, { name: "foo" }, function () {
        this.complete();
      });

      inData = { some: "one" };

      w.data(inData);
      w.render();

      outData = w.data();

      expect(outData.some).toBe(inData.some);
    });

    it("can read setted data in rendered markup", function () {
      var w,
          inData,
          markup,
        $container = $("<div id='foo'>");

      w = widget.create($container, { name: "foo" }, function () {
        this.container().html(this.data().some);
        this.complete();
      });

      inData = { some: "!one?" };

      w.data(inData);
      w.render();

      markup = $container.html();

      expect(markup).toContain("!one?");
    });

    it("can set the data after render and read it", function () {
      var w,
          inData,
          outData,
        $container = $("<div id='foo'>");

      w = widget.create($container, { name: "foo" }, function () {
        this.container().html(this.data().some);
        this.complete();
      });

      inData = { some: "!one?" };

      w.data(inData);
      w.render();

      inData = { some: "!two?" };
      w.data(inData);

      outData = w.data();

      expect(outData).toBe(inData);
      expect(outData.some).toBe("!two?");
    });

    it("check if the data change event is called on data change", function () {
      var w,
          inData,
          callbackCalledCount = 0,
        $container = $("<div id='foo'>");

      var onDataChange = function () {
        callbackCalledCount++;
      };

      w = widget.create($container, { name: "foo", onDataChange: onDataChange }, function () {; });

      inData = { some: "!one?" };
      w.data(inData);

      waitsFor(function () {
        return callbackCalledCount == 1;
      });

      runs(function () {
        expect(callbackCalledCount).toBe(1);
      });
    });

    it("check the old and new data is different on change", function () {
      var w,
          inData1,
          inData2,
          callbackCalledCount = 0,
        $container = $("<div id='foo'>");

      var onDataChange = function (eventData) {
        if (callbackCalledCount == 0) {
          expect(eventData.isRendered).toBe(false);
          expect(eventData.oldData).toBeNull();
          expect(eventData.newData).toBe(inData1);
        }
        else if (callbackCalledCount == 1) {
          expect(eventData.isRendered).toBe(false);
          expect(eventData.oldData).not.toBe(eventData.newData);
          expect(eventData.oldData).toBe(inData1);
          expect(eventData.newData).toBe(inData2);
        }

        callbackCalledCount++;
      };

      w = widget.create($container, { name: "foo", onDataChange: onDataChange }, function () {; });

      inData1 = { some: "!one?" };
      w.data(inData1);

      inData2 = { other: "!two?" };
      w.data(inData2);

      waitsFor(function () {
        return callbackCalledCount == 2;
      });

      runs(function () {
        expect(callbackCalledCount).toBe(2);
      });
    });

    it("check if isRendered is correct", function () {
      var w,
          inData,
          callbackCalledCount = 0,
        $container = $("<div id='foo'>");

      var onDataChange = function (eventData) {
        if (eventData.isRendered) {
          this.container().find("#bar").html("---" + eventData.newData.number + "---");
        } else {
          // ignore it
        }

        callbackCalledCount++;
      };

      w = widget.create($container, { name: "foo", onDataChange: onDataChange }, function () {
        var txt = "---" + this.data().number + "---";
        var child = $('<div><div id="bar">' + txt + '</div></div>');

        this.container().append(child);
        this.complete();
      });

      inData = { number: 1 };
      w.data(inData);
      w.render();

      inData = { number: 2 };
      w.data(inData);

      waitsFor(function () {
        return callbackCalledCount == 2;
      });

      runs(function () {
        expect($container.find("#bar") && $container.find("#bar").html() == "---2---").toBeTruthy();
      });
    });
  });

  describe("documentation", function () {
    it("minimal widget setting with null container", function () {
      var w = widget.create($('<div>'), null, function () {
        this.complete();
      });

      w.render();
      expect(w.container().outerHTML()).toBe('<div></div>');
    });

    it("minimal widget setting without container", function () {
      var w = widget.create(null, function () {
        this.complete();
      });

      w.render();
      expect(w.container().outerHTML()).toBe('<div></div>');
    });

    it("widget create child in container", function () {
      var w = widget.create(null, function () {
        this.container().append($('<p>').attr('id', 'p_ele').text("hello world"));
        this.complete();
      });

      w.render();
      expect(w.container().find('#p_ele').text()).toBe('hello world');
    });

    it("widget contains set of written data", function () {
      var w = widget.create(null, function () {
        this.complete();
      });

      w.data({ name: "banana", color: "yellow" });
      w.render();
      expect(w.data().name).toBe('banana');
    });

    it("widget changes data after render function", function () {
      var w = widget.create(null, function () {
        this.complete();
      });

      w.render();
      w.data({ name: "banana", color: "yellow" });
      expect(w.data().name).toBe('banana');

      w.data({ name: "apple", color: "green" });
      expect(w.data().name).toBe('apple');
    });

    it("widget throws an error on rendering twice", function () {
      var w = widget.create(null, function () {
        this.complete();
      });

      w.render();
      expect(w.render).toThrow();
    });

    it("widget can replace the content of the container with a new element", function () {
      var w = widget.create(null, function () {
        this.container($('<p>'));
        this.complete();
      });

      w.render();
      expect(w.container().outerHTML()).toBe("<p></p>");
    });

    it("customData is always accessible", function () {
      var dataChangeCustomDataObject;

      var onDataChange = function () {
        dataChangeCustomDataObject = this.customData();
      };

      var w = widget.create({ onDataChange: onDataChange }, function () {
        this.customData({ a: "a" });
        this.complete();
      });

      w.render();
      w.data({});
      expect(dataChangeCustomDataObject).toEqual({ a: "a" });
    });
  });
});