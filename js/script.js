var
  agency,
  trips,
  stops, stopsIndexed,
  shapes, shapesIndexed;


// On document ready
// -----------------

$(function(){
  loadData(setup); // Run setup when data is loaded
});

// Setup
// -----

function setup() {
  spinner = new Spinner();
  m = new Map("#map");

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

$("#search").on("keyup", function(){
  var val = $(this).val().trim().toLowerCase();
  var results = [];
  if (val !== "") {

    stopsIndexed.forEach(function(stop){
      var name = stop.name.toLowerCase();
      if (name.indexOf(val) !== -1) {
        results.push(stop.name);
      }
    });

    var html = "";
    results.forEach(function(result){
      html += "<div class='result'>" + result.toLowerCase().capitalize() + "</div>";
    });

    $("#autocomplete").html(html);

  }
  else {
    $("#autocomplete").html("");
  }


});

//http://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA