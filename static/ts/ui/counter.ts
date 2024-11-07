import app from "app";

export default class Counter extends HTMLElement {
	constructor(protected getCount: () => number) {
		super();
	}

	connectedCallback() {
		this.sync();
		app.addEventListener("counters-changed", this);
	}

	disconnectedCallback() {
		app.removeEventListener("counters-changed", this);
	}

	handleEvent() {
		this.sync();
	}

	protected sync() {
		let count = this.getCount();
		this.textContent = count ? String(count) : "";
	}
}

customElements.define("rr-counter", Counter);
