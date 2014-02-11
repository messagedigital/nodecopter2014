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
var cleared = true;

Leap.loop({}, function(frame) {
  var hands = frame.hands;

  // Look ma, no hands!
  if (hands.length < 1) {
    // When hand is taken away, write a 0 to re-calibrate the drone. Only once until hand returns.
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

// Sample the altitude every 100 milliseconds
setInterval(function() {
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
