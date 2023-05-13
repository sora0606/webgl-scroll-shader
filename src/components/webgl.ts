import * as THREE from "three";
import vertex from "./modules/texture/vertex.glsl"
import fragment from "./modules/texture/fragment.glsl"
import ImagePlane from "./modules/texture";

export default () => {
    let renderer;
    let scene;
    let camera;
    let targetScrollY = 0; // 本来のスクロール位置
    let currentScrollY = 0; // 線形補間を適用した現在のスクロール位置
    let scrollOffset = 0; // 上記2つの差分

    const loader = new THREE.TextureLoader();
    const imagePlaneArray = [];

    const lerp = (start, end, multiplier) => {
        return (1 - multiplier) * start + multiplier * end;
    };

    const updateScroll = () => {
        // スクロール位置を取得
        targetScrollY = document.documentElement.scrollTop;
        // リープ関数でスクロール位置をなめらかに追従
        currentScrollY = lerp(currentScrollY, targetScrollY, 0.08);

        scrollOffset = targetScrollY - currentScrollY;
    };

	return {
		init() {
			console.log("init WebGL");

            const canvasEl = this.$refs.stage;
            const canvasSize = {
                w: window.innerWidth,
                h: window.innerHeight,
            };

            this.setup(canvasEl, canvasSize);
		},

        setup(canvas, {w, h}){
            renderer = new THREE.WebGLRenderer({canvas: canvas});
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(w, h);
            renderer.setAnimationLoop(this.loopAnimation);

            const FOV = 60;
            const FOV_RAD = (FOV / 2) * (Math.PI / 180);
            const CAMERA_NEAR = 0.1;
            const CAMERA_FAR = 1000;

            camera = new THREE.PerspectiveCamera(
                FOV,
                w / h,
                CAMERA_NEAR,
                CAMERA_FAR
            );
            camera.position.z = h / 2 / Math.tan(FOV_RAD);

            scene = new THREE.Scene();

            const imageArray = [...document.querySelectorAll('img')];
            for(const img of imageArray){
                const mesh = this.createMesh(img);
                scene.add(mesh);

                const imagePlane = new ImagePlane(mesh, img, {w, h});
                imagePlane.setParams();

                imagePlaneArray.push(imagePlane);
            }
        },

        createMesh(img){
            const texture = loader.load(img.src);

            const uniforms = {
                uTexture: { value: texture },
                uImageAspect: { value: img.naturalWidth / img.naturalHeight },
                uPlaneAspect: { value: img.clientWidth / img.clientHeight },
                uTime: { value: 0 },
            };

            const geo = new THREE.PlaneGeometry(1, 1, 100, 100);
            const mat = new THREE.ShaderMaterial({
                uniforms,
                vertexShader: vertex,
                fragmentShader: fragment
            });

            const mesh = new THREE.Mesh(geo, mat);

            return mesh;
        },

        loopAnimation(){
            updateScroll();

            for(const plane of imagePlaneArray){
                plane.update(scrollOffset);
            }

            renderer.render(scene, camera);
        }
	};
};
