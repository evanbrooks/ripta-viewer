function Map(el) {

	// Layers
	// ------

	   var map = d3.select(el),
  shapeLayer = map.select(".shapes"),
	 stopLayer = map.select(".stops"),
    busLayer = map.select(".buses");

	// Scale
	// -----

  var latScale, lonScale;
  setupScales();

  // Controllers
  // ----------

  var panzoom = new PanZoomControl(el),
  stopControl = new StopControl(),
 shapeControl = new ShapeControl(),
  tripControl = new TripControl();
  timeControl = new TimeControl();

  this.shapeControl = shapeControl;

  shapeControl.create();

  this.makeStops = function(){
  	stopControl.create(stops);
  	stopControl.show();
  }

  this.makeBus = function(time){
    tripControl.set(time);
  }

	// Stops
	// -----

	function StopControl() {
    var loaded = false;
    var visible = false;

    // Constructor
    // -----------
    bindEvents();

    // Public methods
    // --------------

    this.create = create;
    this.refresh = refresh;
    this.show = show;
    this.hide = hide;
    this.toggle = toggle;

    // Private methods
    // ---------------
    function bindEvents() {
      $("#stopCheck").change(function(e) {
        if (!loaded) create(stops);
        else toggle();
      });
    }

    function create(data) {
      visible = true;
      loaded = true;
	    stopLayer.selectAll(".stop")
	      .data(data)
	      .enter()
	      .append("circle")
	      .attr("class", "stop")
        .attr("id", function(d) { return parseInt(d.id, 10) })
	      .attr("cx", function(d) { return lonScale(d.lon)    })
	      .attr("cy", function(d) { return latScale(d.lat)    });
        //.attr("title", function(d) { return d.name } )
      show();
	  }

	  function refresh() {
	    stopLayer.selectAll(".stop")
	      .attr("cx", function(d) { return lonScale(d.lon) })
	      .attr("cy", function(d) { return latScale(d.lat) });
    }

    function hide(){
      visible = false;
      stopLayer.selectAll(".stop")
        .transition()
        .delay(function(d, i) { return i; })
        .attr("r",0);
    }

    function show(){
      visible = true;
      stopLayer.selectAll(".stop")
        .transition()
        .delay(function(d, i) { return i; })
        .attr("r",1);
	  }
    function toggle(){
      if (visible) hide();
      else show();
    }
	}

	// Shapes
	// ------

	function ShapeControl() {
    var visible = true,
    smoothStart = 0.002,
     smoothness = smoothStart;
    // Constructor
    // -----------
    bindEvents();

    // Public methods
    // --------------

    this.hide = hide;
    this.show = show;
	  this.create = create;
    this.setSmooth = setSmooth;
	  this.refresh = refresh;

    // Private methods
    // ---------------

    function create() {
      console.log(smoothness);
      simplifiedShapes = shapes.map( function(shape) {
        return simplify(shape.pt,smoothness);
      });

      var shapedata = shapeLayer.selectAll(".line")
        .data(simplifiedShapes)

      // Redraw existing lines
      refresh();

      // Add new lines
      shapedata.enter()
        .append("svg:path")
        .attr("d", pathMaker)
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .attr("class", "line");
    }

    function refresh() {
      shapeLayer.selectAll(".line")
        .attr("d", pathMaker)
    }

    function setSmooth(s) {
      smoothness = s * smoothStart;
      create();
    }

    function bindEvents() {
      $("#shapeCheck").change(function(e) {
        if (visible) hide();
        else show();
      });
    }

    function hide() {
      visible = false;
      shapeLayer.selectAll(".line")
        .attr("stroke-width", "0")
    }

    function show() {
      visible = true;
      shapeLayer.selectAll(".line")
        .attr("stroke-width", "1")
    }

	  var pathMaker = d3.svg.line()
	  	.y(function(d) { return latScale(d.y) })
	  	.x(function(d) { return lonScale(d.x) })
	  	.interpolate("monotone"); // "basis" for smoother
	}

	// Trips
	// -----

	function TripControl() {

    // Public methods
    // --------------

    this.set = function(time) {
      displayBus(time);
    }

    this.refresh = updatePos;

    // Private methods
    // ---------------

    function updatePos() {
      busLayer.selectAll(".bus").select("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform",
          function(d) {
            return "translate("+lonScale(d.x)+","+latScale(d.y)+") rotate("+d.a+")"; });

      busLayer.selectAll(".bus").select("text")
          .attr("x", function(d) { return lonScale(d.x) })
          .attr("y", function(d) { return latScale(d.y) });
    }

    function displayBus(time) {
      var currentBus = getData(time);

      // Main
      // ----
      var bus = busLayer
        .selectAll(".bus")
        .data(currentBus, function(d) { return d.id; });

      // Move existing buses
      // -------------------
      updatePos();

      // Add new buses
      // -------------
      var busEnter = bus.enter().append("g").attr("class", "bus");
          busEnter.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("transform",
                function(d) {
                  return "translate("+lonScale(d.x)+","+latScale(d.y)+") rotate("+d.a+")"; })
              .attr("height", 0)
              .attr("width", 0)
              .attr("fill", "lime")
              .transition()
                .attr("height", 2)
                .attr("width", 5)
              .transition()
                .attr("fill", "blue");
          busEnter.append("text")
              .text(function(d) { return d.id })
              .attr("fill", "blue")
              .attr("x", function(d) { return lonScale(d.x) })
              .attr("y", function(d) { return latScale(d.y) })

      // Remove old buses
      // ---------------
      var busExit = bus.exit();
          busExit.select("rect")
            .transition()
              .attr("fill", "red")
            .transition()
              .attr("width",0)
              .attr("height",0)
            .remove();

          busExit.remove();
    }

    function getData(time) {
      currentBus = [];
      trips.forEach(function(trip){
        if (trip.stop.length > 0){
          var interp = interpolateBus(trip.stop, time);
          if (interp == -1) {
            //console.log("not active");
            return;
          }
          var bus = { sign: trip.sign,
                         x: interp.x,
                         y: interp.y,
                         a: interp.a,
                        id: trip.id };
          currentBus.push(bus);
        }
        else {
          //console.log("no stops?");
        }
      });
      return currentBus;
    }

    function interpolateBus(tripStops, time) {
      var index = tBisector.left(tripStops, time, 0, tripStops.length-1),
      a = tripStops[index];
      aPoint = stopsIndexed[parseInt(a.id, 10)];
      if (index < 1) {
        if ( a.t > time ) {
          return -1; // time is earlier than the first stop, => trip hasn't begun
        }
        else {
          return { x: aPoint.x,
                   y: aPoint.y,
                   a: 0 };
        }
      }
      else if (index == tripStops.length-1 && a.t < time) {
        return -1; // time is later than the last stop, => trip has ended
      }
      else {
        var b = tripStops[index-1];
        bPoint = stopsIndexed[parseInt(b.id, 10)];
        t = (time-a.t)/(b.t-a.t);
        return { x: (aPoint.x * (1-t) + bPoint.x * t),
                 y: (aPoint.y * (1-t) + bPoint.y * t),
                 a: Math.atan2(
                      aPoint.y - bPoint.y,
                      aPoint.x - bPoint.x ) * (180 / Math.PI) };
      }
    }

    var tBisector = d3.bisector(function(d){return d.t})
	}

  // Time Control
  // ------------

  function TimeControl() {

    // Constructor
    // -----------

    bindEvents();

    // Private methods
    // ---------------
    function bindEvents() {
      $("#time-slide").change(function(e){
        tripControl.set(this.value);
      });
    }

    //setInterval(runOnce, 500);
    var t = 0;
    function runOnce() {
      tripControl.set(t);
      t += 0.1;
      console.log(t);
    }

  }

	// Panning
	// -------

	function PanZoomControl(el) {
		var isPanning = false,
		        start = {x:0, y:0},
            delta = {x:0, y:0},
            curr  = {x:0, y:0},
            prev  = {x:0, y:0},
             vel  = {x:0, y:0},
							$el = $(el),
					 $inner = $el.parent(),
       $container = $inner.parent(),
            $back = $container.parent(),
       			limit = 800,
       	 currZoom = 1,
    panTimer,
    coastTimer;

    // Constructor
    // -----------
    bindEvents();

    function bindEvents() {
	    $back.mousedown(begin);
	    $("html").mousemove(move);
      $("html").mouseup(end);
      $("html").mouseleave(end);
	    $("#zoom-slide").change(function(e){
        currZoom = this.value;
	    	zoomTo(this.value);
	    });
	    $("#rotate-slide").change(function(e){
	    	rotateTo(this.value);
	    });

			$back.on( 'DOMMouseScroll mousewheel', function(e) {
				scrollZoom(e.originalEvent.wheelDelta);
			});
		}

    // Private Methods
    // ---------------

    function begin(event) {
      isPanning = true;
      start.x = event.pageX - curr.x;
      start.y = event.pageY - curr.y;
      coastTimer = clearInterval(coastTimer);
      vel = { x:0, y:0 };
      panTimer = setInterval(velCheck, 15);
    }
    function move(event) {
      if (isPanning) {
        curr.x = event.pageX - start.x;
        curr.y = event.pageY - start.y;

        width = $(window).width();
        height = $(window).height();

        if (curr.x >  width  + limit) curr.x =  width  + limit;
        if (curr.y >  height + limit) curr.y =  height + limit;
        if (curr.x < -limit         ) curr.x = -limit;
        if (curr.y < -limit         ) curr.y = -limit;

        $container.tform(curr.x, curr.y);
      }
    }
    function end(event) {
      isPanning = false;
      clearInterval(panTimer);
      coastTimer = setInterval(coastStep, 15);
    }

    function zoomTo(zoom){
    	currZoom = parseFloat(zoom);
      prevCenter = getCenter();
      limit = 800*zoom;

      latScale.range( [ limit, 0    ] );
      lonScale.range( [ 0    , limit] );

      curr.x = $(window).width()/2 - prevCenter.x * limit;
      curr.y = $(window).height()/2 - prevCenter.y * limit;

      $el.css({"width": limit, "height": limit});

      $container.tform(curr.x, curr.y);

      stopControl.refresh();
      shapeControl.setSmooth(1/currZoom);
      tripControl.refresh();
    }

    function scrollZoom(scroll) {
    	currZoom += parseFloat(0.005 * scroll);
    	if (currZoom < 0.5) {
    		currZoom = 0.51;
    	}
    	$("#zoom-slide").val(currZoom);
    	zoomTo(currZoom);
    }

    function rotateTo(angle) {
      $el.css("-webkit-transform","rotate("+angle+"deg)");
    }

    function getCenter() {
      // prevCenter is the distance from the viewport center to
      // the top-left corner of the map as a percentage of the map
      // size
      viewCenter = { x: $(window).width()/2, y: $(window).height()/2 };
      return {
      	x: (viewCenter.x - $inner.offset().left) / limit,
      	y: (viewCenter.y - $inner.offset().top) / limit
      };
    }

    function velCheck() {
      vel = { x: curr.x - prev.x, 
              y: curr.y - prev.y };
      prev = { x: curr.x, y: curr.y };
    }

    function coastStep() {
      // 2 decimal precision
      vel.x = parseInt( vel.x * 0.9 * 100 ) / 100; 
      vel.y = parseInt( vel.y * 0.9 * 100 ) / 100;
      if (Math.abs(vel.x + vel.y) < 0.01) {
        clearInterval(coastTimer);
        return;
      }
      curr = { x: parseFloat( curr.x + vel.x),
               y: parseFloat( curr.y + vel.y) };
      $container.tform(curr.x, curr.y);
    }
 	}

	// Scales
	// ------
	function setupScales() {
	  latScale = d3.scale.linear()
	    .domain([agency.lat.min, agency.lat.max])
	    .range([800, 0]); // reversed because lat is measured west of meridian
	  lonScale = d3.scale.linear()
	    .domain([agency.lon.min, agency.lon.max])
	    .range([0, 800]);
  }
}

// --------------------------------------------------------

// These are simple JQuery plugins to make
// CSS3 transforms simple

(function( $ ){
  $.fn.tform = function(x,y){
    this.css(
      "-webkit-transform",
      "translate3d("+x+"px,"+y+"px,0)"
    );
  }
})( jQuery );