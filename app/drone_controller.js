var net			= require('net');
var arDrone		= require('ar-drone');
var client		= arDrone.createClient();
var leapClient	= net.connect(1337, 'localhost', function() {});

var riftIo = require('socket.io').listen(1339);

riftIo.sockets.on('connection', function (socket) {
	socket.on('rotation', function (data) {
		console.log(data);
		var updown		= Math.round(data.rotation.x * 100)/100;
		var leftright	= Math.round(data.rotation.y * 100)/100;
		var boundry		= 0.2;
		var speed		= 0.5;

		console.log('leftright: ' + leftright);
		console.log('duration: ' + duration);

		if (leftright > boundry) {
			console.log('clockwise');
			client.clockwise(speed)
		}
		else if (leftright < -(boundry)) {
			console.log('counterClockwise');
			client.counterClockwise(speed);
		}
		else {
			console.log('stop');
			client.stop();
		}
	});
});

var inair		= false;
var landing		= false;
var calibrated	= false;

leapClient.on('data', function(data) {
	var input = parseInt(data.toString());
	var duration	= 500;
	console.log('data: ' + data);
	console.log('input: ' + input);
	if (input !== null) {
		if (!inair) {
			console.log('inair', inair);
			client.takeoff();
			setTimeout(function() {client.calibrate(); setTimeout(function() {calibrated = true;}, 1000); console.log('calibrated'); }, 5000);
			console.log('calibrated', calibrated);
			inair	= true;
		}
		else if (calibrated) {
			speed = Math.abs(input);
			speed = (input > 20) ? 20 : input;

			speed = speed / 20;

			// if (speed > 0.6) {
			// 	speed = 0.6;
			// }

			console.log('calculated speed: ' + speed);

			if (speed > 0.5) {
				speed = 0.6;
			}
			else {
				speed = 0.3;
			}

			console.log('speed: ' + speed);

			if (input > 0) {
				duration	= input * 100;
				console.log('up');
				client.up(speed);
			}
			else if (input < 0) {
				duration	= -(input) * 100;
				console.log('down');
				client.down(speed);
			}
			else if (input == 'recalibrate') {
				console.log('re-calibrating (not really)');
				//client.calibrate();
				//setTimeout(function() {calibrated = true; console.log('re-calibrated');}, 1000);
			}

			if (duration > 1500) {
				//duration = 1500;
			}
			console.log('duration: ' + duration);
			setTimeout(function() {
				console.log('stopping');
				//client.stop();
			}, duration);
		}
	}

//	setTimeout(function() { console.log('waiting'); }, 200);
});