(function() { 
  window.carbonate = function (toggle, opts) {
    var canvas;
    var cookie_preference;
    var beer_framework = {
      debug: false,
      persist: true,
      bubble_interval: 0,
      bubble_holder: [],
      canvas_ref: undefined,
      canvas_bottom: 0,
      BUBBLE_WIDTH_MAX: 10,
      BUBBLE_WIDTH_MIN: 3,
      BUBBLE_DISTANCE_MIN: 6,
      BUBBLE_DISTANCE_MAX: 15,
      CANVAS_X_MAX: -1,
      CANVAS_Y_MAX: -1,
      bubble_id_count: 1,
      num_bubbles_at_a_time: 1,
      fps: 25,
      timeInterval: function () { return 1000 / this.fps; },
      beer_canvas: null,
      beer_context: null,
      parseOptions: function (opts) {
        if (opts) {
          // Debug option
          if (opts['debug']) {
            var o = opts['debug'];
            if (typeof o === 'string') {
              // They probably meant to give me a boolean
              this.debug = o.toLowerCase() === 'true' ? true : false;
            } else {
              this.debug = o;
            }
          }
          // Bubble Width
          if (opts['BUBBLE_WIDTH_MIN'] && typeof opts['BUBBLE_WIDTH_MIN'] === 'number') {
            this.BUBBLE_WIDTH_MIN = opts['BUBBLE_WIDTH_MIN'];
          }
          if (opts['BUBBLE_WIDTH_MAX'] && typeof opts['BUBBLE_WIDTH_MAX'] === 'number') {
            this.BUBBLE_WIDTH_MAX = opts['BUBBLE_WIDTH_MAX'];
          }
          
          // Bubble Distance
          if (opts['BUBBLE_DISTANCE_MIN'] && typeof opts['BUBBLE_DISTANCE_MIN'] === 'number') {
            this.BUBBLE_DISTANCE_MIN = opts['BUBBLE_DISTANCE_MIN'];            
          }
          
          if (opts['BUBBLE_DISTANCE_MAX'] && typeof opts['BUBBLE_DISTANCE_MAX'] === 'number') {
            this.BUBBLE_DISTANCE_MAX = opts['BUBBLE_DISTANCE_MAX'];
          }
          
          // Number of bubbles to make at once
          if (opts['num_bubbles_at_a_time'] && typeof opts['num_bubbles_at_a_time'] === 'number') {
            this.num_bubbles_at_a_time = opts['num_bubbles_at_a_time'];
          }
          
          // Frames Per Second
          if (opts['fps'] && typeof opts['fps'] === 'number') {
            this.fps = opts['fps'];
          }
          
          // Use cookies
          if (opts['persist']) {
            var o = opts['persist'];
            if (typeof o === 'string') {
              this.persist = o.toLowerCase() === 'true' ? true : false; 
            } else {
              this.persist = o;
            }            
          }
        }        
      },
      clearCanvas: function () {
        this.beer_context.clearRect(0, 0, this.beer_canvas.width, this.beer_canvas.height);
      },
      getCookie: function(cookie_name) {
        var i, x, y, cookie_array = document.cookie.split(';');
        for (i = 0; i < cookie_array.length; i++) {
          x = cookie_array[i].substr(0, cookie_array[i].indexOf('='));
          y = cookie_array[i].substr(cookie_array[i].indexOf('=')+1);
          x = x.replace(/^\s+|\s+$/g,'');
          if (x === cookie_name) {
            return unescape(y);
          }
        }
      },
      setCookie: function(cookie_name, value) {
        var date, expires, final_value;
        date = new Date();
        date.setTime(date.getTime() + (7 * 25 * 60 * 60 * 1000)); // 7 days
        expires = "; expires=" + date.toGMTString();
        
        final_value = cookie_name + "=" + value + expires;
                
        document.cookie = final_value;    
      },
      head: function (arr) { return arr[0]; },
      each: function (f, arr) {
        if (arr.length > 0) {
          f(this.head(arr));
          this.each(f, arr.slice(1));
        }
      },
      numberGenerator: function (min_value, max_value) {
        var number = Math.floor(Math.random() * max_value);
        return (number < min_value ? min_value : number);
      },
      generateWidth: function () {
        return this.numberGenerator(this.BUBBLE_WIDTH_MIN, this.BUBBLE_WIDTH_MAX);
      },
      generateXValue: function () {
        return this.numberGenerator(0, this.CANVAS_X_MAX);
      },
      generateYValue: function () {
        return this.numberGenerator(0, this.CANVAS_Y_MAX);
      },
      generateDistance: function () {
        return this.numberGenerator(this.BUBBLE_DISTANCE_MIN, this.BUBBLE_DISTANCE_MAX);
      },
      makePoint: function (x, y) {
        return {
          x: x,
          y: y
        };
      },
      addBubble: function (bubble) {
        this.bubble_holder.push(bubble);
      },
      removeBubble: function (bubbleId) {
        var i, that = this;
        for(i = 0; i < that.bubble_holder.length; i += 1) {
          if(that.bubble_holder[i].getBubbleId() === bubbleId) {
            that.bubble_holder.splice(i, 1);
            return;
          }
        }
      },
      makeBubble: function (id, centerPoint, width) {
        var that = this;
        return {
          bubbleId: id,
          centerPoint: centerPoint,
          width: width,
          distance: function () { return that.generateDistance(); },
          getBubbleId: function () { return this.bubbleId; },
          drawBubble: function () {
            var width = this.width,
              centerPoint = this.centerPoint,
              context = that.beer_context;
            context.beginPath();
            context.arc(centerPoint.x, centerPoint.y, width, 0, Math.PI * 2, true);
            context.closePath();
            context.stroke();
          },
          bubble_float: function () {
            // Stop animating when it floats past
            // the top of the page and kill the bubble
            if (this.centerPoint.y < 0) {
              that.removeBubble(this.bubbleId);
              return;
            }
            
            // Raise the position a little bit
            this.centerPoint.y -= this.distance();          
          }
        };
      },
      drawBubbles: function () {
        this.each(
          function (b) { if (b) { b.drawBubble(); } },
          this.bubble_holder
        );
      },
      resetHeight: function () {
        var canvas = this.beer_canvas;
        canvas.setAttribute('width', document.body.offsetWidth);
        canvas.setAttribute('height', document.body.offsetHeight);
        this.canvas_bottom = canvas.height;
      },
      initBubbles: function () {
        var that = this;
        that.bubble_interval = setInterval(
          function () {
            var i, startFloating;
            startFloating = function (b) {
              if (b) {
                b.bubble_float();
                b.drawBubble();
              }
            };

            // Make some new bubbles
            for (i = 0; i < that.num_bubbles_at_a_time; i += 1) {
              var bubble, bubbleId, intervalId;            
              // Grab an id
              bubbleId = that.bubble_id_count;
              that.bubble_id_count += 1;
              
              // Create a new bubble and add it to the holder
              bubble = that.makeBubble(
                bubbleId,
                that.makePoint(
                  that.generateXValue(),
                  that.generateYValue()
                ),
                that.generateWidth()
              );
              
              that.addBubble(bubble);
              that.clearCanvas();
              that.each(
                startFloating,
                that.bubble_holder
              );
            }
          },
          this.timeInterval()
        );
        if (that.debug) { debug_interval = that.bubble_interval; }
      },
      commenceCarbonation: function () {
        var that = this;
        this.resetHeight();
        this.CANVAS_X_MAX = this.beer_canvas.width;
        this.CANVAS_Y_MAX = this.beer_canvas.height;
                      
        this.beer_context = this.beer_canvas.getContext('2d');
        this.beer_context.strokeStyle = '#161001';
        this.beer_context.lineWidth = 1;
        this.initBubbles();
      },
      makeToggleFunction: function (fw) {
        return function () {
          var framework = fw;
          if (framework.bubble_interval && framework.bubble_interval > 0) {
            clearInterval(framework.bubble_interval);
            framework.clearCanvas();
            framework.bubble_interval = 0;
            if (framework.persist) {
              framework.setCookie('carbonate', false);
            }
          } else {
            framework.commenceCarbonation();
            framework.setCookie('carbonate', true);
          }
        }
      },
      resize: function (fw) {
        return function () {
          var framework = fw;
          framework.clearCanvas();
          framework.resetHeight();
          framework.CANVAS_X_MAX = framework.beer_canvas.width;
          framework.CANVAS_Y_MAX = framework.beer_canvas.height;
          framework.drawBubbles();
        }
      }
    };    
    
    // Insert Canvas into content area
    canvas = document.createElement('canvas');
    canvas.id = 'bubble_canvas';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = (-1);
    document.body.insertBefore(canvas, document.body.childNodes[0]);
    
    beer_framework.beer_canvas = document.getElementById('bubble_canvas');
    
    // Check for canvas support
    if (beer_framework.beer_canvas.getContext) {      
      beer_framework.parseOptions(opts);

      // Set up the resize handler
      if (window.addEventListener) {
        window.addEventListener("resize", beer_framework.resize(beer_framework), false);
      } else if (window.attachEvent) {
        window.attachEvent("onresize", beer_framework.resize(beer_framework))
      }

      // Combine the toggle function with the user's trigger function
      if (toggle && typeof toggle === 'function') {
        toggle(beer_framework.makeToggleFunction(beer_framework));
      }
      
      // If we are using cookies, figure out if we want to start carbonated
      if (beer_framework.persist) {        
        cookie_preference = beer_framework.getCookie('carbonate');
        if (cookie_preference === undefined) {
          // No preference, huh? We'll start with bubbles
          beer_framework.setCookie('carbonate', true);
          beer_framework.commenceCarbonation();        
        } else {
          // Do we want carbonation on or off?
          if (cookie_preference && cookie_preference.toLowerCase() === "true") {
            beer_framework.commenceCarbonation();
          } else {
            // No bubbles!? Ok, return and do nothing
            return;
          }          
        }        
      } else {
        beer_framework.commenceCarbonation();        
      } 
    }
    
    // Debug stuff
    if (beer_framework.debug) {
      window.debug_framework = beer_framework;
      window.debug_interval = beer_framework.bubble_interval;
      window.debug_stop = function () { clearInterval(debug_interval); };      
    }
  };
}());
