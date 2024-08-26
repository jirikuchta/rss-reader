import app from "app";

export default class Counter extends HTMLElement {
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

	getCount(): Number { return 0; }

	protected sync() {
		let count = this.getCount();
		this.textContent = count ? String(count) : "";
	}
}

customElements.define("rr-counter", Counter);
