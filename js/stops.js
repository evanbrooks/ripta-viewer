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
  }

  function refresh() {
    // visible = true;
    // loaded = true;

    // visibleStops = stops.filter(self.view.isInView);

    // stopdata = stopLayer.selectAll(".stop")
    //   .data(visibleStops);

    // stopdata.enter()
    //   .append("circle")
    //   .attr("id", function(d) { return parseInt(d.id, 10) })
    //   .attr("class", "stop");

    // stopdata
    //   .attr("cx", function(d) { return xScale(d.x) })
    //   .attr("cy", function(d) { return yScale(d.y) });

    // stopdata
    //   .exit()
    //   .remove();
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
