var agency, trips, stops, shapes;


// On document ready
// -----------------

$(function(){
  loadData(setup); // Run setup when data is loaded
});

// Setup
// -----

function setup() {
  spinner = new Spinner();
  map = new Map("#map");
  spinner.hide(); // When loading is complete
}

// --------------------------------------------------------


// Map
// ===

function Map(el) {

	   var map = d3.select(el),
  shapeLayer = map.select(".shapes"),
	 stopLayer = map.select(".stops"),
    busLayer = map.select(".buses");


  var panzoom = new PanZoomControl(el),
  stopControl = new StopControl(),
 shapeControl = new ShapeControl();

  this.makeStops = function(){
  	stopControl.create(stops);
  	stopControl.show();
  }

  this.makeShapes = function(){
  	shapeControl.create(shapes);
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
							$el = $(el),
       $container = $el.parent(),
       			limit = 800,
       	 prevZoom = 1;

    bindEvents();

    function bindEvents() {
	    $container.mousedown(begin);
	    $container.mousemove(move);
	    $container.mouseup(end);
	    $("#zoom-slide").change(zoom);
    }

    function begin(event) {
      isPanning = true;
      start.x = event.pageX - curr.x;
      start.y = event.pageY - curr.y;
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
    }

    function zoom(zoom){

      prevCenter = getCenter();

      limit = 800*this.value;
      $el.css({"width": limit, "height": limit});
      $container.css({"width": limit, "height": limit});
      latScale.range( [ limit, 0    ] );
      lonScale.range( [ 0    , limit] );
      stopControl.refresh();
      shapeControl.refresh();

      curr.x = $(window).width()/2 - prevCenter.x * limit;
      curr.y = $(window).height()/2 - prevCenter.y * limit;

      $container.tform(curr.x, curr.y);
    }

    function getCenter() {
      // prevCenter is the distance from the viewport center to
      // the top-left corner of the map as a percentage of the map
      // size
      viewCenter = { x: $(window).width()/2, y: $(window).height()/2 };
      return {
      	x: (viewCenter.x - $el.offset().left) / limit,
      	y: (viewCenter.y - $el.offset().top) / limit
      };
    }
 	}

	// Scales
	// ------
  var latScale = d3.scale.linear()
    .domain([agency.lat.min, agency.lat.max])
    .range([800, 0]); // reversed because lat is measured west of meridian
  var lonScale = d3.scale.linear()
    .domain([agency.lon.min, agency.lon.max])
    .range([0, 800]);
}


// --------------------------------------------------------



// Spinner
// -------

function Spinner() {
  this.show = function() {
    $("body").addClass("loading");
  }
  this.hide = function() {
      $("body").removeClass("loading");
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