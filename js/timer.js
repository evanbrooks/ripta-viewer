// Time Control
// ------------

function TimeControl(tripControl, viewControl) {

  var self = this;
  self.currentTime = new Date().getTime() / 1000;
  self.step = 3;
  self.sun = { rise: toSec(6), set: toSec(18) };

  var autoRun = false;

  // Constructor
  // -----------

  bindEvents();

  this.pause = pause;

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
    $("#play").click(function(){
      autoRun = true;
      d3.timer(timeStep, 50);
      $("body").addClass("playing").removeClass("paused");
    });
    $("#pause").click(pause);
    $("#speed").change(function(){
      self.step = parseFloat(this.value);
      console.log(self.step);
    });
    $(".timeline").scroll( function(e){
      e.preventDefault();
      if ($(this).scrollLeft() + $(this).width()  > $(".times").width()) {
        $(this).scrollLeft(1);
      }
      else if ($(this).scrollLeft() <= 0) {
        $(this).scrollLeft(1000);
      }
    });
  }

  function timeStep() {
    if ( viewControl.isPanning()) {
      return;
    }
    if (!autoRun) return true;              // stop timer
    else {
      self.currentTime = parseFloat(self.currentTime) + self.step;
      if (self.currentTime > 86400) self.currentTime = 0;
      $("#time-slide").val(self.currentTime);
      $("#timestamp").html(toTime(self.currentTime));
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
    var sunT = 30;
    if (self.currentTime > self.sun.rise && self.currentTime < self.sun.set) {
      $("body").removeClass("night");
    }
    else {
      $("body").addClass("night");
    }
    if (self.currentTime > self.sun.rise - sunT/2 && self.currentTime < self.sun.rise + sunT/2 ||
        self.currentTime > self.sun.set - sunT/2 && self.currentTime < self.sun.set + sunT/2) {
      $("body").removeClass("night").addClass("sun");
    }
    else {
      $("body").removeClass("sun");
    }
    // var bg = parseInt(255 * (self.currentTime / 720), 10);
    // if (bg > 255) bg = 255 - (bg%255);
    // var color = "rgb("+bg+","+bg+","+bg+")";
    // $("body").css("background-color", color);
  }


  // Get today's sunset and sunrise times for
  // Providence, RI by checking the Yahoo Weather
  // RSS feed through Google's feed API
  // ---------------------------------
  var pvdWOEID = 12759056;
  var pvdUrl = "http://weather.yahooapis.com/forecastrss?w="+pvdWOEID;
  //google.load("feeds", "1");
  // function getSun() {
  //   var feed = new google.feeds.Feed(pvdUrl);
  //   feed.setResultFormat(google.feeds.Feed.XML_FORMAT);
  //   feed.load(function(result) {
  //     if (!result.error) {
  //       var t = result.xmlDocument.childNodes[0].firstChild.childNodes[12];
  //       var rise = $(t).attr("sunrise");
  //       var set = $(t).attr("sunset");
  //       //self.sun = {rise: rise, set: set };
  //       //self.console.log(self.sun);
  //     }
  //   });
  // }
  // google.setOnLoadCallback(getSun);
}

function toSec(s) {
  var str = s + "";
  var split = str.split(":");
  var hr = split[0];
  var min = 0;
  var sec = 0;
  if (split.length > 1) {
    min = split[1]; }
  if (split.length > 1) {
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
    hr -= 12;
    ap = "pm";
  }

  var time = hr + ":" + min + ":" + sec + " " + ap;
  return time;
}
