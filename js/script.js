var agency, trips, stops, stopsIndexed, shapes;


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


  // var map = L.map('altMap').setView([51.505, -0.09], 13);
  // L.tileLayer('http://{s}.tile.cloudmade.com/4c5183a444874520adcf9176f6f55a0f/997/256/{z}/{x}/{y}.png', {
  //     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
  //     maxZoom: 18
  // }).addTo(map);


  spinner.hide(); // When loading is complete
}


// Spinner
// -------

function Spinner() {
  this.show = function() {
    $("body").addClass("loading");
  }
  this.hide = function() {
      $("body").removeClass("loading");
  }
}