export default class Swipe {

	threshold = 50; // px
	movetreshold = 5 // px

	protected node: HTMLElement;
	protected startTouch: Touch | null;

	constructor(node: HTMLElement) {
		this.node = node;
		this.startTouch = null;

		node.addEventListener("touchstart", this);
	}

	onSwipeRight() {}
	onSwipeLeft() {}

	handleEvent(e: TouchEvent) {
		switch (e.type) {
			case "touchstart": this.start(e); break;
			case "touchcancel": this.stop(); break;
			case "touchend": this.onTouchEnd(e); break;
		}
	}

	protected start(e: TouchEvent) {
		this.startTouch = e.touches[0];
		document.body.addEventListener("touchend", this);
		document.body.addEventListener("touchcancel", this);
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

		let movementX = this.startTouch.clientX - e.changedTouches[0].clientX;
		let movementY = this.startTouch.clientY - e.changedTouches[0].clientY;

		if (Math.abs(movementX) > this.threshold) {
			if (Math.abs(movementX) > Math.abs(movementY)) {
				movementX > 0 ? this.onSwipeRight() : this.onSwipeLeft();
			}
		}
	}
}
