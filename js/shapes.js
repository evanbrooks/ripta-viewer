// Shapes
// ------

function ShapeControl(tripControl, shapeLayer, view) {
  var self = this;
  smoothStart = 0.002,
  self.smoothness = smoothStart;

  // Constructor
  // -----------

  // Public methods
  // --------------

  this.setSmooth = setSmooth;
  this.create = refresh;
  this.refresh = refresh;

  // Private methods
  // ---------------

  function refresh() {

    // Process data
    // ------------
    var now_shapes = [];
    tripControl.getCurrentBus().map( function(bus) {
      bus_shape = shapesIndexed[bus.shape];

      visible_shape_portion = bus_shape.filter(view.isInView);
      if (visible_shape_portion.length > 1){
        now_shapes.push({
          id: bus.shape,
          simple: simplify(visible_shape_portion, self.smoothness)
        });
      }
    }); 

    // Apply new data
    // --------------
    var shapedata = shapeLayer.selectAll(".line")
      .data(d3.entries(now_shapes), function(d,i) {return d.value.id});

    // Enter data
    // ----------

    shapedata.enter()
      .append("svg:path")
      .attr("id", function(d, i) { return "l"+d.value.id })  
      .attr("class", "line");

    // Exit data
    // ---------

    shapedata.exit()
      .remove();

    // Update all
    // ----------
    shapedata.attr("d", function(d, i) {
      return pathMaker(d.value.simple);
    });

  }

  function setSmooth(s) {
    self.smoothness = s * smoothStart;
    refresh();
  }

  var pathMaker = d3.svg.line()
    .y(function(d) { return yScale(d.y) })
    .x(function(d) { return xScale(d.x) });
    //.interpolate("basis"); // "basis" for smoother
}
