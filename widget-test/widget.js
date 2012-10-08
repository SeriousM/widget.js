/*globals $, jQuery, apiClient, console */
widgets = {};

var widget = (function () {
	return {
		create: function (container, options, producerFunction) {
			/// <summary>
			/// Create a new widget by providing...
			/// 1. A container that will receive the html that is produced by this widget
			/// 2. Options
			/// 3. A producedFunction that will actually create the html of this widget.
			/// <param name="container">A DOM element, where the html (produced by the producerFunction) will be inserted into.</param>
			/// <param name="options">
			/// A JSON object with options
			///   'name' ... A unique identfier for this widget. This name is used to identify the widget's content in the done callback of the combine() method.
			///   'method' ... Specifies if the content that is emitted by the producerFunction is to be appended or replaced into the dom element.
			/// </param>
			/// </summary>
			var doneFunctionStack = [],
			    combineDoneFunctionStack = [],
				renderDoneDeferred = $.Deferred();

			return {
				options: options || {},
				
				container: container,
				
				name: options.name || 'noname',
				
				render: function () {
					/// <summary>
					/// Execute the producer function that creates the html for this widget.
					/// After the producer function has finished its work (be it synchronous or asynchronous), it will pass its result to the done() callback
					/// as well as insert/append it into the dom element.
					/// </summary>
					var that = {},
						self = this,
						selfArgs = Array.prototype.slice.call(arguments, 0);

					// Execute the producer function
					// Note: The producer function may produce its html synchronously or asynchronously!
					if (typeof producerFunction === 'function') {
						try {
							// TODO: should we pass 'self' (the widget instance) here or 
							// is it better to pass another object that only provides 'emit()' and nothing else.
							producerFunction.apply(self, selfArgs);
						}
						catch (e) {
							// In case the producer function caused an error, we stil emit a result 'ERROR' instead
							// of the correct result.
							console.error("Render function of renderer [" + self.name + "] returned an error", e);
							self.emit("ERROR");
						}
					} else {
						throw new Error("producerFunction is not a function!");
					}
					
					that.done = function (callback) {
						/// <summary>
						/// Add a callback that will be executed once the producer function finished its work and emitted its html result.
						/// </summary>

						// Push the callback to the done stack
						if (typeof callback === 'function') {
							doneFunctionStack.push(callback);
						} else {
							throw new Error("callback is not a function!");
						}
						
						// Add a dererred 'then' that will execute all done callbacks on the stack
						// once the emit is called (and the deferrer is resolved).
						renderDoneDeferred.then(function () {
							var doneFn, 
								thenArgs = Array.prototype.slice.call(arguments);
							
							if (doneFunctionStack.length > 0) {
								while (doneFn = doneFunctionStack.pop()) {
									doneFn.apply(self, thenArgs);
								}
							}
						});
						
						return this;
					};
					
					return that;
				},
				
				emit: function (result) {
					/// <summary>
					/// A widget's producer function needs to call emit() in order to return its result. 
					/// The emit function must be called whenever the result is ready, that means in case of a producer 
					/// function that works asynchronously, the emit() must be called in the last ajax callback.
					/// <param name="result">The result html produced by the producer function.</param>
					/// </summary>
					var resultHtml = "", i, keys, combinedResult = "", origResult = result;

					// In case the result is an object, it means that it came from the combine() method.
					// In that case, we transform the result to a nice json.
					if (typeof result === 'object') {
						keys = Object.keys(result);
						for (i = 0; i < keys.length; i += 1) {
							combinedResult += $(result[keys[i]]).wrap("<div>").parent().html();
						}
						result = combinedResult;
					}

					// use replace method by default
					if ( !this.options || !this.options.method || (this.options.method && this.options.method === 'replace')) {
						resultHtml = $(container).html(result).wrap("<div>").parent().html();
					} else if (this.options.method && this.options.method === 'append') {
						resultHtml = $(container).append(result).wrap("<div>").parent().html();
					}

					// Resolve the derrer for the done callbacks.
					// Once this deferrer is resolved, all done callbacks from the stack will be executed.
					renderDoneDeferred.resolve(resultHtml, origResult);
				},

				combine: function (widgets) {
					/// <summary>
					/// Combine multiple widgets (that is, their outputs) into one widget (output).
					/// <param name="widgets">All widgets as an array.</param>
					/// </summary>
					var self = this,
					    widgetResults = [], i, widget,
					    hasError = false,
						that = {},
						combinedResult = {},
						combinedDeferrer = $.Deferred();

					if (!widgets || widgets.length === 0) {
						return false;
					}
					
					// Error handling for 'no emit call'
					// If one of the widgets does not call emit() in time, it will be called here
					// This fallback will emit 'too late'.
					var timeout = setTimeout(function () {
						var j, k, widgetName, found;
						hasError = true;

						console.error("One or multiple renderers did not emit in time.");

						for (j = 0; j < widgets.length; j += 1) {
							widgetName = widgets[j].name, found = false;
							for (k = 0; k < widgetResults.length; k += 1) {
								if (widgetResults[k].key === widgetName) {
									found = true;
									break;
								}
							}
							if (!found) {
								widgets[j].emit("Too late!"); // TODO [M]: externalize string
							}
						}

						for (j = 0; j < widgetResults.length; j += 1) {
							combinedResult[widgetResults[j].key] = widgetResults[j].html;
						}
						self.emit(combinedResult);
					}, 3000); // TODO [M]: create option
					
					// Execute all widget's render() methods.
					for (i = 0; i < widgets.length; i += 1) {
						if (typeof widgets[i] === 'object') {
							widget = widgets[i];

							widget.render().done(function (html) {
								var result = {},
									j;

								result.key = this.name;
								result.html = html;

								widgetResults.push(result);

								// All renderers returned their result?
								if (widgetResults.length === widgets.length && !hasError) {
									clearTimeout(timeout);

									// Transform the array of results into one object
									for (j = 0; j < widgetResults.length; j += 1) {
										combinedResult[widgetResults[j].key] = widgetResults[j].html;
									}
									
									// Resolve the combinedDeferrer in order to execute
									// All done callbacks for the combine() of the stack.
									combinedDeferrer.resolve(combinedResult);
								}
							});
						}
					}

					that.done = function (callback) {
						/// <summary>
						/// Add a callback that will receive the result of the combination.
						/// </summary>
						
						// Push the callback on the stack
						if (typeof callback === 'function') {
							combineDoneFunctionStack.push(callback);
						} else {
							throw new Error("callbacks is not a function!");
						}

						// Create a combinedDeferrer. This deferrer's then callback will
						// execute all done callbacks of the stack.
						combinedDeferrer.then(function () {
							var f,
								thenArgs = Array.prototype.slice.call(arguments);

							if (combineDoneFunctionStack.length > 0) {
								while (f = combineDoneFunctionStack.pop()) {
									f.apply(self, thenArgs);
								}
							}
						});

						return this;
					};
					
					return that;
				}
			};
		}
	};
} ());