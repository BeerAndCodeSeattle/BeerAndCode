const BUBBLE_WIDTH_MAX = 18;
const BUBBLE_WIDTH_MIN = 2;
const BUBBLE_DISTANCE_MIN = 2;
const BUBBLE_DISTANCE_MAX = 10;

var Carbonate = function(opts) {
  
  function mergeOptions(opt1, opt2) {
    var opt3 = {};
    for (attrname in opt1) {
      opt3[attrname] = opt1[attrname];
    }

    for (attrname in opt2) {
      opt3[attrname] = opt2[attrname];
    }

    return opt3;
  }

  //var options = opts || { debug: false, fps: 25, num_bubbles_at_a_time: 2 };
  var options = mergeOptions({ 
    debug: false, 
    fps: 25, 
    num_bubbles_at_a_time: 2, 
    min_bubble_distance: BUBBLE_DISTANCE_MIN, 
    max_bubble_distance: BUBBLE_DISTANCE_MAX,
    min_bubble_width: BUBBLE_WIDTH_MIN,
    max_bubble_width: BUBBLE_WIDTH_MAX
  }, opts);

  function createCanvas() {

    // Insert Canvas into content area
    canvas = document.createElement('canvas');
    canvas.id = 'bubble_canvas';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = (-1);
    document.body.insertBefore(canvas, document.body.childNodes[0]);
    return canvas;
  }


  function each(f, arr) {
    if (arr.length > 0) {
      f(arr[0]);
      each(f, arr.slice(1));
    }
  }
  
  function resize(carbs) {
    return function () {
      var framework = carbs;
      clearCanvas(framework.the_context);
      framework.resetHeight();
      framework.canvas_width = framework.the_canvas.width;
      framework.canvas_height = framework.the_canvas.height;
      framework.drawBubbles();
    }
  }

  function clearCanvas(context) {
    context.clearRect(0, 0, carbonate.the_canvas.width, carbonate.the_canvas.height);
  }

  function numberGenerator(minValue, maxValue) {
    var number = Math.floor(Math.random() * maxValue);
    return (number < minValue ? minValue : number); 
  }

  function generateXValue(width) {
    return numberGenerator(0, width);
  }

  function generateYValue(height) {
    return numberGenerator(0, height);
  }

  function makePoint(x, y) {
    return { x: x, y: y };
  }


  var carbonate = {
    options: options,
    bubble_interval: 0,
    bubble_holder: [],
    canvas_ref: null,
    canvas_bottom: 0,
    bubble_id_count: 1,
    fps: options.fps,
    debug: options.debug,
    num_bubbles_at_a_time: options.num_bubbles_at_a_time,
    timeInterval: function() {
      return 1000 / this.fps;
    },
    canvas_width: 0,
    canvas_height: 0,
    the_canvas: createCanvas(),
    the_context: null,
    addBubble: function(bubble) {
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
    start: function() {
      this.resetHeight();
      this.canvas_width = this.the_canvas.width;
      this.canvas_height = this.the_canvas.height;
                    
      this.the_context = this.the_canvas.getContext('2d');
      this.the_context.strokeStyle = '#161001';
      this.the_context.lineWidth = 1;
      this.initBubbles();
    },
    stop: function() {
      clearInterval(this.bubble_interval);
      clearCanvas(this.the_context);
      this.bubble_interval = 0;
      this.bubble_id_count = 1;
      this.bubble_holder = [];
      
    },
    makeBubble: function (id, centerPoint, width) {
      var that = this;
      return {
        bubbleId: id,
        centerPoint: centerPoint,
        width: width,
        distance: function () { return numberGenerator(that.options.min_bubble_distance, that.options.max_bubble_distance); },
        getBubbleId: function () { return this.bubbleId; },
        drawBubble: function () {
          var width = this.width,
          centerPoint = this.centerPoint,
          context = that.the_context;
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
      each(
        function (b) { if (b) { b.drawBubble(); } },
          this.bubble_holder
      );
    },
    resetHeight: function () {
      var canvas = this.the_canvas;
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
            bubbleId = that.bubble_id_count++;
              
            // Create a new bubble and add it to the holder
            bubble = that.makeBubble(
              bubbleId,
              makePoint(
                generateXValue(that.canvas_width),
                generateYValue(that.canvas_height)
              ),
              numberGenerator(that.options.min_bubble_width, that.options.max_bubble_width)
            );
              
            that.addBubble(bubble);
            clearCanvas(that.the_context);
            each(
              startFloating,
              that.bubble_holder
            );
          }
        },
        this.timeInterval()
      );
      if (that.debug) { debug_interval = that.bubble_interval; }
    }
  };

  if (carbonate.the_canvas.getContext) {
    if (window.addEventListener) {
      window.addEventListener("resize", resize(carbonate), false);
    } else if (window.attachEvent) {
      window.attachEvent("onresize", resize(carbonate));
    }
  }

  return carbonate;
}
