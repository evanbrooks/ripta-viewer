function MapCanvas(el) {

	// Constructor
	// -----------

	$(el).after("<canvas id=\"mapCanvas\" width=\"800\" height=\"800\"></canvas>");
  var canvas = document.getElementById("mapCanvas");
  if (canvas.getContext) {
    var c = canvas.getContext("2d");
    c.fillStyle = "rgba(0, 0, 200, 0.1)";
  }
  // Public
  // ------

  this.addPt = addPt;
  this.addArr = addArr;

  // Methods
  // -------

  function addPt(x,y) {
    circle(x, y, 0.5);
  }

  function addArr(arr) {
    for (i = 0; i < arr.length; i++) {
      circle(arr[i].x, arr[i].y, 0.5);
    }
  }

  // Utilities
  // ---------

  var circ = 2 * Math.PI;

  function circle(x,y,r) {
    c.arc (x, y, r, circ, false);
    c.fill();
  }

}
