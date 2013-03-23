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
  self.timeline = new Timeline(self, tripControl);

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
    // $(".timeline").scroll( function(e){
    //   e.preventDefault();
    //   if ($(this).scrollLeft() + $(this).width()  > $(".times").width()) {
    //     $(this).scrollLeft(1);
    //   }
    //   else if ($(this).scrollLeft() <= 0) {
    //     $(this).scrollLeft(1000);
    //   }
    // });
  }

  function timeStep() {
    if ( viewControl.isPanning()) {
      return;
    }
    if (!autoRun) return true;              // stop timer
    else {
      self.currentTime = parseFloat(self.currentTime) + self.step;
      //if (self.currentTime > 86400) self.currentTime = 0;
      //$("#time-slide").val(self.currentTime);
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
    hr -= 12;
    ap = "pm";
  }

  var time = hr + ":" + min + ":" + sec + " " + ap;
  return time;
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
      update();
    }
  }

  function end(e) {
    isChanging = false;
    d3.timer(coast, frame);
  }

  function coast() {
    if (isChanging) return true;                       // stop timer
    vel = parseInt( vel * 0.95 * 100, 10 ) / 100;  // 2 decimal precision
    if (Math.abs(vel) < 0.05) {
      el.removeClass("changing");
      return true;                                    // stop timer
    }
    else {
      shift += vel;
      update();
      return false;                                  // continue timer
    }
  }

  function update() {
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
  }

  function velCheck() {
    if (isChanging) {
      vel = shift - prevShift;
      prevShift = shift;
      return false;                                 // continue timer
    }
    else return true;                               // end timer
  }

}