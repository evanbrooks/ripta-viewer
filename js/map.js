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

  shapeControl.create(shapes);

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
	  this.create = function(data) {
	    stopLayer.selectAll(".stop")
	      .data(data)
	      .enter()
	      .append("circle")
	      .attr("class", "stop")
	      .attr("title", function(d) { return d.name } )
	      .attr("cx", function(d) { return lonScale(d.lon) })
	      .attr("cy", function(d) { return latScale(d.lat) });
	  }
	  this.refresh = function() {
	    stopLayer.selectAll(".stop")
	      .attr("cx", function(d) { return lonScale(d.lon) })
	      .attr("cy", function(d) { return latScale(d.lat) });
    }
    this.hide = function(){
      stopLayer.selectAll(".stop")
        .transition()
        //.delay(function(d, i) { return i * 5; })
        .attr("r",0);
    }
    this.show = function(){
      stopLayer.selectAll(".stop")
        .transition()
        //.delay(function(d, i) { return i * 5; })
        .attr("r",2);
	  }
	}

	// Shapes
	// ------

	function ShapeControl() {
	  this.create = function(data) {
	   	shapeLayer.selectAll(".line")
        .data(data)
        .enter()
        .append("svg:path")
        .attr("d", pathMaker)
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .attr("class", "line");
	  }
	  this.refresh = function() {
	   	shapeLayer.selectAll(".line")
        .attr("d", pathMaker)
    }

	  var pathMaker = d3.svg.line()
	  	.y(function(d) { return latScale(d.y) })
	  	.x(function(d) { return lonScale(d.x) })
	  	.interpolate("monotone"); // "basis" for smoother
	}

	// Trips
	// -----

	function TripControl() {

    //currentBus = [];

    this.set = function(time) {
      displayBus(time);
    }

    this.refresh = function(time) {
      busLayer
        .selectAll(".bus")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform",
          function(d) {
          return "translate("+lonScale(d.x)+","+latScale(d.y)+") rotate("+d.a+")"; });
    }

    function displayBus(time) {
      var currentBus = getData(time);

      var bus = busLayer
        .selectAll(".bus")
        .data(currentBus, function(d) { return d.id; });

      bus.transition()
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform",
          function(d) {
          return "translate("+lonScale(d.x)+","+latScale(d.y)+") rotate("+d.a+")"; });

      bus.enter()
        .append("rect")
        //.attr("x", function(d) { return lonScale(d.y) })
        //.attr("y", function(d) { return latScale(d.x) })
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform",
          function(d) {
          return "translate("+lonScale(d.x)+","+latScale(d.y)+") rotate("+d.a+")"; })
        .attr("height", 0)
        .attr("width", 0)
        .attr("class", "bus")
        .transition()
        .attr("height", 2)
        .attr("width", 5)


      bus.exit()
        .transition()
        .attr("width",0)
        .attr("height",0)
        .remove();
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
      aPoint = stops[parseInt(a.id, 10)];
      if (index < 1) {
        if ( a.t > time ) {
          return -1;
        }
        else {
          return { x: aPoint.x,
                   y: aPoint.y,
                   a: 0 };
        }
      }
      else if (index == tripStops.length-1 && a.t < time) {
        return -1;
      }
      else {
        var b = tripStops[index-1];
        bPoint = stops[parseInt(b.id, 10)];
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
    //
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
    pantimer,
    coasttimer;

    bindEvents();

    function bindEvents() {
	    $back.mousedown(begin);
	    $back.mousemove(move);
      $back.mouseup(end);
      $back.mouseleave(end);
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

    function begin(event) {
      isPanning = true;
      start.x = event.pageX - curr.x;
      start.y = event.pageY - curr.y;
      clearInterval(coasttimer);
      pantimer = setInterval(velCheck, 15);
    }
    function move(event) {
      if (isPanning) {
        curr.x = event.pageX - start.x;
        curr.y = event.pageY - start.y;
        $container.tform(curr.x, curr.y);
      }
    }
    function end(event) {
      isPanning = false;
      clearInterval(pantimer);
      coast();
    }

    function zoomTo(zoom){
    	currZoom = parseFloat(zoom);
      prevCenter = getCenter();
      limit = 800*zoom;

      if ( isNaN(limit)) {
        console.log(zoom);
        console.log(limit);
        console.log("limit is broken");
        return;
      }

      latScale.range( [ limit, 0    ] );
      lonScale.range( [ 0    , limit] );

      curr.x = $(window).width()/2 - prevCenter.x * limit;
      curr.y = $(window).height()/2 - prevCenter.y * limit;

      $el.css({"width": limit, "height": limit});

      $container.tform(curr.x, curr.y);

      stopControl.refresh();
      shapeControl.refresh();
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

    function coast() {
      coasttimer = setInterval(step, 15);
      function step() {
        vel.x *= 0.9;
        vel.y *= 0.9;
        if (Math.abs(vel.x + vel.y) < 0.05) {
          clearInterval(coasttimer);
          return;
        }
        curr.x += vel.x;
        curr.y += vel.y;
        $container.tform(curr.x, curr.y);
      }
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