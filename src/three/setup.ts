import { PerspectiveCamera, Scene, sRGBEncoding, Uniform, Vector2, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function dispatchModuleMethod(installedModules) {
	return function (target, ...args) {
		installedModules
			.filter((methods) => methods?.[target])
			.forEach((methods) => methods[target](...args));
	};
}

function setup({ assetsPath, stage, root, modules = [] }) {
	const FOV = 60;
	const FOV_RAD = (FOV / 2) * (Math.PI / 180);
	const CAMERA_NEAR = 0.01;
	const CAMERA_FAR = 7000;

	const uniforms: any = {};

	let requestId;
	let scene;
	let renderer;
	let camera;
	let directionalLight;
	let startTime;

	let initialized = false;

	let moduleDispatcher = dispatchModuleMethod([]);

	function _setupUniforms(stage) {
		uniforms.uPixelRatio = new Uniform(window.devicePixelRatio);
		uniforms.uTime = new Uniform(0);
		uniforms.uNormalizedTime = new Uniform(0);
		uniforms.uResolution = new Uniform(new Vector2(stage.scrollWidth, stage.scrollHeight));
		uniforms.uResolutionRadius = new Uniform(
			Math.sqrt(stage.scrollWidth ** 2 + stage.scrollHeight ** 2) * 0.5
		);
	}

	function _setupWorld(stage) {
		scene = new Scene();
		camera = new PerspectiveCamera(
			FOV,
			stage.scrollWidth / stage.scrollHeight,
			CAMERA_NEAR,
			CAMERA_FAR
		);
		camera.position.z = stage.scrollHeight / 2 / Math.tan(FOV_RAD);
		camera.lookAt(0, 0, 0);

		renderer = new WebGLRenderer({
			antialias: true,
			alpha: false,
		});

		renderer.setClearColor(0xeceef1, 1.0);
		renderer.setSize(stage.scrollWidth, stage.scrollHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
		renderer.outputEncoding = sRGBEncoding;

		// // For debug
		const controls = new OrbitControls(camera, renderer.domElement);
		// controls.enableZoom = false;
		controls.update();

		stage.appendChild(renderer.domElement);
	}

	const resize = (width, height) => {
		if (!camera || !renderer) {
			return;
		}

		renderer.setSize(width, height);

		camera.position.z = window.innerHeight / 2 / Math.tan(FOV_RAD);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		uniforms.uResolution.value = new Vector2(width, height);
		uniforms.uResolutionRadius.value = Math.sqrt(width ** 2 + height ** 2) * 0.5;
	};

	const render = (timestamp) => {
		if (startTime === undefined) {
			startTime = timestamp;
		}
		const time = (timestamp - startTime) * 0.025;
		uniforms.uTime.value = time;
		uniforms.uNormalizedTime.value = time / 360;

		moduleDispatcher("render", time);

		renderer.render(scene, camera);

		if (requestId) cancelAnimationFrame(requestId);
		requestId = requestAnimationFrame(render);
	};

	const click = (e) => {
		if (!initialized) {
			return;
		}

		moduleDispatcher("click", e.x, e.y);
	};

	const start = () => {
		requestId = requestAnimationFrame(render);
	};

	const stop = () => {
		if (requestId) cancelAnimationFrame(requestId);
	};

	const mount = () => {
		_setupUniforms(stage);
		_setupWorld(stage);

		const installedModules = modules.map((module) =>
			module({
				root,
				scene,
				camera,
				directionalLight,
				renderer,
				uniforms,
				assetsPath,
			})
		);
		moduleDispatcher = dispatchModuleMethod(installedModules);

		const ro = new ResizeObserver(() => {
			const { width, height } = stage.getBoundingClientRect();
			resize(width, height);
			moduleDispatcher("resize", width, height);
		});
		ro.observe(stage);

		const io = new IntersectionObserver((entries) => {
			const entry = entries[0];
			if (entry.isIntersecting) {
				start();
			} else {
				stop();
			}
		});
		io.observe(root);

		root.dispatchEvent(new CustomEvent("init"));
		initialized = true;

		return function () {
			io.disconnect();
			ro.disconnect();
			moduleDispatcher("dispose");
			root.dispatchEvent(new CustomEvent("unmounted"));
		};
	};

	const action = () => {
		root.dispatchEvent(new CustomEvent("action"));
	};

	return {
		uniforms,
		dispatch: moduleDispatcher,
		mount,
		resize,
		render,
		start,
		stop,
		click,
		action,
	};
}

export default setup;
