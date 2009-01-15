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
  
  $.particles = function(object, callback, speed) {
    var length = object.length, args = $.makeArray(arguments), interval = 0;
    
    // work out if the callback is a preset or a function
    if ((typeof callback == 'string' && !(callback = $.particles.presets[callback])) || !$.isFunction(callback)) {
      throw new Exception("Exception, expected particle preset or function but I don't know what I got");
    }
    
    // any appended arguments should be passed to the callback
    args = args.slice(0, 3);
    // work out the speed of the intervals
    speed = (speed && speed.constructor == Number ? speed : jQuery.fx.speeds[speed]) || jQuery.fx.speeds.def;
    
    function process() {
      var i = 0;
      if (length == undefined) {
        for (name in object)
          if (callback.apply(object[name], args) === false)
            return false;
      } else {
        for ( var value = object[0]; i < length; value = object[++i] ) {
          if (callback.apply(value, args) !== false)
            return false;
        }
      }
    }
    
    function kill() {
      if (interval) {
        clearInterval(interval);
        interval = threads[interval] = undefined;
      }
    }
    
    function run() {
      // doubt we need to run this but we will just incase
      kill();
      interval = setTimeout(function() {
        // run the process
        if (process() === false) {
          kill();
          return;
        }
        run();
      }, speed);
      threads[interval] = interval;
    }
    
    // assign the run and kill function to the callback and return it so the initiator can kill if need be;
    callback.stop = kill;
    callback.start = run;
    
    // run our little particle thread
    run();
    // return the callback with some enhancements so our initiator can have some control if need be
    return callback;
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
    $.each(threads, function(interval) {
      clearInterval(interval);
    });
  })
})(jQuery);