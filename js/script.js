var trips, stops, shapes;


// On document ready
// -----------------

$(function(){
  loadData(setup);
});

// Setup
// -----

function setup() {
  spinner = new Spinner();
  spinner.hide();
}

// Utilities
// ---------

function Spinner() {
  this.show = function() {
    $("body").addClass("loading");
  }
  this.hide = function() {
      $("body").removeClass("loading");
  }
}