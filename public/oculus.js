// @see https://github.com/benvanik/vr.js/blob/master/examples/threejs_boxes_demo.html
// @see http://stemkoski.github.io/Three.js/Video.html
var Oculus;

Oculus = (function() {
	function Oculus() {
		this.controls = null;
		this.effect   = null;
		this.state    = null;
		this.rotationChangeCallback = null;
	}

	Oculus.prototype.detect = function(callback) {
		var self = this;

		if (!vr.isInstalled()) {
			alert('NPVR plugin not installed!');
		}

		vr.load(function(error) {
			if (error) {
				alert('NVPR plugin failed with error: ' + error.toString());
			}

			self.state = new vr.State();
			self.update();
			callback();
		});
	};

	Oculus.prototype.update = function() {
		var self = this;
		requestAnimationFrame(function() {
			self.update();
		});
		this.getRotation();
	}

	Oculus.prototype.onRotationChange = function(callback) {
		this.rotationChangeCallback = callback;
	};

	Oculus.prototype.getRotation = function() {
		var raw, newRotation;

		if (! this.rotationChangeCallback) {
			console.error('No rotation change callback set using onRotationChange');
			return;
		}

		if (! vr.pollState(this.state)) {
			console.error('NPVR plugin not found / error polling');
			return;
		}

		if (! this.state.hmd.present) {
			console.error('Oculus Rift not present');
			return;
		}

		raw = this.state.hmd.rotation;

		newRotation = {
			x: raw[0].toFixed(2),
			y: raw[1].toFixed(2),
			z: raw[2].toFixed(2)
		};

		if (
			! this.rotation || (
				this.rotation.x != newRotation.x ||
				this.rotation.y != newRotation.y ||
				this.rotation.z != newRotation.z
			)
		) {
			this.rotation = newRotation;
			this.rotationChangeCallback(this.rotation);
		}
	}

	Oculus.prototype.showVideo = function() {
		var self = this;

		var camera, scene, renderer,
			geometry, material, mesh;

		var video, videoImage, videoImageContext, videoTexture,
			videoMaterial, videoGeometry, videoScreen;

		var fov = 90,
			videoWidth = 640,
			videoHeight = 480;

		init();
		animate();

		function init() {
			createRenderer();
			getWebcam();
		}

		function createRenderer() {
			// Create a camera
			camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);

			// Create a scene
			scene = new THREE.Scene();

			// Get the oculus rift controls and add them to the scene
			self.controls = new THREE.OculusRiftControls(camera);
			scene.add(self.controls.getObject());

			// Create renderer and apply oculus rift effect
			renderer = new THREE.WebGLRenderer({
				devicePixelRatio: 1,
				alpha: false,
				clearColor: 0xffffff,
				antialias: true
			});
			riftEffect = new THREE.OculusRiftEffect(renderer);

			// Add renderer to document
			document.body.appendChild(renderer.domElement);
		}

		function getWebcam() {
			navigator.webkitGetUserMedia({video: true, audio: false}, function(stream) {
				// Create the video element and grab the src from the webcam stream
				video = document.createElement('video');
				video.src = window.URL.createObjectURL(stream);
				video.play();

				// Create a canvas for the video
				videoImage = document.createElement('canvas');
				videoImage.width = videoWidth;
				videoImage.height = videoHeight;

				// Blank out the canvas if there is no video
				videoImageContext = videoImage.getContext('2d');
				videoImageContext.fillStyle = '#000000';
				videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

				// Create a texture from the video image
				videoTexture = new THREE.Texture(videoImage);
				videoTexture.minFilter = THREE.LinearFilter;
				videoTexture.magFilter = THREE.LinearFilter;

				// Create a material and geometry and apply them to a mesh
				videoMaterial = new THREE.MeshBasicMaterial({
					map: videoTexture,
					overdraw: true
				})
				videoGeometry = new THREE.PlaneGeometry(240, videoHeight * (240 / videoWidth), 4, 4);
				videoScreen = new THREE.Mesh(videoGeometry, videoMaterial);
				videoScreen.position.set(0, 0, 0);

				// Add the video screen mesh to the scene and point the camera at it
				scene.add(videoScreen);

				camera.position.set(0, 0, 100);
				camera.lookAt(videoScreen.position);
			});
		}

		function animate() {
			requestAnimationFrame(animate);
			render();
			update();
		}

		function update() {
			//
		}

		function render()  {
			if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
				videoImageContext.drawImage(video, 0, 0);

				// Apply filter
				// var data = CanvasFilter.applyFilter(videoImage, videoImageContext, CanvasFilter.filters.spycam, videoImage.width, videoImage.height);
				// videoImageContext.putImageData(data, 0, 0);

				if (videoTexture) {
					videoTexture.needsUpdate = true;
				}
			}

			var polled = vr.pollState(self.state);
			riftEffect.render(scene, camera, polled ? self.state : null);
		}
	};

	return Oculus;
})();