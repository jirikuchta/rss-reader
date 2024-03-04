export default class Swipe {

	threshold = 50; // px
	movetreshold = 5 // px

	protected node: HTMLElement;
	protected startTouch: Touch | null;

	constructor(node: HTMLElement) {
		this.node = node;
		this.startTouch = null;
		node.addEventListener("touchstart", this, {passive: true});
	}

	onSwipe(dir: "top" | "right" | "bottom" | "left") {}

	handleEvent(e: TouchEvent) {
		switch (e.type) {
			case "touchstart": this.start(e); break;
			case "touchcancel": this.stop(); break;
			case "touchend": this.onTouchEnd(e); break;
		}
	}

	protected start(e: TouchEvent) {
		this.startTouch = e.touches[0];
		document.body.addEventListener("touchend", this, {passive: true});
		document.body.addEventListener("touchcancel", this, {passive: true});
	}

	protected stop() {
		this.startTouch = null;
		document.body.removeEventListener("touchend", this);
		document.body.removeEventListener("touchcancel", this);
	}

	protected onTouchEnd(e: TouchEvent) {
		if (!this.startTouch) { return; }
		this.swipe(e);
		this.stop();
	}

	protected swipe(e: TouchEvent) {
		if (!this.startTouch) { return; }

		let deltaX = e.changedTouches[0].clientX - this.startTouch.clientX;
		let deltaY = e.changedTouches[0].clientY - this.startTouch.clientY;

		if (Math.abs(deltaY) > Math.abs(deltaX)) {
			if (Math.abs(deltaY) < this.threshold) { return; }
			this.onSwipe(deltaY > 0 ? "bottom" : "top");
		} else {
			if (Math.abs(deltaX) < this.threshold) { return; }
			this.onSwipe(deltaX > 0 ? "right" : "left");
		}
	}
}
