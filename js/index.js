"use strict";

$(function() {
  var animationEndPrefixes = "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd";

  function setupTimer() {
    var timeIntervals = [10, 15, 20, 25, 30, 35, 40];
    var selectedTimeInterval = parseInt(window.localStorage.defaultTimeInterval);
    if ($.inArray(selectedTimeInterval, timeIntervals) < 0) {
      selectedTimeInterval = 20;
    }
    var meditationProgressTimer = null;
    var lock = null;

    $("#content").html(ich.meditationDialog({ 'duration': selectedTimeInterval }));
    $("#meditation-dialog").fadeIn('fast');

    $("#time-options").append(ich.timeOptionButtons({'timeIntervals': timeIntervals.map(function v(val) { return { "value": val } }) }));

    function intervalSelected(timeInterval) {
      selectedTimeInterval = timeInterval;
      window.localStorage.defaultTimeInterval = selectedTimeInterval;
      $("#meditation-text").html(timeInterval + " minute meditation");
      $(".time-selector-btn").removeClass('btn-link-selected');
      $("#time-button-" + timeInterval).addClass('btn-link-selected');
    };
    timeIntervals.forEach(function(timeInterval) {
      $("#time-button-" + timeInterval).click(function() {
        intervalSelected(timeInterval);
      });
    });
    intervalSelected(selectedTimeInterval);

    function reset() {
      $("#bell").off();

      if (lock) {
        lock.unlock();
        lock = null;
      }
      window.clearTimeout(meditationProgressTimer);
      meditationProgressTimer = null;
      intervalSelected(selectedTimeInterval);
      $("#about-link").show();
      $("#start-button").html("Begin");
    }

    $("#start-button").click(function() {
      if (window.navigator.requestWakeLock) {
        // currently only works on FirefoxOS :(
        lock = window.navigator.requestWakeLock('screen');
      }
      if (meditationProgressTimer) {
        $("#bell").get(0).pause(); // stop bell if playing
        reset();
        return;
      }

      $("#start-button").html("Cancel");
      $("#about-link").hide();
      $("#meditation-text").html("Prepare for meditation " +
                                 "<span class='blink'>...</span>");
      var startTime = null;
      meditationProgressTimer = window.setTimeout(function() {
        if (!startTime) {
          startTime = Date.now();
        }
        function timerFired() {
          var elapsed = parseInt((Date.now() - startTime) / 1000.0);
          var timeRemaining = (selectedTimeInterval * 60) - elapsed;

          var minutesRemaining = parseInt(timeRemaining / 60);
          var secondsRemaining = timeRemaining % 60;
          function doubleDigits(num) {
            if (num < 10) {
              return "0" + num;
            }
            return num;
          }
          $("#meditation-text").html(doubleDigits(minutesRemaining) + ":" +
                                     doubleDigits(secondsRemaining));
          if (timeRemaining > 0) {
            meditationProgressTimer = window.setTimeout(timerFired, 1000);
          } else {
            // we're done
            $("#meditation-text").html("<span class='blink'>00:00</span>");
            $("#bell").get(0).currentTime = 0;
            $("#bell").get(0).play();

            $("#bell").on("ended", reset);
          }
        }
        $("#bell").get(0).play();
        timerFired();
      }, 10*1000);
    });

    $("#about-link").click(function() {
      $("#meditation-dialog").fadeOut("fast", function() {
        $("#content").html(ich.aboutDialog());
        $("#about-dialog").fadeIn('fast');
        $("#return-button").click(function() {
          $("#about-dialog").fadeOut("fast", function() {
            setupTimer();
          });
        })
      });
    });
  }
  setupTimer();
});
