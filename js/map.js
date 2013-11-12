  var yScale, xScale;

function Map(el) {

  var self = this;

  // Scale
  // -----

  var scale  = new Scales();
  self.scale  = scale;
  self.xScale = xScale;
  self.yScale = yScale;

  // console.log(scale.x);

  // Layers
  // ------

     var map = d3.select(el),
  shapeLayer = map.select(".shapes"),
   stopLayer = map.select(".stops"),
    busLayer = map.select(".buses");

  // Components
  // ----------

  self.view = new ViewControl(el, self, map);

   var stopControl   = new StopControl(self.view, stopLayer),
       tripControl   = new TripControl(self.view, busLayer),
      shapeControl   = new ShapeControl(tripControl, shapeLayer, self.view),
             timer   = new TimeControl(tripControl, self.view);

  tripControl.addStuff(shapeControl, timer);

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
    shapeControl.refresh();
    stopControl.refresh();
  };

  this.redrawZoom = function(z) {
    stopControl.refresh();
    shapeControl.setSmooth(1/z);
    tripControl.refresh();
  };

  this.timer = timer;

  self.pause = timer.pause;

  timer.play();
  timer.goToNow();





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




  // Get point on shape at
  // -------------
  function getPtOnShapeAt(percentLength, shapeid) {
      var pathEl = d3.select("#l"+shapeid).node()
        , pathLength = pathEl.getTotalLength();
      return pathEl.getPointAtLength( percentLength * pathLength );
  }


}
