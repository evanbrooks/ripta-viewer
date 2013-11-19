function ViewControl(el, mapControl, mapsvg) {
  var isPanning = false
    , frame  = 1000 / 60 // ms per frame
    , buffer = -100        // px on each side
    , start  = {x:0, y:0}
    , lastRedraw  = {x:0, y:0}
    , curr   = {x:0, y:0}
    , delta  = {x:0, y:0}
    , prev   = {x:0, y:0}
    , vel    = {x:0, y:0}
    , $el    = $(el)
    , $inner = $el.parent()
    , $container = $inner.parent()
    , $back  = $container.parent()
    , limiter = $(window).width()
    , xlimit = 1400 * (agency.lon.max - agency.lon.min)
    , ylimit = 1400 * (agency.lat.max - agency.lat.min)
    , currZoom = 1
    , w = this.w = $(window).width()
    , h = this.h = $(window).height()
    , xMin   = mapControl.scale.x.min
    , yMin   = mapControl.scale.y.min
    , xMax   = mapControl.scale.x.max
    , yMax   = mapControl.scale.y.max;

  var self = this;
  var view = { xMin: 0, xMax: xlimit, yMin: 0, yMax: ylimit};
  self.getCurr = function() { return curr; };
  self.getZoom = function() { return currZoom; };


  // Constructor
  // -----------
  bindEvents();
  // mapsvg.append("rect")
  //   .attr("id", "viewportPreview")
  //   .attr("fill", "transparent")
  //   .attr("stroke", "black")
  //   .attr("stroke-width", 0.15);

  function bindEvents() {
    $back.mousedown(begin);
    $back.on("touchstart", begin);
    $("html").mousemove(move);
    $("html").on("touchmove", move);
    $("html").mouseup(end);
    $("html").on("touchend", end);
    $("html").mouseleave(end);
    $("#zoom-slide").change(function(e){
      currZoom = this.value;
      zoomTo(this.value);
    });
    $("#rotate-slide").change(function(e){
      rotateTo(this.value);
    });

    $(window).resize(function(){
      w = this.w = $(window).width();
      h = this.h = $(window).height();
    });

    $back.on( 'DOMMouseScroll mousewheel', function(e) {
      scrollZoom(e.originalEvent.wheelDelta);
    });
  }

  // Public Methods
  // ---------------
  this.isPanning = function() { return isPanning; };
  this.getUnique = function() {
    return ("" + curr.x + "" + curr.y + "" + currZoom);
  };
  this.zoomTo = zoomTo;

  // Private Methods
  // ---------------

  function begin(event) {
    isPanning = true;
    $container.addClass("panning");
    start = { x: mouse.x - curr.x,
              y: mouse.y - curr.y };
    lastRedraw  = { x: curr.x, y:curr.y };
    vel = { x:0, y:0 };
    d3.timer(velCheck, frame);
  }

  function move(event) {
    mouse = { x: event.pageX,
              y: event.pageY };

    if (isPanning) {
      curr  = { x: mouse.x - start.x,
                y: mouse.y - start.y };

      drawMap();
    }
  }

  function end(event) {
    isPanning = false;
    d3.timer(coastStep, frame);
  }

  function drawMap() {

    if (xlimit > w){
      if (curr.x > 0) curr.x = 0;
      var edgeX = -1*(xlimit - w);
      if (curr.x < edgeX) curr.x = edgeX;
    }
    if (ylimit > h){
      if (curr.y > 0) curr.y = 0;
      var edgeY = -1*(ylimit - h);
      if (curr.y < edgeY) curr.y = edgeY;
    }

    $container.tform(curr.x, curr.y);

    //tilemap.center({lon: xScale.invert(w/2 - curr.x), lat: yScale.invert(h/2 - curr.y)}).zoom((currZoom + 40) / 4);


    delta = { x: lastRedraw.x - curr.x,
              y: lastRedraw.y - curr.y };

    updateFakeViewPort();

    // If we've used up the buffer trigger a redraw and reset the
    // buffer to allow for future redraws within this drag event
    if ( Math.abs(delta.x) > Math.abs(buffer) || Math.abs(delta.y) > Math.abs(buffer)) {
      //console.log("redraw");
      mapControl.redrawStopsShapes();
      lastRedraw  = { x: curr.x, y: curr.y };
    }
  }

  this.move_to = function(center) {
    var target = center;
    var dx = curr.x - center.x;
    var dy = curr.y - center.y;

    var counter = 5;

    d3.timer(function(){
      if (counter > 0) {
        curr.x -= dx/5;
        curr.y -= dy/5;
        counter --;
        $container.tform(curr.x, curr.y);
        return false;
      }
      else {
        drawMap();
      }
    });
  };

  function zoomTo(zoom, center){

    // mapControl.pause();

    var zoomCenter = center || { x: w/2, y: h/2};
    currZoom = parseFloat(zoom);
    prevCenter = getCenter(center);
    xlimit = 1400 * (agency.lon.max - agency.lon.min) * zoom;
    ylimit = 1400 * (agency.lat.max - agency.lat.min) * zoom;

    mapControl.yScale.range( [ ylimit, 0    ] );
    mapControl.xScale.range( [ 0    , xlimit] );

    curr.x = zoomCenter.x - prevCenter.x * xlimit;
    curr.y = zoomCenter.y - prevCenter.y * ylimit;

    $container.tform(curr.x, curr.y);
    //tilemap.center({lon: xScale.invert(w/2 - curr.x), lat: yScale.invert(h/2 - curr.y)}).zoom((currZoom + 40) / 4);

    $el.css({"width": xlimit, "height": ylimit});

    // $container.css({
    //   "-webkit-transition": "-webkit-transform 0.5s",
    //   "-webkit-transform-origin": zoomCenter.x + "px " + zoomCenter.y + "px",
    //   "-webkit-transform": "scale(" + zoom + ")"
    // })

    updateFakeViewPort();
    mapControl.redrawZoom(currZoom);

    if (currZoom > 25) {
      $("body").removeClass("zoom");
      $("body").addClass("zoom2");
    }
    else if (currZoom > 5) {
      $("body").addClass("zoom");
      $("body").removeClass("zoom2");
    }
    else {
      $("body").removeClass("zoom");
      $("body").removeClass("zoom2");
    }
  }

  function updateFakeViewPort() {
      view.xMin = -curr.x + buffer;
      view.yMin = -curr.y + buffer;
      view.xMax = -curr.x + w - buffer*2;
      view.yMax = -curr.y + h - buffer*2;
  }

  function scrollZoom(scroll) {
    currZoom += parseFloat(0.005 * scroll);
    if (currZoom < 0.5) {
      currZoom = 0.51;
    }
    $("#zoom-slide").val(currZoom);
    zoomTo(currZoom, { x: mouse.x, y: mouse.y});
  }

  function rotateTo(angle) {
    $el.css("-webkit-transform","rotate("+angle+"deg)");
  }

  function getCenter(center) {
    // prevCenter is the distance from the mouse cursor tp
    // the top-left corner of the map as a percentage of the map
    // size. If the mouse isn't specified fall back to the
    // center of the viewport
    viewCenter = center || { x: $(window).width()/2, y: $(window).height()/2 };
    return {
      x: (viewCenter.x - $inner.offset().left) / xlimit,
      y: (viewCenter.y - $inner.offset().top) / ylimit
    };
  }

  function velCheck() {
    if (isPanning) {
      vel = { x: curr.x - prev.x,
              y: curr.y - prev.y };
      prev = { x: curr.x, y: curr.y };
      return false; // continue timer
    }
    else return true;  // end timer
  }

  function coastStep() {
    if (isPanning) return true;                   // stop timer
    vel.x = parseInt( vel.x * 0.9 * 100, 10 ) / 100;  // 2 decimal precision
    vel.y = parseInt( vel.y * 0.9 * 100, 10 ) / 100;
    if (Math.abs(vel.x + vel.y) < 0.05) {
      mapControl.redrawStopsShapes();
      $container.removeClass("panning");
      return true;                                // stop timer
    }
    else {
      curr = { x: parseFloat( curr.x + vel.x),
               y: parseFloat( curr.y + vel.y) };
      drawMap();
      return false;                               // continue timer
    }
  }

  this.isInView = isInView;
  function isInView(obj, index, array) {
    var x = mapControl.xScale(obj.x);
    var y = mapControl.yScale(obj.y);
    if ( x > view.xMax ||
         x < view.xMin ||
         y > view.yMax ||
         y < view.yMin ) {
      return false;
    }
    else return true;
  }
}