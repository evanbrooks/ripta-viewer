// Data structure after load
/* ------------------------- 

trips = [
          { id: 14,
            sign: "60 Providence",
            route: "60-46",
            shape: "01234",
            pt: [
                  { t: 10, id: "05431" },
                  { t: 15, id: "05432" },
                  {...}
                ]
          },
          {...}
        ]

------------------------- 

shapes =  [
            { id: "01234",
              pt: [
                    { x: 654, y: 456 },
                    { x: 655, y: 457 },
                    {...}
                  ]
            },
            {...}
          ]

------------------------- 

stops = [
          { id: "05431",
            lat: 655,
            lon: 457,
            name: "Canal nearside waterman"
          }
          {...}
        ]


stopsIndexed[ parseInt(05431) ] = { lat: 655,
                                    lon: 457,
                                    name: "Canal nearside Waterman"
                                  }


-------------------------  */

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

      //Add a simple integer id
      trips.forEach(function(trip, i){
        trip["id"] = i;

        // clean out stops that have repeat times
        trip.stop = trip.stop.filter(isUniqueTime);
        trip.stop = trip.stop.map(function(s){
          time = parseInt(s.t, 10) * 60;
          return { id: s.id, t: time};
        });

        // Add begin/end times
        if (trip.stop.length ) {
          last = trip.stop.length - 1;
          trip["time"] = { start: trip.stop[0].t,
                           end:   trip.stop[last].t };
        }
        else {
          trip["time"] = { start: -1,
                           end:   -1 };
        }

        // reprocess trips that span midnight
        trip.stop = processMidnight(i, trip.stop);

      });



      cb();
    });
  }
  function getStops(cb) {
    d3.json("data/stops.json", function(data){

      stops = [];

      data.forEach(function(stop, i, arr) {
        stops.push({name: stop.name, y: stop.lat, x: stop.lon});
      });

      // use the id as the array index
      stopsIndexed = [];
      data.forEach(function(stop) {
        stopsIndexed[parseInt(stop.id, 10)] = {name: stop.name, y: stop.lat, x: stop.lon};
      });
      cb();
    });
  }
  function getShapes(cb) {
    d3.json("data/shapes_big.json", function(data){
      shapes = data;

      shapeSmoothCache = [];
      shapes.forEach(function(shape){
        shapeSmoothCache[shape.id] = { expire: "", cache: [] };
      });

      shapesIndexed = [];
      shapes.forEach(function(shape) {
        shapesIndexed[parseInt(shape.id, 10)] = shape.pt;
      });

      cb();
    });
  }
}

// Returns the stop iff the previous
// stop occured at a different time
// ---------

function isUniqueTime(thisStop, index, arrayOfStops) {
  if ( index < 1 ) return thisStop;
  else if (thisStop.t != arrayOfStops[index-1].t ) {
    return thisStop;
  }
}

// Processes trips that span midnight, ie from 23:00 - 1:00,
// into the format of from 23:00 - 25:00 to avoid being
// misunderstood as taking all day (from 1:00 - 23:00)
// by the interpolator
// ---------
function processMidnight(id, arrayOfStops) {

  // sort array
  // --
  arrayOfStops.sort(function compareNumbers(a, b) {
    return a.t - b.t;
  });

  // return if too small
  // --
  if (arrayOfStops.length < 2) return arrayOfStops;

  firstStop = arrayOfStops[0];
  lastStop = arrayOfStops[arrayOfStops.length-1];

  // if the trip lasts for more than ~6 hours
  // then something funky is going on
  // --
  if ( lastStop.t - firstStop.t > 6*60*60) {
    // console.log(id);
    return arrayOfStops.map(function(stop){
      if (stop.t <= lastStop.t ) {
        return { t: stop.t += 24*60*60, // push off until tomorrow
                id: stop.id };
      }
      else return stop;
    });
  }
  else return arrayOfStops;
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
  list.forEach(function(f, i){ list[i](done); });
  function done(){
    remaining--;
    if (remaining === 0) {
      callback();
    }
  }
}