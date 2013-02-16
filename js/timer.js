// Time Control
// ------------

function TimeControl(tripControl, viewControl) {

  var self = this;
  self.prevTime = 0;
  self.currentTime = 0;

  var autoRun = false;

  // Constructor
  // -----------

  bindEvents();

  this.pause = pause;

  // Private methods
  // ---------------
  function bindEvents() {
    $("#time-slide").change(function(e){
      self.prevTime = self.currentTime;
      self.currentTime = this.value;
      tripControl.set(this.value);
      //colorize();
    });
    $("#autoRunCheck").change(function(e) {
      if (!autoRun) {
        autoRun = true;
        d3.timer(timeStep, 50);
      }
      else autoRun = false;
    });
    $("#play").click(function(){
      autoRun = true;
      d3.timer(timeStep, 50);
      $("body").addClass("playing").removeClass("paused");
    });
    $("#pause").click(pause);
  }

  function timeStep() {
    if ( viewControl.isPanning()) {
      return;
    }
    if (!autoRun) return true;              // stop timer
    else {
      self.prevTime = self.currentTime;
      self.currentTime = parseFloat(self.currentTime) + 0.05;
      tripControl.set(self.currentTime);
      //colorize();
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

  function pause() {
      autoRun = false;
      $("body").removeClass("playing").addClass("paused");
  }

  function colorize() {
    if (self.currentTime > 360 && self.currentTime < 1080) {
        $("body").removeClass("night");
      }
      else {
        $("body").addClass("night");
      }
      var bg = parseInt(255 * (self.currentTime / 720), 10);
      if (bg > 255) bg = 255 - (bg%255);
      var color = "rgb("+bg+","+bg+","+bg+")";
      $("body").css("background-color", color);
  }

}