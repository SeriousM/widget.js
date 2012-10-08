///<reference path="../../jquery-1.7.1.js"/>
///<reference path="./../Frameworks/reporters/jasmine-console.js"/>
///<reference path="../../../ViewScripts/widget.js"/>

describe("Renderer Test One", function () {

	it("can produce result synchronously", function (){
		var htmlDummy = "--- HTML RESULT ---",
			syncRenderFunction, $container, options, w;

		$container = $("<div id='foo'>");
		options = { method: 'replace', name:'foo' };

		w = widget.create($container, options, function () {
			// do whatever necessary to produce the desired output html...
			var html = "--- HTML RESULT ---";
			this.emit(html);
		});

		w.render().done(function (wResult) {
			var resultHtml = $("<div><div id='foo'>" + htmlDummy + "</div></div>").html();

			expect(wResult).toBe(resultHtml);
			expect($container.parent().html()).toBe(resultHtml);
		});
	});

	it("can produce result asynchronously", function () {
		var htmlDummy = "--- HTML RESULT ---",
		    testFinished = false,
		    result, asyncRenderFunction, $container, options, w;

		$container = $("<div id='foo'>");
		options = { method: 'replace' };

		waitsFor(function () {
			return testFinished;
		});

		w = widget.create($container, options, function () {
			var self = this;

			setTimeout(function () {
				self.emit(htmlDummy);
			},1000);
		});

		w.render().done(function (wResult) {
			result = wResult;
			testFinished = true;
		});

		runs(function () {
			var resultHtml = $("<div><div id='foo'>" + htmlDummy + "</div></div>").html();
			expect(result).toBe(resultHtml);
			expect($container.parent().html()).toBe(resultHtml);
		});
	});

	it("can combine two synchronous renderer", function(){
		var combinedWidget,
		    htmlDummyOne = "--- HTML RESULT 1 ---",
		    htmlDummyTwo = "--- HTML RESULT 2 ---",			
			$combinedContainer = $("<div id='combined'>");
		
		var combinedRenderFunction = function () {
			var widgetOne,
			    widgetTwo,
				self = this;
			
			widgetOne = widget.create($("<div id='one'>"), { method: 'replace', name:'one' }, function () {
				this.emit(htmlDummyOne);
			});
			
			widgetTwo = widget.create($("<div id='two'>"), { method: 'replace', name: 'two' }, function () {
				this.emit(htmlDummyTwo);
			});

			this.combine([widgetOne, widgetTwo]).done(function (combinedResult) {
				self.emit(combinedResult.one + combinedResult.two);
			});
		};
		
		combinedWidget = widget.create($combinedContainer, { method: 'replace', name:'combined' }, combinedRenderFunction);
		
		combinedWidget.render().done(function (combinedWidgetHtml) {
			
			var htmlDummyOneDiv = $("<div><div id='one'>" + htmlDummyOne + "</div></div>").html(),
			    htmlDummyTwoDiv = $("<div><div id='two'>" + htmlDummyTwo + "</div></div>").html(),
				html = htmlDummyOneDiv + htmlDummyTwoDiv,
				innerHtml = $("<div>"+html+"</div>").html(),
				outerHtml = $("<div><div id='combined'>" + html + "</div></div>").html();

			expect(combinedWidgetHtml, outerHtml);
			expect($combinedContainer.html()).toBe(innerHtml);
		});
	});
	
	it("can combine two asynchronous renderer", function () {
		var combinedWidget,
		    htmlDummyOne = "--- HTML RESULT 1 ---",
		    htmlDummyTwo = "--- HTML RESULT 2 ---",
		    combinedResult,		    
		    $combinedContainer = $("<div id='combined'>"),
		    allResults,
			testFinished = false;

		waitsFor(function(){
			return testFinished;
		});
		
		var combinedRenderFunction = function () {
			var widgetOne,
			    widgetTwo,
				self = this;

			widgetOne = widget.create($("<div id='one'>"), { method: 'replace', name: 'one' }, function () {
				var w1 = this;
				setTimeout(function () {
					w1.emit(htmlDummyOne);
				}, 750);
			});


			widgetTwo = widget.create($("<div id='two'>"), { method: 'replace', name: 'two' }, function () {
				var w2 = this;
				setTimeout(function () {
					w2.emit(htmlDummyTwo);
				}, 1000);

			});

			this.combine([widgetOne, widgetTwo]).done(function (cr) {
				self.emit(cr.one + cr.two);
			});

		};

		combinedWidget = widget.create($combinedContainer, { method: 'replace', name: 'combined' }, combinedRenderFunction);

		combinedWidget.render().done(function (widgetHtml) {
			combinedResult = widgetHtml;
			testFinished = true;
		});

		runs(function () {
			var htmlDummyOneDiv = $("<div><div id='one'>" + htmlDummyOne + "</div></div>").html(),
				htmlDummyTwoDiv = $("<div><div id='two'>" + htmlDummyTwo + "</div></div>").html(),
				html = htmlDummyOneDiv + htmlDummyTwoDiv,
				innerHtml = $("<div>" + html + "</div>").html(),
				outerHtml = $("<div><div id='combined'>" + html + "</div></div>").html();

			expect(combinedResult).toBe(outerHtml);
			expect($combinedContainer.html()).toBe(innerHtml);
		});
	});

	it("can append result to container", function () {

		var $container = $("<div id='container'>"),
			htmlDummyOne = "R1 HTML",
			htmlDummyTwo = "R2 HTML";

		var w1 = widget.create($container, { method: 'append', name: 'r1' }, function () {
			this.emit(htmlDummyOne);
		});
		
		var w2 = widget.create($container, { method: 'append', name: 'r2' }, function () {
			this.emit(htmlDummyTwo);
		});

		w1.render();
		
		w2.render();

		expect($container.html()).toBe(htmlDummyOne + htmlDummyTwo);
	});
	
	it("can produce result without done", function () {

		var $container = $("<div id='container'>"),
		    htmlDummyOne = "HTML";

		var w = widget.create($container, { method: 'replace', name: 'r1' }, function () {
			this.emit(htmlDummyOne);
		});

		w.render();

		expect($container.html()).toBe(htmlDummyOne);
	});
	
	it("can produce result with two dones", function () {

		var $container = $("<div id='container'>"),
		    htmlDummyOne = "HTML", 
			doneCalls = 0;

		var w = widget.create($container, { method: 'replace', name: 'r1' }, function () {
			this.emit(htmlDummyOne);
		});

		w.render().done(function (){
			doneCalls += 1;
		}).done(function (){
			doneCalls += 1;
		});

		expect($container.html()).toBe(htmlDummyOne);
		expect(doneCalls).toBe(2);
	});
	
	it("can handle error in render function", function () {

		var $container = $("<div id='container'>");

		var w = widget.create($container, { method: 'append', name: 'r1' }, function () {
			throw Error("something happend");
		});

		w.render();
		expect($container.html()).toBe("ERROR");
	});

	it("can combine two synchronous renderer and one does not emit", function () {
		var combinedWidget,
		    htmlDummyOne = "--- HTML RESULT 1 ---",		    
			$combinedContainer = $("<div id='combined'>"),
			testFinished = false, 
			combinedResult;

		waitsFor(function(){
			return testFinished;
		});

		var combinedRenderFunction = function () {
			var widgetOne,
			    widgetTwo;

			widgetOne = widget.create($("<div id='one'>"), { method: 'replace', name: 'one' }, function () {
				this.emit(htmlDummyOne);
			});


			widgetTwo = widget.create($("<div id='two'>"), { method: 'replace', name: 'two' }, function () {
				// does not emit!
			});

			this.combine([widgetOne, widgetTwo]);
		};

		combinedWidget = widget.create($combinedContainer, { method: 'replace', name: 'combined' }, combinedRenderFunction);

		combinedWidget.render().done(function (wResult) {
			combinedResult = wResult;
			testFinished = true;
		});

		runs(function () {
			var html = "<div id='one'>" + htmlDummyOne + "</div><div id='two'>Too late!</div>",
				innerHtml = $("<div>" + html + "</div>").html(),
				outerHtml = $("<div><div id='combined'>" + html + "</div></div>").html();
			expect(combinedResult).toBe(outerHtml);
			expect($combinedContainer.html()).toBe(innerHtml);
		});
	});

	it("can combine two combined renderers", function () {

		var $containerCombinedOne = $("<div id='combined-1'>"),
		    $containerCombinedTwo = $("<div id='combined-2'>"),
		    $containerCombinedSuper = $("<div id='combined-super'>");

		var combinedRendererSuper = widget.create($containerCombinedSuper, {method:'replace', name:'super'}, function () {
			
			var combinedRendererOne = widget.create($containerCombinedOne, { method: 'replace', name: 'c1' }, function () {

				var w11 = widget.create($("<div id='combined-1-sub-1'>"), { method: 'replace', name: 'c1-1' }, function () {
					this.emit("c1-1");
				});

				var w12 = widget.create($("<div id='combined-1-sub-2'>"), { method: 'replace', name: 'c1-2' }, function () {
					this.emit("c1-2");
				});

				this.combine([w11, w12]);

			});

			var combinedRendererTwo = widget.create($containerCombinedTwo, { method: 'replace', name: 'c1' }, function () {

				var w21 = widget.create($("<div id='combined-2-sub-1'>"), { method: 'replace', name: 'c2-1' }, function () {
					this.emit("c2-1");
				});

				var w22 = widget.create($("<div id='combined-2-sub-2'>"), { method: 'replace', name: 'c2-2' }, function () {
					this.emit("c2-2");
				});

				this.combine([w21, w22]);

			});

			this.combine([combinedRendererOne, combinedRendererTwo]);
			
		});


		combinedRendererSuper.render().done(function(result){
			var w11Html = $("<div><div id='combined-1-sub-1'>c1-1</div></div>").html(),
				w12Html = $("<div><div id='combined-1-sub-2'>c1-2</div></div>").html(),
				w21Html = $("<div><div id='combined-2-sub-1'>c2-1</div></div>").html(),
				w22Html = $("<div><div id='combined-2-sub-2'>c2-2</div></div>").html(),
				c1Html = $("<div><div id='combined-1'>"+w11Html + w12Html+"</div></div>").html(),
				c2Html = $("<div><div id='combined-2'>"+w21Html + w22Html+"</div></div>").html(),
				superHtml = $("<div><div id='combined-super'>"+c1Html + c2Html+"</div>").html();

			expect(result).toBe(superHtml);
			expect($containerCombinedSuper.html()).toBe(c1Html + c2Html);
		});




	});

	it("can combine two renderers with done callback and manual combination", function(){
		var combinedWidget,
		    htmlDummyOne = "--- HTML RESULT 1 ---",
		    htmlDummyTwo = "--- HTML RESULT 2 ---",
			$combinedContainer = $("<div id='combined'>");
		
		var combinedRenderFunction = function () {
			var widgetOne,
			    widgetTwo,
				self = this;
			
			widgetOne = widget.create($("<div id='one'>"), { method: 'replace', name:'one' }, function () {
				this.emit(htmlDummyOne);
			});
			
			widgetTwo = widget.create($("<div id='two'>"), { method: 'replace', name: 'two' }, function () {
				this.emit(htmlDummyTwo);
			});

			this.combine([widgetOne, widgetTwo]).done(function (combinedResult) {
				console.log("combine.done args", arguments);
				expect($combinedContainer.html()).toBe("");

				console.log("[" + self.name + "] call emit...");
				self.emit("<div id='x'>xxx"+combinedResult.one+"xxx</div><div id='y'>yyy"+combinedResult.two+"yyy</div>");
			});
		};
		
		combinedWidget = widget.create($combinedContainer, { method: 'replace', name:'combined' }, combinedRenderFunction);

		combinedWidget.render().done(function(widgetHtml){
			console.log("combinedWidget done callback", arguments);
			
			var htmlDummyOneDiv = $("<div><div id='one'>" + htmlDummyOne + "</div></div>").html(),
			    htmlDummyTwoDiv = $("<div><div id='two'>" + htmlDummyTwo + "</div></div>").html(),
			    html = "<div id='x'>xxx" + htmlDummyOneDiv + "xxx</div><div id='y'>yyy" + htmlDummyTwoDiv + "yyy</div>",
			    innerHtml = $("<div>" + html + "</div>").html(),
			    outerHtml = $("<div><div id='combined'>" + html + "</div></div>").html();


			expect(widgetHtml, outerHtml);
			expect($combinedContainer.html()).toBe(innerHtml);
		});
	});
});