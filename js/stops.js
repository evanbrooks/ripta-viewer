// Stops
// -----

function StopControl(map, view, stopLayer) {
  var self = this;
  var timer;
  var is_viewing_detail = false;

  self.stopresults = [];

  // Public methods
  // --------------

  this.create = refresh;
  this.refresh = refresh;  // function(){ return };
  
  self.clear_stop = function() {
    is_viewing_detail = false;
    stopLayer.selectAll(".viewingstop")
      .attr("class", "stop")
      .attr("r", 4);
    d3.select("#stoplabel").attr("data-stop", "").attr("style",
      "-webkit-transform: translate3d(" + 0 + "px, " + 0 + "px, 0px)");
    stopLayer.selectAll(".nearest-bus-line").remove();
    document.title = "RIPTA";
  }


  function refresh() {

    // Process data
    // ------------
    var visibleStops;
    if (map.view.getZoom() > 15) {
      visibleStops = stops.filter(view.isInView);
    }
    else {
      visibleStops = [];
    }

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
        d3.event.stopPropagation();
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


    // self.refresh_stop_label();
  }



  self.refresh_stop_label = function() {
    if (is_viewing_detail) {
      // console.log("refresh_stop_label");

      el = d3.select("#stoplabel");
      var selected_stop = stopsIndexed[parseInt(el.attr("data-stop"))];

      // If the stop exists, and it's valid enought to have a name :/ ~~
      if (selected_stop && selected_stop.name) {

        // Move label into position
        // ---------
        el.attr("style",
          "-webkit-transform: translate3d(" + xScale(selected_stop.x) + "px, " + yScale(selected_stop.y) + "px, 0px)");
        

        // Data
        // -----
        var new_data = self.stopresults
          .filter(function(a) { return a.t > map.timer.currentTime - 60 }) // continue showing buses you  missed for 60s
          .slice(0, 5);

        var stoplist = el
          .selectAll(".stopentry")
          .data(new_data, function(d) { if (d) return d.id; else return false; });



        // Additions
        // ----
        var newstop = stoplist.enter()
          .append("div").attr("class", "stopentry");
        
        newstop.append("div").attr("class", "time").text(function(d, i) {return time_until(d.t, map.timer.currentTime)});
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
          if (d.t > map.timer.currentTime + 60) return "stopentry";
          else return "stopentry bus-arrived"; // highlight recent arrival
        });

        stoplist.selectAll(".time")
          .text(function(d, i) {return time_until(d.t, map.timer.currentTime)});

        if (new_data[0]) document.title = time_until(new_data[0].t, map.timer.currentTime) + "┊" + new_data[0].sign;

        var upcoming_bus = selected_stop;
        if (new_data[0] && map.busControl.get_bus_from_id(new_data[0].id)) {
          upcoming_bus = map.busControl.get_bus_from_id(new_data[0].id);
        }

        self.nearest_bus_line([{
          bus: upcoming_bus,
          stop: selected_stop
        }]);
      }
    }

  };


  self.nearest_bus_line = function(data) {

    // console.log("redraw near")

    // Data
    // -----
    var near = stopLayer
      .selectAll(".nearest-bus-line")
      .data(data);


    // Additions
    // ----
    near.enter()
      //.append("path").attr("class", "nearest-bus-line");
      .append("line").attr("class", "nearest-bus-line");

    // Removals
    // -----
    near.exit()
      .remove();

    // Changes
    // ----
    near
      //.attr("d", line_gen);
      .attr("x2", function(d,i) { return xScale( d.bus.x )  })
      .attr("y2", function(d,i) { return yScale( d.bus.y )  })
      .attr("x1", function(d,i) { return xScale( d.stop.x ) /*+ 10*/ })
      .attr("y1", function(d,i) { return yScale( d.stop.y ) /*+ 50*/ });


  };

  // var diagonal = d3.svg.diagonal()
  //   .projection(function(d) {return [xScale(d.x), yScale(d.y)] })
  //   .source(function(d) { return d.stop })
  //   .target(function(d) { return d.bus  });



  function show_stop_label(d, i) {
    is_viewing_detail = true;
    map.busControl.clear_bus();

    var to = {x: - xScale(d.x) + view.w / 2 - 150, y: - yScale(d.y) + view.h / 2 - 100};
    view.move_to(to);

    el = d3.select("#stoplabel");

    el.attr("data-stop",d.id);
    el.select("h2").text(d.name.toLowerCase().capitalize());

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
