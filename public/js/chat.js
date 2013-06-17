// Global Variables
// ================
var socket;
var flagBottom = true;

// Selectors
// =========
var $MESSAGE = "#message"
var $BOARD = "#board"
var $BOARD_END = "#boardend"


// Utility Methods
// ===============
var appendContent = function (packet) {
  var contentBlock = $("<div>", {class: "content"});
  var lines = packet.content.split('\n');

  var timestamp = new Date(packet.timestamp);
  var currentTime = "[" + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds() + "]";

  var $nickname = $("<span>", {class: "nickname"}).text(packet.nickname);
  var $timestamp = $("<span>", {class: "timestamp"}).text(currentTime);
  var $header = $("<span>", {class: "header"}).append($timestamp).append($nickname).append("says:");

  contentBlock.append($header).append("<br>");
  for (var i = 0; i < lines.length; i++)
    contentBlock.append($("<span>", {class: "line"}).text(lines[i])).append("<br>");

  $($BOARD_END).before(contentBlock);

  if (flagBottom)
    $($BOARD).scrollTo($BOARD_END);
}

var appendSystemMessage = function (type, sender, currentTime, lines) {
  var contentBlock = $("<div>", {class: type});

  var $sender = $("<span>", {class: "nickname"}).text(sender);
  var $timestamp = $("<span>", {class: "timestamp"}).text(currentTime);
  contentBlock.append($sender).append($timestamp).append("<br>");
  for (var i = 0; i < lines.length; i++)
    contentBlock.append($("<span>", {class: "line"}).text(lines[i])).append("<br>");

  $($BOARD_END).before(contentBlock);

  if (flagBottom)
    $($BOARD).scrollTo($BOARD_END);
}

var handleSystemEvent = function (packet) {
  var timestamp = new Date(packet.timestamp);
  var currentTime = "[" + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds() + "]";

  if (packet.error) {
    var sender = "[Error]";
    var lines = packet.error.split('\n');

    appendSystemMessage("error", sender, currentTime, lines);
  }

  if (packet.message) {
    var sender = "[System]";
    var lines = packet.message.split('\n');

    appendSystemMessage("system", sender, currentTime, lines);
  }

  // TODO handle other feedbacks
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
    
    socket.on("se_sendpacket", function (packet) {
      switch (packet.type.split('/', 1)[0]) {
        case "text":
          appendContent(packet);
          break;
        case "system":
          handleSystemEvent(packet);
          break;
        default:
          console.log("Unable to handle packet: " + JSON.stringfy(packet));
      }
    });
  }

  var setupListeners = function () {
    $($MESSAGE).keydown(function (e) {
      switch (e.keyCode) {
        case 13: // Enter/Return
          if (e.ctrlKey) {
            e.preventDefault();
            sendMessage();
          }
          break;
        // TODO more events (e.g., Ctrl + UP/DOWN for history)
      }
    });

    $($BOARD).scroll(function () {
      var $this = $(this);

      if ($this[0].offsetHeight + $this[0].scrollTop >= $this[0].scrollHeight)
        flagBottom = true;
      else
        flagBottom = false;
    });
  }

  setupSocketIOHandlers();
  setupListeners();
});
