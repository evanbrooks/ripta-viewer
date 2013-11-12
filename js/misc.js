
// --------------------------------------------------------

// Utilities for computing distance

// Given 2 points {x: x1, y: y1} and {x: x2, y: y2}
// return the distance between them
// --------------
function getDist(pt1,pt2) {
  return Math.sqrt(getSquareDist(pt1,pt2));
}
function getSquareDist(pt1,pt2) {
  return (pt2.y-pt1.y)*(pt2.y-pt1.y) + (pt2.x-pt1.x)*(pt2.x-pt1.x);
}

// --------------------------------------------------------

// Utilities for formatting time


function toSec(s) {
  var str = s + "";
  var split = str.split(":");
  var hr = split[0];
  var min = 0;
  var sec = 0;
  if (split.length > 1) {
    min = split[1]; }
  if (split.length > 2) {
    sec = split[2]; }
  var total = parseInt(hr,10)*(60*60) + parseInt(min,10)*(60) + parseInt(sec,10);
  return total;
}

function toTime(s) {
  var hr  = parseInt(s / (60 * 60), 10);
  var min = parseInt((s - 60 * 60 * hr) / 60, 10);
  var sec = parseInt((s - 60 * 60 * hr - 60*min), 10);

  if (hr < 1) hr = 12;
  if (min < 10) min = "0" + min;
  if (sec < 10) sec = "0" + sec;

  var ap = "am";
  if (hr > 12) {
    hr = hr % 12;
    ap = "pm";
  }

  if (hr < 10) hr = "0" + hr;

  var time = hr + ":" + min + ":" + sec + " " + ap;
  return time;
}


// --------------------------------------------------------

// These are simple JQuery plugins to make
// CSS3 transforms simple

(function( $ ){
  $.fn.tform = function(x,y){
    this.css(
      "-webkit-transform",
      "translate3d("+x+"px,"+y+"px,0)"
    );
  }
})( jQuery );