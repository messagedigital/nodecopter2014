var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	url = require("url"),
	fs = require('fs'),
	path = require("path");

var ip = '0.0.0.0',
	port = 1340;

app.listen(port, ip);

function handler (req, res) {
	var uri = url.parse(req.url).pathname;
		if(uri == '/') {
		uri = 'index.htm';
	}

	var fullPath = path.join(__dirname + "/../public", uri);
	fs.readFile(fullPath, function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading '+fullPath);
		}
		res.writeHead(200);
		res.end(data.toString().replace('{#server}', ip+':'+port));
	});
}