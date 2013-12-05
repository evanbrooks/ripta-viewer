var
  agency,
  trips,
  stops, stopsIndexed,
  shapes, shapesIndexed;

var tilemap;


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

  var po = org.polymaps;
  tilemap = po.map()
    .container(document.getElementById("imagelayer").appendChild(po.svg("svg")))
    //.zoomRange([0, 9])
    .zoom(11)
    // .add(po.image().url(po.url("http://{S}tile.cloudmade.com"
    // + "/4c5183a444874520adcf9176f6f55a0f" // http://cloudmade.com/register
    // + "/20760/256/{Z}/{X}/{Y}.png")
    // .hosts(["a.", "b.", "c.", ""])))
    //.add(po.interact())
    //.add(po.image().url("http://s3.amazonaws.com/com.modestmaps.bluemarble/{Z}-r{Y}-c{X}.jpg"))
    .add(po.compass().pan("none"));

    tilemap.add(po.image()
      .url(po.url("http://{S}tile.stamen.com/toner-background/{Z}/{X}/{Y}.jpg")
      .hosts(["", "a.", "b.", "c.", "d."])));
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