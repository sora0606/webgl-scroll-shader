import { Color, Raycaster, Vector2 } from "three";

// https://codepen.io/zhaojun/pen/zZmRQe?editors=0010
export function blurTexture(canvas, ctx, blurRadius = 3) {
	const delta = 5;
	const alphaLeft = 1 / (2 * Math.PI * delta * delta);
	const step = blurRadius < 3 ? 1 : 2;

	let sum = 0;
	for (let y = -blurRadius; y <= blurRadius; y += step) {
		for (let x = -blurRadius; x <= blurRadius; x += step) {
			let weight = alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta));
			sum += weight;
		}
	}
	for (let y = -blurRadius; y <= blurRadius; y += step) {
		for (let x = -blurRadius; x <= blurRadius; x += step) {
			ctx.globalAlpha =
				((alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta))) / sum) * blurRadius;
			ctx.drawImage(canvas, x, y);
		}
	}
	ctx.globalAlpha = 1;
}

// https://codepen.io/ykob/pen/BQmLVN/
export function calcScreenRatio(resolution, imageResolution) {
	return new Vector2(
		Math.min(resolution.x / resolution.y / (imageResolution.x / imageResolution.y), 1.0),
		Math.min(resolution.y / resolution.x / (imageResolution.y / imageResolution.x), 1.0)
	);
}

export const TEMPLATE_COLORS = [
	"#DE3434",
	"#196FD3",
	"#3E9EE8",
	"#EFC245",
	"#ED7A48",
	"#54B28B",
	"#54B28B",
	"#9957B8",
	"#BBA2EF",
	"#EA3676",
].map((c) => new Color(c).toArray());

export function generateCardTexture() {
	const imagePromise = (path) =>
		new Promise<HTMLImageElement>((resolve) => {
			const img = new Image();
			img.onload = () => {
				resolve(img);
			};

			img.src = path;
		});

	const SIZE = 2048;
	const HALF = SIZE * 0.5;
	const ASPECT = 4 / 3;

	return async function (front, back) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = SIZE;
		canvas.height = SIZE;

		requestIdleCallback(async () => {
			const images = await Promise.all<[Promise<HTMLImageElement>, Promise<HTMLImageElement>]>([
				imagePromise(front),
				imagePromise(back),
			]);

			ctx.drawImage(images[0], 0, 0, HALF, HALF * ASPECT);
			ctx.drawImage(images[1], HALF, 0, HALF, HALF * ASPECT);
		});

		return canvas;
	};
}

export function setupInterceptor({ camera, target }) {
	const raycaster = new Raycaster();
	const pointer = new Vector2();

	return {
		setPointer(x, y, width, height, st) {
			pointer.x = (x / width) * 2 - 1;
			pointer.y = -((y + st) / height) * 2 + 1;
		},
		getIntersectedItems() {
			raycaster.setFromCamera(pointer, camera);
			return raycaster.intersectObjects(target);
		},
	};
}
