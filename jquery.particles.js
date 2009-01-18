/**
* jQuery Particles is a simple function that takes an array of objects (or elements) and
* processes each item against a callback function. It is the duty of the callback function
* to handle the animation of the items, this library just helps in managine the processing
* task.
*
* @usage $.particles(items, function, [speed]) or $(some selector query).particles(function, [speed])
* 
* @param items An array or object of items/elements to use
* @param function The name of a preset to use or a custom function. The scope is in reference to the current item. To end processing simply declare 'return' to break
* @param speed [Optional] Similar to jQuery.animate where you can pass the name of a speed or the milliseconds to delay
*
* @return returns the function with 'start' and 'stop' functions attached to control the processing. eg function.start() or function.stop()
*/
(function($) {
  // we store all our threads so we can stop and unload the resources when the user leaves the page
  var threads = {};
  
  function Particles(objects, callback, speed) {
  	var args = $.makeArray(arguments);
  	this._objects = objects;
  	this._callback = callback;
  	this.speed = (speed && speed.constructor == Number ? speed : jQuery.fx.speeds[speed]) || jQuery.fx.speeds.def;
  	this._args = args[3].length !== undefined ? args[3] : args.slice(0, 3);
  }
  $.extend(Particles.prototype, {
  	start: function() {
  		var particles = this;
  		this.stop();
  		this._interval = setInterval(function() {
  			particles._process();
  		}, this.speed);
  		threads[this._interval] = this;
  		
  		this.step = 1;
  	},
  	stop: function() {
  		if (this._interval) {
  			clearInterval(this._interval);
  			this._interval = threads[this._interval] = undefined;
  		}
  	},
  	_process: function() {
  		var length = this._objects.length;
  		this.index = 0;
  		if (length == undefined) {
		    for (name in this._objects) {
		      if (this._callback.apply(this, $.merge([this._objects[name]], this._args)) === false)
		        return this.stop();
		      // increment our own counter so we can keep track and let our callback know which index we're at
		      ++this.index;
		    }
		  } else {
		    for (var value = this._objects[0]; this.index < length; value = this._objects[++this.index]) {
		      if (this._callback.apply(this, $.merge([this._objects[this.index]], this._args)) === false)
		        return this.stop();
		    }
		  }
  		++this.step;
  		this.index = undefined;
  	}
  });
  
  $.particles = function(object, callback, speed) {    
  	var args = $.makeArray(arguments);
    // work out if the callback is a preset or a function
    if ((typeof callback == 'string' && !(callback = $.particles.presets[callback])) || !$.isFunction(callback)) {
      throw new Exception("Exception, expected particle preset or function but I don't know what I got");
    }
    
    // any appended arguments should be passed to the callback
    args = args.slice(0, 3);
    
    var particles = new Particles(object, callback, speed, args);
    particles.start();
    return particles;
  }
  // Some particle presets which can be used
  $.particles.presets = {};
  
  $.fn.particles = function(callback, speed) {
    // make sure all elements are absolute, be silly otherwise and cause page chaos
    this.css('position', 'absolute');
    return $.particles(this, callback, speed);
  }
  
  // stop all threads when page unloads
  $(window).unload(function() {
    $.each(threads, function(interval, particle) {
      particle.stop();
    });
  })
})(jQuery);
