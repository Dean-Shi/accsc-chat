var socket = io.connect('/');

socket.on('sendhistory', function (history) {
  if ("" == history)
    return;
  $("[name=board]").val(history + '\n');
});

socket.on('boardcast', function (message) {
  $("[name=board]").val($("[name=board]").val() + message + '\n');
});

$("button").click(function () {
  socket.emit('sendmessage', $("[name=message]").val());
  $("[name=message]").val("");
});
