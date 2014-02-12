var net			= require('net');
var arDrone		= require('ar-drone');
var client		= arDrone.createClient();
var leapClient	= net.connect(1337, 'localhost', function() {});
var Parser      = require('./PaVEParser');
var parser = new Parser;

var riftIo = require('socket.io').listen(1339);
// var ss = require('socket.io-stream');
// var ssstream = ss.createStream();

var sockets = [];
/*
// Video stream
var stream = client.getPngStream();
//	stream.on('data', console.log);
// var stream2 = client.getVideoStream();
	//stream2.on('data', console.log);

	stream.on('data', function(frame) {
		parser.write(frame);
	});

	parser.on('data', function(frame) {
		//console.log(frame);
		sockets.forEach(function(socket) {
			console.log('EMITTING VIDEO');
			socket.emit('video', {frame: frame});
			// ss(socket).emit('video', ssstream, {size: file.size});
   			// ss.createBlobReadStream(frame).pipe(stream);
		});
	});
	// stream2.on('data', function(frame) {
	// 	//console.log(frame);
	// 	sockets.forEach(function(socket) {
	// 		socket.emit('video', frame);
	// 	});
	// });
*/
riftIo.sockets.on('connection', function (socket) {
	sockets.push(socket);

	socket.on('rotation', function (data) {
		console.log(data);
		var updown		= Math.round(data.rotation.x * 100)/100;
		var leftright	= Math.round(data.rotation.y * 100)/100;
		var tilt		= Math.round(data.rotation.z * 100)/100;

		var boundry		= 0.4;
		var tiltSwitch	= 0.25;
		var tiltSpeed	= 0.2;
		var speed		= 0.8;

		console.log('leftright: ' + leftright);
		// console.log('duration: ' + duration);

		if (leftright < -boundry) {
			console.log('clockwise');
			client.clockwise(speed);
		}
		else if (leftright > boundry) {
			console.log('counterClockwise');
			client.counterClockwise(speed);
		}
		else {
			console.log('stop-rotation');
			client.clockwise(0);
		}

		if (updown < -0.5) {
			client.land();
		}

		/*if (tilt > tiltSwitch) {
			console.log('tilt right');
			client.right(0.1);
		}
		else if (tilt < -tiltSwitch) {
			console.log('tilt left');
			client.left(0.1);
		}
		else {
			console.log('stop-tilt');
			client.right(0);
		}*/
	});

	// // Send PNG data
	// stream.on('data', function(frame) {
	// 	//console.log(frame);
	// 	console.log(socket);
	// 	socket.emit('video', frame);
	// });
	// stream2.on('data', function(frame) {
	// 	//console.log(frame);
	// 	socket.emit('video', frame);
	// });
});

var inair		= false;
var landing		= false;
var calibrated	= false;

leapClient.on('data', function(data) {
	var input = parseInt(data.toString());
	var duration	= 500;
	console.log('data: ' + data);
	console.log('input: ' + input);
	if (data !== null) {
		if (!inair) {
			console.log('inair', inair);
			client.disableEmergency();
			client.takeoff();
			setTimeout(function() {client.calibrate(); setTimeout(function() {calibrated = true;}, 1000); console.log('calibrated'); }, 5000);
			console.log('calibrated', calibrated);
			inair	= true;
		}
		else if (calibrated) {
			speed = Math.abs(input);
			speed = (input > 20) ? 20 : input;

			speed = speed / 20;

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
				console.log('up: ' + input);
				console.log('up-speed: ' + speed)
				client.up(speed);
			}
			else if (input < 0) {
				duration	= -(input) * 100;
				console.log('down: ' + input);
				console.log('down-speed: ' + input);
				client.down(speed);
			}
			else if (data == 'recalibrate') {
				console.log('re-calibrating (not really)');
				//client.calibrate();
				//setTimeout(function() {calibrated = true; console.log('re-calibrated');}, 1000);
			}

			console.log('duration: ' + duration);
			setTimeout(function() {
				console.log('stopping (setTimeout)');
				//client.stop();
			}, duration);
		}
	}

// //	setTimeout(function() { console.log('waiting'); }, 200);
});