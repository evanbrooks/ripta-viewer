// Stops
// -----

function StopControl(view, stopLayer, mouse) {
  var self = this;

  // Public methods
  // --------------

  this.create = refresh;
  this.refresh = refresh;  // function(){ return };
  
  function refresh() {

    // Process data
    // ------------
    visibleStops = stops.filter(view.isInView);

    // Apply data
    // ----------
    self.stopdata = stopLayer.selectAll(".stop")
      .data(visibleStops, function (d, i) {return d.id;});

    // Add stop circles
    // ----------------
    self.stopdata.enter()
      .append("circle")
      .attr("id", function(d) { return "stop" + parseInt(d.id, 10) })
      .attr("r", 4)
      .attr("class", "stop")
      .on("click", function(d, i){

        stopLayer.selectAll(".viewingstop")
          .attr("class", "stop")
          .attr("r", 4);

        d3.select(this)
          .attr("class", "stop viewingstop")
          .attr("r", 4);
        show_stop(d, i);

      });

    // Remove stop circles
    // -------------------
    self.stopdata.exit().remove();

    // Adjust stop circles
    // ------------------
    self.stopdata
      .attr("cx", function(d) { return xScale(d.x) })
      .attr("cy", function(d) { return yScale(d.y) });

    $el = $("#stoplabel");
    var selected_stop = stopsIndexed[parseInt($el.attr("data-stop"))];
    if (selected_stop) {
      $el.tform(xScale(selected_stop.x), yScale(selected_stop.y)); 
    }
  }

  function show_stop(d, i) {
    var to = {x: - xScale(d.x) + view.w / 2 - 150, y: - yScale(d.y) + view.h / 2 - 100};
    console.log(view.getCurr());
    console.log(to);
    view.move_to(to);

    $el = $("#stoplabel");
    $el.attr("data-stop",d.id);
    $el.find("h2").html(d.name.toLowerCase().capitalize());
    $el.tform(xScale(d.x), yScale(d.y)); 
  }

  // $("body").mousemove(function(event){
  //   var mouse = { x: event.pageX,
  //                 y: event.pageY };

  //   if (self.stopdata) {          
  //     self.stopdata
  //       .attr("r", function(d, i){
  //         var dist = getDist({x: xScale(d.x) + view.getCurr().x, y: yScale(d.y) + view.getCurr().y}, mouse);
  //         return (100 / (dist + 100) * 5);
  //         //      if (dist < 50) return 5;
  //         // else if (dist < 100) return 3;
  //         // else if (dist < 200) return 2;
  //         // else return 1;
  //       });
  //   }
  // });

}
