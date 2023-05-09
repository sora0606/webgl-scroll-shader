function mouseStalker({
	stage,
	dampingFactor = 0.05,
	onUpdate,
	onEnter,
	onLeave,
	updatePointManually = false,
	updateRectManually = false,
}) {
	const IS_TOUCH_DEVICE = navigator.maxTouchPoints || "ontouchstart" in document.documentElement;

	let x = 0;
	let y = 0;
	let dx = 0;
	let dy = 0;
	let requestId = null;
	let stageRect = stage.getBoundingClientRect();

	// private
	// ------------------------------
	function _clamp(val, min = -1, max = 1) {
		return Math.max(min, Math.min(val, max));
	}

	function _updatePoint(_x, _y) {
		stageRect = stage.getBoundingClientRect();
		x = _clamp(((_x - stageRect.x) / stageRect.width) * 2 - 1);
		y = _clamp(((_y - stageRect.y) / stageRect.height) * 2 - 1);
	}

	function _mouseMove(e) {
		_updatePoint(e.x, e.y);
	}

	function _updateStageRect() {
		stageRect = stage.getBoundingClientRect();
	}

	function _render() {
		dx += (x - dx) * dampingFactor;
		dy += (y - dy) * dampingFactor;

		onUpdate({
			dx,
			dy,
			x,
			y,
		});

		if (requestId) cancelAnimationFrame(requestId);
		requestId = requestAnimationFrame(_render);
	}

	// public
	// ------------------------------
	const updateMouseMoving = (_x, _y) => {
		_updatePoint(_x, _y);
	};

	const updateStageRect = () => {
		_updateStageRect();
	};

	const start = () => {
		if (IS_TOUCH_DEVICE) {
			return;
		}
		requestId = requestAnimationFrame(_render);
	};

	const stop = () => {
		if (IS_TOUCH_DEVICE) {
			return;
		}
		if (requestId) cancelAnimationFrame(requestId);
	};

	const io = new IntersectionObserver((entries) => {
		const entry = entries[0];
		if (entry.isIntersecting) {
			start();
		} else {
			stop();
		}
	});
	const ro = new ResizeObserver(_updateStageRect);

	function _mouseEnter() {
		onEnter && onEnter();
	}
	function _mouseLeave() {
		onLeave && onLeave();
	}

	const mount = () => {
		if (IS_TOUCH_DEVICE) {
			return;
		}

		if (!updatePointManually) {
			stage.addEventListener("mousemove", _mouseMove);
		}

		stage.addEventListener("mouseenter", _mouseEnter);
		stage.addEventListener("mouseleave", _mouseLeave);

		if (!updateRectManually) {
			window.addEventListener("scroll", _updateStageRect);
		}

		io.observe(stage);
		ro.observe(stage);
	};

	const dismount = () => {
		if (IS_TOUCH_DEVICE) {
			return;
		}

		x = 0;
		y = 0;
		dx = 0;
		dy = 0;
		stop();

		if (!updatePointManually) {
			stage.removeEventListener("mousemove", _mouseMove);
		}

		stage.removeEventListener("mouseenter", _mouseEnter);
		stage.removeEventListener("mouseleave", _mouseLeave);

		if (!updateRectManually) {
			window.removeEventListener("scroll", _updateStageRect);
		}

		io.disconnect();
		ro.disconnect();
	};

	return {
		start,
		stop,
		mount,
		dismount,
		updateMouseMoving,
		updateStageRect,
	};
}

export default mouseStalker;
