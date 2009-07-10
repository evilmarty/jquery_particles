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
  	// cache the length to save on performance
  	this.length = this._length();
  }
  $.extend(Particles.prototype, {
    _length: function() {
      if (this._objects.length == undefined) {
        var length = 0;
        $.each(this._objects, function() { ++length; });
        return length;
      }
      else {
        return this._objects.length;
      }
    },
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
  	var args = $.makeArray(arguments).slice(3);
    // work out if the callback is a preset or a function
    if ((typeof callback == 'string' && !($.particles.presets[callback] && (callback = $.particles.presets[callback].apply(window, $.merge([object], args))))) || !$.isFunction(callback)) {
      throw new Exception("Exception, expected particle preset or function but I don't know what I got");
    }
    
    var particles = new Particles(object, callback, speed, args);
    particles.start();
    return particles;
  }
  
  $.fn.particles = function(callback, speed) {
  	var args = $.merge([this], arguments);
    // make sure all elements are absolute, be silly otherwise and cause page chaos
    this.css('position', 'absolute');
    return $.particles.apply($, args);
  }
  
  // Some particle presets which can be used
  $.particles.presets = {
    // Rotate particles in a circular motion
    'circular': function(objects, options) {
      var halfpi = Math.PI / 180, parent = objects.parent();
      options = $.extend({
        radius: (Math.sqrt(parent.width() * parent.width() + parent.height() * parent.height()) / (parent.width() / parent.height())) / 2,
        spacing: null,
        startAngle: 0,
        stepAmount: 3,
        direction: 1
      }, options || {});
      
      // make sure we have correct direction
      switch (options.direction) {
        case 'counterclockwise':
        case 'counter':
        case 'reverse':
        case -1:
        case false:
          options.direction = -1;
          break;
        default:
          options.direction = 1;
      }
      
      // Even though the options will be passed as the second parameter, we want to use the modified one we were given upon initialisation. We've done a few changes etc and like to keep them.
      return function(item) {
        // width and height are used to help calculate the radius of the element (yes I know it's a square)
        var width = $(item).width(),
            height = $(item).height(),
            angle = options.startAngle + (options.spacing || 360 / this.length) * this.index + (this.step * options.stepAmount),
            radius = options.radius == null ? Math.sqrt(width * width + height * height) / 2 : options.radius,
            cx = $(item).parent().width() / 2,
            cy = $(item).parent().height() / 2,
            x = cx + radius * Math.cos(angle * halfpi * options.direction),
            y = cy + radius * Math.sin(angle * halfpi * options.direction);
        $(item).css({left: Math.round(x) + 'px', top: Math.round(y) + 'px'});
      }
    },
    'flies': function(objects, options) {
      var parent = objects.parent().css('position', 'relative'), width = parent.width(), height = parent.height();
      
      options = $.extend(options, {
        decisiveness: 0.95,
        acceleration: 10,
        speed: 10
      });
      
      function randomPoint(w, h, width, height) {
        return [Math.round((Math.random() * width - (w * 2)) + w), Math.round((Math.random() * height - (h * 2)) + h)];
      }
      
      $.each(objects, function() {
        var position = randomPoint(width, height);
        $(this)
          .css({position: 'absolute', left: position[0], top: position[1]})
          .data('flies:dx', 0)
          .data('flies:dy', 0)
          .data('flies:destination', randomPoint($(this).width(), $(this).height(), width, height));
      });
      
      return function(fly) {
        var destination = $(fly).data('flies:destination'),
          left = parseInt($(fly).css('left')),
          top = parseInt($(fly).css('top')),
          x = destination[0] - left,
          y = destination[1] - top,
          len = Math.sqrt(x * x + y * y) + .1, // just ensuring we don't have a zero
          dx = options.speed * (x / len),
          dy = options.speed * (y / len),
          _dx = $(fly).data('flies:dx'),
          _dy = $(fly).data('flies:dy'),
          ddx = (dx - _dx) / options.acceleration,
          ddy = (dy - _dy) / options.acceleration;
        dx = isNaN(_dx) ? 0 : _dx + ddx;
        dy = isNaN(_dy) ? 0 : _dy + ddy;
        $(fly)
          .css({left: left + dx, top: top + dy})
          .data('flies:dx', dx)
          .data('flies:dy', dy);

        if (Math.random() > options.decisiveness) {
          $(fly).data('flies:destination', randomPoint($(fly).width(), $(fly).height(), width, height));
        }
      }
    }
  };
  
  // stop all threads when page unloads
  $(window).unload(function() {
    $.each(threads, function(interval, particle) {
      particle.stop();
    });
  })
})(jQuery);