// Stops
// -----

function StopControl(view, stopLayer, mouse) {
  var self = this;
  var timer;

  self.stopresults = [];

  // Public methods
  // --------------

  this.create = refresh;
  this.refresh = refresh;  // function(){ return };
  
  this.addStuff = function(t) {
    timer = t;
  };

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
        show_stop_label(d, i);

      });

    // Remove stop circles
    // -------------------
    self.stopdata.exit().remove();

    // Adjust stop circles
    // ------------------
    var zoom = view.getZoom();
    self.stopdata
      .attr("cx", function(d) { return xScale(d.x) })
      .attr("cy", function(d) { return yScale(d.y) })
      .transition()
      .duration(500)
      .attr("r", function(d, i){
        if (zoom > 25) return 6;
        else return 3;
      })


    self.refresh_stop_label();
  }

  self.refresh_stop_label = function() {
    $el = $("#stoplabel");
    el = d3.select("#stoplabel");

    var selected_stop = stopsIndexed[parseInt(el.attr("data-stop"))];

    if (selected_stop) {
      el.attr("style",
        "-webkit-transform: translate3d(" + xScale(selected_stop.x) + "px, " + yScale(selected_stop.y) + "px, 0px)");
      

      var new_data = self.stopresults
        .filter(function(a) { return a.t > timer.currentTime - 60 }) // continue showing buses you  missed for 60s
        .slice(0, 5);

      // Data
      // -----
      var stoplist = el
        .selectAll(".stopentry")
        .data(new_data, function(d) { if (d) return d.id; else return false; });


      // Additions
      // ----
      var newstop = stoplist.enter()
        .append("div").attr("class", "stopentry");
      
      newstop.append("div").attr("class", "time").text(function(d, i) {return time_until(d.t, timer.currentTime)});
      newstop.append("div").attr("class", "sign").text(function(d, i) {return d.sign});

      // Removals
      // -----
      stoplist.exit()
        .attr("class","shrink-away")
        .transition()
        .delay(1000)
        .remove();

      // Changes
      // ----
      stoplist.attr("class", function(d){ 
        if (d.t > timer.currentTime + 60) return "stopentry";
        else return "stopentry bus-arrived"; // highlight recent arrival
      });

      stoplist.selectAll(".time")
        .text(function(d, i) {return time_until(d.t, timer.currentTime)});

    }

  };


  function show_stop_label(d, i) {
    var to = {x: - xScale(d.x) + view.w / 2 - 150, y: - yScale(d.y) + view.h / 2 - 100};
    view.move_to(to);

    $el = $("#stoplabel");
    $el.attr("data-stop",d.id);
    $el.find("h2").html(d.name.toLowerCase().capitalize());
    $el.tform(xScale(d.x), yScale(d.y));

    self.stopresults = [];
    trips.forEach(function(tr){
      tr.stop.forEach(function(tr_stoptime){
        if (tr_stoptime.id == d.id) {
          self.stopresults.push({
            t: tr_stoptime.t,
            id: tr.id,
            sign: tr.sign.toLowerCase().capitalize()
          });
        }
      });
    });

    self.stopresults.sort(function(a,b){
      return a.t - b.t;
    });

    self.refresh_stop_label();
  }

}
