import * as html from "util/html";

type PositionType = "side" | "below";
interface Position {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

const PAD = 8;
let current: Popup | null = null;

function preventOverflow(position: Position, type: string, avail: [number, number]) {
	let overflow = 0;

	switch (type) {
		case "left":
			overflow = PAD - position.left;
			if (overflow > 0) {
				position.left += overflow;
				position.right += overflow;
			}
		break;

		case "right":
			overflow = position.right + PAD - avail[0];
			if (overflow > 0) {
				position.left -= overflow;
				position.right -= overflow;
			}
		break;

		case "bottom":
			overflow = position.bottom + PAD - avail[1];
			if (overflow > 0) {
				position.top -= overflow;
				position.bottom -= overflow;
			}
		break;

		case "top":
			overflow = PAD - position.top;
			if (overflow > 0) {
				position.top += overflow;
				position.bottom += overflow;
			}
		break;
	}
}

function position(windowNode: HTMLElement, referenceNode: HTMLElement, type: PositionType, offset?: [number, number]) {
	const referenceRect = referenceNode.getBoundingClientRect();
	const avail = [window.innerWidth, window.innerHeight] as [number, number];
	const windowSize = [windowNode.offsetWidth, windowNode.offsetHeight];

	switch (type) {
		case "side": offset = offset || [8, 0]; break;
		case "below": offset = offset || [0, 8]; break;
		default: offset = offset || [0, 0]; break;
	}

	let targetPosition = {
		left: referenceRect.left + offset[0],
		top: referenceRect.top + offset[1],
		right: 0,
		bottom: 0
	}

	switch (type) {
		case "side": {
			let wantedLeft = referenceRect.left - offset[0] - windowSize[0];
			if (wantedLeft >= PAD) {
				targetPosition.left = wantedLeft;
			} else {
				targetPosition.left = referenceRect.right + offset[0];
			}
		} break;

		case "below": {
			let wantedTop = referenceRect.bottom + offset[1];
			if (wantedTop + windowSize[1] <= avail[1]-PAD) {
				targetPosition.top = wantedTop;
			} else {
				targetPosition.top = referenceRect.top - offset[1] - windowSize[1];
			}
		} break;
	}

	targetPosition.right = targetPosition.left + windowSize[0];
	targetPosition.bottom = targetPosition.top + windowSize[1];

	preventOverflow(targetPosition, "right", avail);
	preventOverflow(targetPosition, "left", avail);
	preventOverflow(targetPosition, "bottom", avail);
	preventOverflow(targetPosition, "top", avail);

	windowNode.style.left = `${targetPosition.left}px`;
	windowNode.style.top = `${targetPosition.top}px`;
}


export default class Popup {
	node: HTMLElement;

	constructor(node?: HTMLElement) {
		this.node = node || document.createElement("div");
		this.node.classList.add("popup");
		this.node.addEventListener("mousedown", e => e.stopPropagation());
	}

	open(target: HTMLElement, pos: PositionType, offset?: [number, number]) {
		current?.close();
		current = this;
		document.body.appendChild(this.node);
		this.anchorTo(target, pos, offset);
	}

	close() {
		current = null;
		this.node.parentNode?.removeChild(this.node);
		this.onClose();
	}

	anchorTo(node: HTMLElement, type: PositionType, offset?: [number, number]) {
		position(this.node, node, type, offset);
	}

	onClose() {}
}

export class PopupMenu extends Popup {

	constructor() {
		super(document.createElement("menu"));
	}

	addItem(title: string, icon: string, onClick: Function) {
		let node = document.createElement("li");
		node.append(html.icon(icon), html.text(title));
		node.addEventListener("click", e => {
			this.close();
			onClick();
		});
		this.node.append(node);
		return node;
	}
}

window.addEventListener("keydown", e => e.keyCode == 27 && current?.close());
document.addEventListener("mousedown", e => current?.close());
