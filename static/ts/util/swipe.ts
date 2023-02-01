export default class Swipe {

	threshold = 50; // px
	movetreshold = 5 // px

	protected node: HTMLElement;
	protected pointerdownEvent: PointerEvent | null;

	constructor(node: HTMLElement) {
		this.node = node;
		this.pointerdownEvent = null;

		node.addEventListener("pointerdown", this);
	}

	onSwipeRight() {}
	onSwipeLeft() {}

	handleEvent(e: PointerEvent) {
		switch (e.type) {
			case "pointerdown": this.start(e); break;
			case "pointercancel": this.stop(); break;
			case "pointerup": this.onPointerUp(e); break;
		}
	}

	protected start(e: PointerEvent) {
		this.pointerdownEvent = e;
		document.body.addEventListener("pointerup", this);
		document.body.addEventListener("pointercancel", this);
	}

	protected stop() {
		this.node.style.transform = "";
		this.pointerdownEvent = null;
		document.body.removeEventListener("pointerup", this);
		document.body.removeEventListener("pointercancel", this);
	}

	protected onPointerUp(e: PointerEvent) {
		if (!this.pointerdownEvent) { return; }
		this.swipe(e);
		this.stop();
	}

	protected swipe(e: PointerEvent) {
		if (!this.pointerdownEvent) { return; }

		let movementX = this.pointerdownEvent.x - e.x;
		let movementY = this.pointerdownEvent.y - e.y;

		if (Math.abs(movementX) > this.threshold) {
			if (Math.abs(movementX) > Math.abs(movementY)) {
				movementX > 0 ? this.onSwipeRight() : this.onSwipeLeft();
			}
		}
	}
}
