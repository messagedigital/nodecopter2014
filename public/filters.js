Filter = {};
Filter.filters = {};

Filter.tmpCanvas = document.createElement('canvas');
Filter.tmpCtx = Filter.tmpCanvas.getContext('2d');

Filter.getPixels = function(canvas, context) {
	context = context ? context : canvas.getContext('2d');
	return context.getImageData(0, 0, canvas.width, canvas.height);
};

Filter.applyFilter = function(canvas, context, filter) {
	var args = [this.getPixels(canvas, context)];
	for (var i=3; i<arguments.length; i++) {
		args.push(arguments[i]);
	}
	return filter.apply(null, args);
};

Filter.filterPixels = function(pixels, filter) {
	var args = [pixels];
	for (var i=2; i<arguments.length; i++) {
		args.push(arguments[i]);
	}
	return filter.apply(null, args);
};

Filter.createImageData = function(width, height) {
	return this.tmpCtx.createImageData(width, height);
}

Filter.filters.grayscale = function(pixels, args) {
	var d,r,g,b,v;

	d = pixels.data;
	for (var i=0; i<d.length; i+=4) {
		r = d[i];
		g = d[i+1];
		b = d[i+2];
		v = 0.2126*r + 0.7152*g + 0.0722*b;
		d[i] = d[i+1] = d[i+2] = v;
	}

	return pixels;
};

Filter.filters.sepia = function(pixels, args) {
	var d, ir, ig, ib, or, og, ob;

	d = pixels.data;
	for (var i=0; i<d.length; i+=4) {
		ir = d[i]; ig = d[i+1]; ib = d[i+2];

		or = Math.min(.393*ir + .769*ig + .189*ib, 255);
		og = Math.min(.349*ir + .686*ig + .168*ib, 255);
		ob = Math.min(.272*ir + .534*ig + .131*ib, 255);

		d[i] = or; d[i+1] = og; d[i+2] = ob;
	}

	return pixels;
};

Filter.filters.spycam = function(pixels, width, height) {
	var d, ir, ig, ib, or, og, ob;

	d = pixels.data;
	for (var i=0; i<d.length; i+=4) {
		ir = d[i]; ig = d[i+1]; ib = d[i+2];

		// apply blue style sepia
		or = .272*ir + .534*ig + .131*ib;
		og = .349*ir + .686*ig + .168*ib;
		ob = .393*ir + .969*ig + .589*ib;

		// adjust brightness towards the extremes
		or += ((or - 127) * 2);
		og += ((og - 127) * 2);
		ob += ((ob - 127) * 2);

		// wrap to 0->255
		or = Math.max(0, Math.min(or, 255));
		og = Math.max(0, Math.min(og, 255));
		ob = Math.max(0, Math.min(ob, 255));

		if (i % 40 == 0) {
			or *= .5;
			og *= .5;
			ob *= .5;
		}

		// or *= (i % width);
		// og *= (i % width);
		// ob *= (i % width);

		d[i] = or; d[i+1] = og; d[i+2] = ob;
	}

	return pixels;
};

Filter.filters.convoluteFloat32 = function(pixels, weights, opaque) {
	var side = Math.round(Math.sqrt(weights.length));
	var halfSide = Math.floor(side/2);

	var src = pixels.data;
	var sw = pixels.width;
	var sh = pixels.height;

	var w = sw;
	var h = sh;
	var output = {
		width: w, height: h, data: new Float32Array(w*h*4)
	};
	var dst = output.data;

	var alphaFac = opaque ? 1 : 0;

	for (var y=0; y<h; y++) {
		for (var x=0; x<w; x++) {
			var sy = y;
			var sx = x;
			var dstOff = (y*w+x)*4;
			var r=0, g=0, b=0, a=0;
			for (var cy=0; cy<side; cy++) {
				for (var cx=0; cx<side; cx++) {
					var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
					var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
					var srcOff = (scy*sw+scx)*4;
					var wt = weights[cy*side+cx];
					r += src[srcOff] * wt;
					g += src[srcOff+1] * wt;
					b += src[srcOff+2] * wt;
					a += src[srcOff+3] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff+1] = g;
			dst[dstOff+2] = b;
			dst[dstOff+3] = a + alphaFac*(255-a);
		}
	}
	return output;
};

Filter.filters.sobel = function(pixels, args) {
	pixels = Filter.filterPixels(pixels, Filter.filters.grayscale);

	var vertical = Filter.filters.convoluteFloat32(pixels,
	  [ -1, 0, 1,
	    -2, 0, 2,
	    -1, 0, 1 ]);
	var horizontal = Filter.filters.convoluteFloat32(pixels,
	  [ -1, -2, -1,
	     0,  0,  0,
	     1,  2,  1 ]);

	var newImage = Filter.createImageData(vertical.width, vertical.height);
	for (var i=0; i<pixels.data.length; i+=4) {
		// make the vertical gradient red
		var v = Math.abs(vertical.data[i]);
		newImage.data[i] = v;
		// make the horizontal gradient green
		var h = Math.abs(horizontal.data[i]);
		newImage.data[i+1] = h;
		// and mix in some blue for aesthetics
		newImage.data[i+2] = (v+h)/4;
		newImage.data[i+3] = 255; // opaque alpha
	}

	return newImage;
};