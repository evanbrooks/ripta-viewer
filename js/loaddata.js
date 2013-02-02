// Load data from JSON
// -------------------

function loadData(callback) {
  async([getAgency, getTrips, getStops, getShapes], callback);

  function getAgency(cb) {
    d3.json("data/agency.json", function(data){
      agency = data;
      cb();
    });
  }

  function getTrips(cb) {
    d3.json("data/trips.json", function(data){
      trips = data;
      cb();
    });
  }
  function getStops(cb) {
    d3.json("data/stops.json", function(data){
      stops = data;
      cb();
    });
  }
  function getShapes(cb) {
    d3.json("data/shapes.json", function(data){
      shapes = data;
      cb();
    });
  }
}

// Execute an array of functions syncronously in
// order and callback when they're all done
// ---------

function sync(list, callback) {
  i = 0;
  nextData();
  function nextData(){
    if ( i == list.length) {
      callback();
      return;
    }
    else {
      list[i++](nextData);
      return;
    }
  }
}


// Execute an array of functions asyncronously and
// callback when they're all done
// ---------

function async(list, callback) {
  remaining = list.length;
  list.forEach(function(f, i){ list[i](done) });
  function done(){
    remaining--;
    if (remaining == 0) {
      callback();
    }
  }
}