function Map(el) {

  var self = this;

  // Layers
  // ------

     var map = d3.select(el),
  shapeLayer = map.select(".shapes"),
   stopLayer = map.select(".stops"),
    busLayer = map.select(".buses"),
      canvas = new MapCanvas(el);

  // Scale
  // -----

  var yScale, xScale;
  var scale  = new Scales();
  self.scale  = scale;
  self.xScale = xScale;
  self.yScale = yScale;

  // Components
  // ----------

  self.view = new ViewControl(el, self, map);

   var stopControl   = new StopControl(),
 shapeControl   = new ShapeControl(),
  tripControl   = new TripControl(),
        timer   = new TimeControl(tripControl, self.view);

  self.shapeControl = shapeControl;

  shapeControl.create();

  this.makeStops = function(){
    stopControl.create();
    stopControl.show();
  };

  this.makeBus = function(time){
    tripControl.set(time);
  };

  this.redrawStopsShapes = function() {
    shapeControl.refreshSmooth();
    stopControl.refresh();
  };

  this.redrawZoom = function(z) {
    stopControl.refresh();
    shapeControl.setSmooth(1/z);
    tripControl.refresh();
  };

  self.pause = timer.pause;

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

    this.create = refresh;
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

    function refresh() {
     //  visible = true;
     //  loaded = true;

     //  visibleStops = stops.filter(view.isInView);

      // stopdata = stopLayer.selectAll(".stop")
      //   .data(visibleStops);

      // stopdata.enter()
     //    .append("circle")
     //    .attr("id", function(d) { return parseInt(d.id, 10) })
     //    .attr("class", "stop");

      // stopdata
      //   .attr("cx", function(d) { return xScale(d.x) })
      //   .attr("cy", function(d) { return yScale(d.y) });

     //  stopdata
     //    .exit()
     //    .remove();
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
    this.refreshSmooth = refreshSmooth;

    // Private methods
    // ---------------

    function create() {
      // console.log(smoothness);

      // Array of shape points only because d3 is picky
      var simplifiedShapes = shapes.map( function(s) {
        visShape = s.pt.filter(self.view.isInView);
        return simplify(visShape,smoothness); });

      // Array of shape ids only to lookup simplifiedShapes
      var shapeIds = shapes.map( function(s) { return s.id; });

      // Apply new data
      var shapedata = shapeLayer.selectAll(".line")
        .data(simplifiedShapes)

      // Redraw existing lines
      refresh();

      // Add new lines
      shapedata.enter()
        .append("svg:path")
        .attr("id", function(d, i) { return "l"+shapeIds[i] })  
        .attr("stroke", "black")
        .attr("stroke-width", "1")
        .attr("class", "line")
        .attr("d", pathMaker);
    }

    function refresh() {
      shapeLayer.selectAll(".line")
        .attr("d", pathMaker);
    }

    function refreshSmooth() {
      // Array of shape points only because d3 is picky
      var simplifiedShapes = [];
      var shapeids = [];

      shapes.map( function(s) {
        visShape = s.pt.filter(self.view.isInView);
        if (visShape.length > 1){
          simplifiedShapes.push(simplify(visShape,smoothness));
          shapeids.push(s.id);
        }
      });

      // Apply new data
      var shapedata = shapeLayer.selectAll(".line")
        .data(simplifiedShapes, function(d,i) {return shapeids[i]})
        .attr("d", pathMaker);
    }

    function setSmooth(s) {
      smoothness = s * smoothStart;
      refreshSmooth();
      //refresh();
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
      .y(function(d) { return yScale(d.y) })
      .x(function(d) { return xScale(d.x) })
      .interpolate("basis"); // "basis" for smoother
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
      busLayer.selectAll(".bus").select("circle")
        .attr("transform",
          function(d) {
            return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+d.a+")"; });

      busLayer.selectAll(".bus").select("text")
          .attr("x", function(d) { return xScale(d.x) + 10 })
          .attr("y", function(d) { return yScale(d.y) + 2 });

      // refreshInterps();      // DEBUG
    }

    function transitionPos() {
      busLayer.selectAll(".bus").select("circle")
        .attr("transform",
          function(d) {
            return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+d.a+")"; });

      busLayer.selectAll(".bus").select("text")
          .attr("x", function(d) { return xScale(d.x) + 5 })
          .attr("y", function(d) { return yScale(d.y) + 5 });

      // refreshInterps();      // DEBUG
    }

    function displayBus(time) {
      var currentBus = getData(time).filter(self.view.isInView);

      // var drawThese = []
      // currentBus.forEach(function(bus){
      //   drawThese.push({x: xScale(bus.x), y: yScale(bus.y) });
      // });
      // canvas.addArr(drawThese);

      // Main
      // ----
      var bus = busLayer
        .selectAll(".bus")
        .data(currentBus, function(d) { return d.id; });

      // Move existing buses
      // -------------------
      if (Math.abs(timer.currentTime - timer.prevTime) < 10 ) {
        transitionPos();
      }
      else updatePos(); // larger time step? skip the transition

      // Add new buses
      // -------------
      var busEnter = bus.enter().append("g").attr("class", "bus");
          busEnter.append("circle")
              .attr("cx", 0)
              .attr("cy", 0)
              .attr("transform",
                function(d) {
                  return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+d.a+")"; })
              .attr("r", 2)
              .transition()
              .attr("r", 1.1);

          busEnter.append("text")
              .text(function(d) { return d.route })
              .attr("fill", "blue")
              .attr("x", function(d) { return xScale(d.x) })
              .attr("y", function(d) { return yScale(d.y) })

      // Remove old buses
      // ---------------
      var busExit = bus.exit();
          // busExit.select("rect")
          //   .transition()
          //     .duration(100)
          //     .attr("r", 6)
          //   .transition()
          //     .duration(100)
          //     .attr("r", 0)
          //   .remove();

          busExit
            .select("circle")
            .transition()
            .attr("r", 5)
            .call(function(){busExit.remove();});

      // Force-labels
      // -----------------

    }

    function getData(time) {
      currentBus = [];
      currentStopInterps = [];
      tripsNow = trips.filter(timer.isRunningNow);
      //console.log("processing "+ tripsNow.length + "/" + trips.length +" trips");

      tripsNow.forEach(function(trip){
        if (trip.stop && trip.stop.length > 0){
          getSmoothnessCache(trip.shape);
        }
      });

      tripsNow.forEach(function(trip){
        if (trip.stop && trip.stop.length > 0){
          var interp = interpolateBus(trip.stop, trip.shape, time);
          if (interp == -1) {
            //console.log("not active");
            return;
          }
          else { // bus is running right now
            var bus = { sign: trip.sign,
                       shape: trip.shape,
                       route: trip.route.split("-")[0],
                           x: interp.x,
                           y: interp.y,
                           a: interp.a,
                          id: trip.id };
            currentBus.push(bus);
            // if (interp.stops.a && interp.stops.b){
            //   currentStopInterps.push(interp.stops);
            // } DEBUG
          }
        }
        else {
          //console.log("no stops?");
        }
      });
      showShapeUsed(currentBus);                  //DEBUG
      // showStopInterps(currentStopInterps);        //DEBUG
      return currentBus;
    }

    // Linear interpolation
    // Returns point between stops on path
    function interpolateBus(tripStops, shapeid, time) {
      var index  = tBisector.left(tripStops, time, 0, tripStops.length-1)
        , a      = tripStops[index]
        , aPoint = stopsIndexed[parseInt(a.id, 10)];
      if (index < 1) {
        if ( a.t > time ) {
          return -1; // time is earlier than the first stop, => trip hasn't begun
        }
        else {
          return { x: aPoint.x,
                   y: aPoint.y,
                   stops: { a: a.id },
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

        bus = linearInterpolate(t, aPoint, bPoint);
        //bus = shapeInterpolate(t, aPoint, bPoint, shapeid);

        busCurve = getPtOnShapeNear(bus,shapeid);

        return { x: busCurve.x,
                 y: busCurve.y,
                 stops: { a: a.id, b: b.id },
                 a: Math.atan2(
                      bPoint.y - aPoint.y,
                      bPoint.x - aPoint.x ) /** (180 / Math.PI)*/ };
      }
    }

    function linearInterpolate(t, pt1, pt2) {
      return { x: (pt1.x * (1-t) + pt2.x * t),
               y: (pt1.y * (1-t) + pt2.y * t) };
    }

    function shapeInterpolate(t, pt1, pt2, shapeid) {
        // console.log(shapeid);
        var aPercentOfPath = getPtOnShapeNear(pt1, shapeid).percent
          , bPercentOfPath = getPtOnShapeNear(pt2, shapeid).percent
          , percentOfPath_range = aPercentOfPath - bPercentOfPath
          , newPercentOfPath = aPercentOfPath + percentOfPath_range*t;

        //console.log(aPercentOfPath+" < "+newPercentOfPath+" < "+bPercentOfPath);
        //console.log(percentOfPath_range);
        //console.log(t);

        var newPoint = getPtOnShapeAt(newPercentOfPath, shapeid);

        // console.log(newPoint);


        return { x: xScale.invert(newPoint.x),   // return in lat/lon so that
                 y: yScale.invert(newPoint.y) }; // it can be rescaled when
                                                 // the map is manipulated
    }

    var tBisector = d3.bisector(function(d){return d.t;});


    // Labels
    // ------
    // var labelBox,link;
    // labelForce = d3.force_labels()
    //     .linkDistance(0)
    //     .gravity(0)
    //     .nodes([]).links([])
    //     .charge(-10)
    //     .on("tick",redrawLabels);

    // function redrawLabels() {
    //     labelBox
    //         .attr("transform",function(d) { return "translate("+d.labelPos.x+" "+d.labelPos.y+")"})

    //     links
    //         .attr("x1",function(d) { return d.anchorPos.x})
    //         .attr("y1",function(d) { return d.anchorPos.y})
    //         .attr("x2",function(d) { return d.labelPos.x})
    //         .attr("y2",function(d) { return d.labelPos.y})
    // }

    // linear interpolation layer
    // --------------------------
    // to debug issue of multiple stops listed at the same time stamp
      function showStopInterps(interps) {
        var interps = stopLayer.selectAll(".interp").data(interps);
        // New interps
        interps.enter()
          .append("svg:line")
          .attr("class", "interp")
          .attr("stroke", "blue")
          .attr("opacity", "0.5")
          .attr("stroke-width", 1);
        // Refresh old interps
        refreshInterps();
        // Remove dead interps
        interps.exit().remove();
      }

      function showShapeUsed(current) {
        shapeLayer
          .selectAll(".line")
          .attr("class", "line");

        current.forEach(function(curr) {
          shapeLayer
            .select("#l"+curr.shape)
            .attr("class", "line selected");
        });
      }

      function refreshInterps() {
        stopLayer.selectAll(".interp")
          .attr("x1", function(d) { return xScale( stopsIndexed[ parseInt(d.a, 10) ].x ); } )
          .attr("y1", function(d) { return yScale( stopsIndexed[ parseInt(d.a, 10) ].y ); } )
          .attr("x2", function(d) { return xScale( stopsIndexed[ parseInt(d.b, 10) ].x ); } )
          .attr("y2", function(d) { return yScale( stopsIndexed[ parseInt(d.b, 10) ].y ); } );
      }
    // ------------------------
    // End linear interpolation

  }

  // Scales
  // ------
  function Scales() {

    var w = $(el).width()
      , h = $(el).height()
      , x = { min:0, max:0}
      , y = { min:0, max:0};

    if ( w > h) {
      x = { min: 0          , max: w           };
      y = { min: 0 - (w-h)/2, max: h + (w-h)/2 };
    }
    else {
      y = { min: 0          , max: h           };
      x = { min: 0 - (h-w)/2, max: w + (h-w)/2 };
    }

    yScale = d3.scale.linear()
      .domain([agency.lat.min, agency.lat.max])
      .range([y.max, y.min]); // reversed because measure north of equator
    xScale = d3.scale.linear()
      .domain([agency.lon.min, agency.lon.max])
      .range([x.min, x.max]);

    this.x = x;
    this.y = y;
  }

  this.redraw = function() {
      stopControl.refresh();
      shapeControl.refresh();
      tripControl.refresh();
  }

  // Finding points along paths
  // --------------------------
  // var circle = 
  //         shapeLayer.append("circle")
  //           .attr("cx", 100)
  //           .attr("cy", 350)
  //           .attr("r", 3)
  //           .attr("fill", "red");

  // map.on("mousemove", function() {
  //   var shiftedmouse = { x: mouse.x - curr.x, y: mouse.y - curr.y };
  //   var nearest = getPtOnShapeNear(shiftedmouse, "600028");

  //   circle
  //     .attr("opacity", 1)
  //     .attr("cx", nearest.x)
  //     .attr("cy", nearest.y);

  // });


  // --------------------------------------------------------

  // These are a few handy utility methods


  // Given a point {x: x1, y: y1} and a unique
  // shapeid, find the point on the shape nearest
  // to the target and also return how far along
  // the shape it is

  function getSmoothnessCache(shapeid) {
    // thisShape = shapeSmoothCache[shapeid];
    // if (thisShape.expire !== self.view.getUnique()) {
    //   var pathEl = d3.select("#l"+shapeid).node()
    //     , pathLength = pathEl.getTotalLength()
    //     , pathPts = [];
    //   for (i = 0; i < pathLength; i++) {
    //     var pos = pathEl.getPointAtLength(i);
    //     thisPt = { x: pos.x, y: pos.y };
    //     pathPts.push(thisPt);
    //   }
    //   thisShape.cache = pathPts;
    //   thisShape.isCached = true;
    //   thisShape.expire = self.view.getUnique();
    // }
  }

  function getPtOnShapeNear(target, shapeid) {

    //thisShape = shapeSmoothCache[shapeid];
    thisShape = shapesIndexed[shapeid];
    //pt = { x: xScale(target.x), y: yScale(target.y) };
    pt = target;
    
    var minPos = thisShape[0]
      , minDist = getSquareDist(minPos, pt);

    for (i = 0; i < thisShape.length; i++) {
        pos = thisShape[i];
        dist = getSquareDist(pt, pos);
        if (dist < minDist) {
          minDist = dist;
          minPos = pos;
        }
        //if (minDist < 1) break; // stop looking if we're pretty close
    }

    //console.log(minPos);

    //return { x: xScale.invert(minPos.x), y: yScale.invert(minPos.y)};
    return { x: minPos.x, y: minPos.y};
  }


  function getPtOnShapeAt(percentLength, shapeid) {
      var pathEl = d3.select("#l"+shapeid).node()
        , pathLength = pathEl.getTotalLength();
      return pathEl.getPointAtLength( percentLength * pathLength );
  }

  // Given 2 points {x: x1, y: y1} and {x: x2, y: y2}
  // return the distance between them

  function getDist(pt1,pt2) {
    return Math.sqrt(getSquareDist(pt1,pt2));
  }

  function getSquareDist(pt1,pt2) {
    return (pt2.y-pt1.y)*(pt2.y-pt1.y) + (pt2.x-pt1.x)*(pt2.x-pt1.x);
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