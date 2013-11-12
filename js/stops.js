// Stops
// -----

function StopControl(view, stopLayer) {

  // Public methods
  // --------------

  this.create = refresh;
  this.refresh = refresh;

  function refresh() {

    // Process data
    // ------------
    visibleStops = stops.filter(view.isInView);

    // Apply data
    // ----------
    stopdata = stopLayer.selectAll(".stop")
      .data(visibleStops);

    // Add stop circles
    // ----------------
    stopdata.enter()
      .append("circle")
      .attr("id", function(d) { return parseInt(d.id, 10) })
      .attr("r", 0.5)
      .attr("class", "stop");

    // Remove stop circles
    // -------------------
    stopdata.exit().remove();

    // Adjust stop circles
    // ------------------
    stopdata
      .attr("cx", function(d) { return xScale(d.x) })
      .attr("cy", function(d) { return yScale(d.y) });

  }

}
