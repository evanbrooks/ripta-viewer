// Time Control
// ------------

function TimeControl(tripControl, viewControl) {

  var self = this;
  self.currentTime = new Date().getTime() / 1000;
  self.step = $("#speed").val();
  self.sun = { rise: toSec(6), set: toSec(18) };

  var autoRun = false;

  // Constructor
  // -----------

  bindEvents();
  self.timeline = new Timeline(self, tripControl);

  // Private methods
  // ---------------
  function bindEvents() {
    $("#time-slide").change(function(e){
      self.currentTime = this.value;
      tripControl.set(self.currentTime);
       $("#timestamp").html(self.currentTime +" - "+ toTime(self.currentTime));
      //colorize();
    });
    $("#autoRunCheck").change(function(e) {
      if (!autoRun) {
        autoRun = true;
        d3.timer(timeStep);
      }
      else autoRun = false;
    });
    $("html")
      .on("click", "#play",  function() {self.play() } )
      .on("click", "#pause", function() {self.pause()} );
    $("#speed").change(function(){
      self.step = parseFloat(this.value);
      console.log(self.step);
    });
  }

  this.play = function() {
      autoRun = true;
      d3.timer(timeStep, 50);
      $("body").addClass("playing").removeClass("paused");
  };

  this.pause = function() {
      autoRun = false;
      $("body").removeClass("playing").addClass("paused");
  };

  this.goToNow = function() {
    var tzone = -4 * 60 * 60;
    var now = new Date().getTime() / 1000 + tzone;
    jump = now - self.currentTime;

    jump = jump % (24 * 60 * 60); // disregard month/year
    self.timeline.tick(jump);
  };

  function timeStep() {
    if ( viewControl.isPanning()) {
      return;
    }
    if (!autoRun) return true;              // stop timer
    else {
      self.timeline.tick(self.step);
      return false;                         // keep running
    }
  }

  this.isRunningNow = isRunningNow;
  function isRunningNow(obj, index, array) {
    if ( obj.time.start <= self.currentTime
      && obj.time.end >= self.currentTime ) {
         return true; }
    else return false;
  }
}



function Timeline(tControl, tripControl) {
  var self = this
  , frame  = 1000 / 60      // ms per frame
  , vel = 0
  , shift = 0
  , prevShift = 0
  , el = $(".times")
  , hrUnit = $(".times > li").width()
  , html = $("html")
  , tlStart = toSec("00:30");

  var isChanging = false;

  bindEvents();

  // Setup
  centeredshift = - $(window).width()/2;
  t = tlStart + parseInt(-centeredshift/hrUnit * 60 * 60, 10);
  t = t % (24 * 60 * 60);
  tControl.currentTime = t;
  $("#timestamp").html(toTime(tControl.currentTime));

  function bindEvents() {
    $(".timeline").on("mousedown touchstart", begin);
    html.on("mousemove touchmove", move);
    html.on("mouseup touchend", end);
    html.mouseleave(end);
  }

  function begin(e) {
    isChanging = true;
    el.addClass("changing");
    start = mouse.x - shift;
    vel = 0;
    d3.timer(velCheck, frame);
  }

  function move(e) {
    // hooray, everyone can access global
    // variable mouse! mouse = {x, y}
    if (isChanging) {
      shift = mouse.x - start;
      self.update();
    }
  }

  function end(e) {
    isChanging = false;
    d3.timer(coast, frame);
  }

  function coast() {
    if (isChanging) return true;                       // stop timer
    vel = parseInt( vel * 0.8 * 100, 10 ) / 100;  // 2 decimal precision
    if (Math.abs(vel) < 0.05) {
      el.removeClass("changing");
      return true;                                    // stop timer
    }
    else {
      shift += vel;
      self.update();
      return false;                                  // continue timer
    }
  }

  self.tick = function(amount) {
    shift -= amount / 60 / 60 * hrUnit;
    self.update();
  };

  self.update = function() {
      if (shift > 0) {
        shift -= 24 * hrUnit;
      }
      if (shift < -48 * hrUnit + $(window).width() ) {
        shift += 24 * hrUnit;
      }
      el.tform(shift, 0);
      centeredshift = shift - $(window).width()/2;
      t = tlStart + parseInt(-centeredshift/hrUnit * 60 * 60, 10);
      t = t % (24 * 60 * 60);
      tControl.currentTime = t;
      tripControl.set(parseInt(t, 10));
      $("#timestamp").html(toTime(tControl.currentTime));
  };

  function velCheck() {
    if (isChanging) {
      vel = shift - prevShift;
      prevShift = shift;
      return false;                                 // continue timer
    }
    else return true;                               // end timer
  }

}