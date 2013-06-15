// Global Variables
// ================
var socket;

// Selectors
// =========
var $MESSAGE = "#message"
var $BOARD = "#board"
var $LATEST_TAG;


// Utility Methods
// ===============
var appendContent = function (content) {
  var tag = "t" + (new Date().getTime()) + "-" + (Math.random() + "").substring(2);
  $($BOARD).append($("<div>", {id: tag, class: "content"}).text(content));
  $LATEST_TAG = "#" + tag;
}

var sendMessage = function () {
  socket.emit("ce_message", $($MESSAGE).val());
  $($MESSAGE).val("");
}


// Init
// ====
$(function () {
  var setupSocketIOHandlers = function () {
    socket = io.connect('/');
    
    socket.on("se_history", function (history) {
      if (0 == history.length)
        return;
      for (var i = 0; i < history.length; i++) {
        appendContent(history[i]);
      };
    });
    
    socket.on("se_boardcast", function (message) {
      appendContent(message);
    });
  }

  var setupListeners = function () {
    $($MESSAGE).keydown(function (e) {
      switch (e.keyCode) {
        case 13: // Enter/Return
          if (e.ctrlKey)
            sendMessage();
          break;
        // TODO more events (e.g., Ctrl + UP/DOWN for history)
      }
    });
  }

  var setupScrollTimer = function () {
    $()
  }

  setupSocketIOHandlers();
  setupListeners();
});
