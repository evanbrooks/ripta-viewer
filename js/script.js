var
  agency,
  trips,
  stops, stopsIndexed,
  shapes, shapesIndexed, shapeSmoothCache;


// On document ready
// -----------------

$(function(){
  loadData(setup); // Run setup when data is loaded
});

// Setup
// -----

function setup() {
  spinner = new Spinner();
  map = new Map("#map");

  spinner.hide(); // When loading is complete
}


// Spinner
// -------

function Spinner() {
  this.show = function() {
    $("body").addClass("loading");
  };
  this.hide = function() {
      $("body").removeClass("loading");
  };
}