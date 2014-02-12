var Leap    = require('leapjs');
var net     = require('net');
var port    = 1337;
var clients = [];
var server  = net.createServer(function(socket) {
  // Add the client to the array of clients
  var i = clients.push(socket);

  // Remove the client from the clients array when they bail
  socket.on('end', function() {
    clients.splice(i - 1, 1);
  });
}).listen(port);

var altitudeChangeThreshold = 10;
var altitude = null;
var lastSampledAltitude = null;
var cleared = true; // var to ensure re-calibrate command is not duplicated

Leap.loop({}, function(frame) {
  var hands = frame.hands;

  // If there's no hands or more than 1 hand, stop and re-calibrate
  if (hands.length <> 1) {
    if (!cleared) {
      write(0);
      cleared = true;
    }
    return;
  }

  cleared = false;

  // Get the first hand
  var hand = hands[0];

  // Get the hand altitude
  var pos  = hand.palmPosition;

  altitude = pos[1];
});

// Sample the altitude every 200 milliseconds
setInterval(function() {
  // Get the difference in altitude, reverse it so positive is up and use a multiplier to make the number smaller
  var change = -1 * Math.round((lastSampledAltitude - altitude) * 0.05);

  if (0 == change) {
    return;
  }

  console.log(change);

  write(change);

  lastSampledAltitude = altitude;
}, 200);

// Send altitude to all clients
function write(msg) {
  clients.forEach(function(client) {
    client.write(String(msg));
  });
}
