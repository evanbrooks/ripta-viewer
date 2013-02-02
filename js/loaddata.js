// Load data from JSON
// -------------------

function loadData(callback) {
  async([getTrips, getStops, getShapes], callback);

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