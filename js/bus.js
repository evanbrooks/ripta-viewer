// Trips
// -----

function TripControl(view, busLayer) {
  var self = this;
  self.currentBus = [];


  // Public methods
  // --------------

  var timer, shapeControl;
  this.addStuff = function(s, t) {
    shapeControl = s;
    timer = t;
  }

  this.set = function(time) {
    displayBus(time);
  }

  this.refresh = updatePos;

  this.redraw = function() {
      stopControl.refresh();
      tripControl.refresh();
      shapeControl.refresh();
  };

  this.getCurrentBus = function() {
    return self.currentBus;
  }




  var currentStopInterps, currentStopInterps2, currentIntermShapes;


  // Private methods
  // ---------------


  function displayBus(time) {
    self.currentBus = getData(time).filter(view.isInView);
    shapeControl.refresh();


    // Apply data
    // ----
    var bus = busLayer
      .selectAll(".bus")
      .data(self.currentBus, function(d) { return d.id; });


    // Add new buses
    // -------------
    var busEnter = bus.enter()
      .append("g")
      .attr("class", "bus");

    busEnter.append("circle").attr("r", 1.1);

    busEnter.append("text")
        .text(function(d) { return d.route })
        .attr("fill", "blue")
        .attr("x", function(d) { return xScale(d.x) })
        .attr("y", function(d) { return yScale(d.y) })

    // Remove old buses
    // ---------------
    var busExit = bus.exit().remove();

    // Move existing buses
    // -------------------
    if (Math.abs(timer.currentTime - timer.prevTime) < 10 ) {
      transitionPos();
    }
    else updatePos(); // larger time step? skip the transition




    var interper = busLayer.selectAll(".interp").data(currentStopInterps);
    interper.enter().append("line").attr("class", "interp");
    interper.exit().remove();
    interper
      .attr("x1", function(d) { return xScale( stopsIndexed[ parseInt(d.a, 10) ].x ); } )
      .attr("y1", function(d) { return yScale( stopsIndexed[ parseInt(d.a, 10) ].y ); } )
      .attr("x2", function(d) { return xScale( stopsIndexed[ parseInt(d.b, 10) ].x ); } )
      .attr("y2", function(d) { return yScale( stopsIndexed[ parseInt(d.b, 10) ].y ); } );



    // var interper2 = busLayer.selectAll(".interp2").data(currentStopInterps2);
    // interper2.enter().append("line").attr("class", "interp2");
    // interper2.exit().remove();
    // interper2
    //   .attr("x1", function(d) { return xScale( d.a.x ); } )
    //   .attr("y1", function(d) { return yScale( d.a.y ); } )
    //   .attr("x2", function(d) { return xScale( d.b.x ); } )
    //   .attr("y2", function(d) { return yScale( d.b.y ); } );


    // console.log(currentIntermShapes);
    var interpshape = busLayer.selectAll(".interpshape").data(currentIntermShapes);
    interpshape.enter().append("svg:path").attr("class", "interpshape");
    interpshape.exit().remove();
    interpshape.attr("d", function(d) {
      return make_interp_shape_line(d);
    });
  }

  var make_interp_shape_line = d3.svg.line()
    .y(function(d) { return yScale(d.y) })
    .x(function(d) { return xScale(d.x) });


  function updatePos() {
    busLayer.selectAll(".bus").select("circle")
      .attr("transform",
        function(d) {
          return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+d.a+")"; });
    busLayer.selectAll(".bus").select("text")
        .attr("x", function(d) { return xScale(d.x) + 10 })
        .attr("y", function(d) { return yScale(d.y) + 2 });
  }


  function transitionPos() {
    busLayer.selectAll(".bus").select("circle")
      .attr("transform",
        function(d) {
          return "translate("+xScale(d.x)+","+yScale(d.y)+") rotate("+d.a+")"; });
    busLayer.selectAll(".bus").select("text")
        .attr("x", function(d) { return xScale(d.x) + 5 })
        .attr("y", function(d) { return yScale(d.y) + 5 });
  }




  function getData(time) {
    var currentBus = [];
    currentStopInterps = [];
    currentStopInterps2 = [];
    currentIntermShapes = [];

    tripsNow = trips.filter(timer.isRunningNow);


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
          currentStopInterps.push(interp.stops);
          currentStopInterps2.push(interp.stops2);
          currentIntermShapes.push(interp.interm_shape);
        }
      }
      else {
        //console.log("no stops?");
      }
    });


    return currentBus;
  }








  var tBisector = d3.bisector(function(d){return d.t;});


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


      busLinear = linearInterpolate(t, aPoint, bPoint);
      busCurve = getPtOnShapeNear(busLinear,shapeid);
      var a_near = getPtOnShapeNear(aPoint, shapeid);
      var b_near = getPtOnShapeNear(bPoint, shapeid);
      // console.log(a_near.index + " : " + b_near.index);
      var stops2 = {a: a_near, b: b_near };
      var intermediate_shape = shapesIndexed[shapeid].slice(b_near.index, a_near.index);

      return { x: busCurve.x,
               y: busCurve.y,
               stops: { a: a.id, b: b.id },
               stops2: stops2,
               interm_shape: intermediate_shape,
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

      var newPoint = getPtOnShapeAt(newPercentOfPath, shapeid);


      return { x: xScale.invert(newPoint.x),   // return in lat/lon so that
               y: yScale.invert(newPoint.y) }; // it can be rescaled when
                                               // the map is manipulated
  }






  function getPtOnShapeNear(pt, shapeid) {
    thisShape = shapesIndexed[shapeid];

    var minPos = thisShape[0]
      , minDist = getSquareDist(minPos, pt)
      , minIndex = 0;

    for (i = 0; i < thisShape.length; i++) {
        pos = thisShape[i];
        dist = getSquareDist(pt, pos);
        if (dist < minDist) {
          minDist = dist;
          minPos = pos;
          minIndex = i;
        }
        //if (minDist < 1) break; // stop looking if we're pretty close
    }

    return { x: minPos.x, y: minPos.y, index: minIndex};
  }

}




