var net = require('net');
var arDrone		= require('ar-drone');
var client		= arDrone.createClient();
var leapClient	= net.connect(1337, 'localhost', function() {});
var riftClient	= net.connect(1337, '192.168.1.2', function() {});

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

riftClient.on('data', function(data) {
	console.log(data);
	var updown		= Math.round(data.x * 100)/100;
	var leftright	= Math.round(data.y * 100)/100;
	var rotate		= leftright;
	if (leftright < 0) {
		rotate	= -(leftright);
	}
	var duration	= rotate * 2000;
	var speed		= 0.5;

	console.log('leftright: ' + leftright);
	console.log('duration: ' + duration);

	if (leftright > 0) {
		console.log('clockwise');
//		client.clockwise(speed)
	}
	else if (leftright < 0) {
		console.log('counterClockwise');
//		client.counterClockwise(speed);
	}

	setTimeout(function() {
		console.log('setTimeout');
	}, duration);

});