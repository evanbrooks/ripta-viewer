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
 shapeControl = new ShapeControl();
  	shapeControl.create(shapes);


  this.makeStops = function(){
  	stopControl.create(stops);
  	stopControl.show();
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
       			limit = 800,
       	 currZoom = 1,
    pantimer,
    coasttimer;

    bindEvents();

    function bindEvents() {
	    $container.mousedown(begin);
	    $container.mousemove(move);
	    $container.mouseup(end);
	    $("#zoom-slide").change(function(e){
	    	zoomTo(this.value);
	    });
	    $("#rotate-slide").change(function(e){
	    	rotateTo(this.value);
	    });

			$el.on( 'DOMMouseScroll mousewheel', function(e) {
				scrollZoom(e.originalEvent.wheelDelta);
			});
		}

    function begin(event) {
      isPanning = true;
      start.x = event.pageX - curr.x;
      start.y = event.pageY - curr.y;
      clearInterval(coasttimer);
      pantimer = setInterval(velCheck, 10);
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
    	currZoom = zoom;
      prevCenter = getCenter();
      limit = 800*zoom;

      latScale.range( [ limit, 0    ] );
      lonScale.range( [ 0    , limit] );

      curr.x = $(window).width()/2 - prevCenter.x * limit;
      curr.y = $(window).height()/2 - prevCenter.y * limit;

      $el.css({"width": limit, "height": limit});

      $container.tform(curr.x, curr.y);

      stopControl.refresh();
      shapeControl.refresh();
    }

    function scrollZoom(scroll) {
    	currZoom += 0.005 * scroll;
    	if (currZoom < 0.1) {
    		currZoom = 0.11;
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
      coasttimer = setInterval(step, 10);
      function step() {
        vel.x *= 0.9;
        vel.y *= 0.9;
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