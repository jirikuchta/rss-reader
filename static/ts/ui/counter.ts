import app from "app";

export default class Counter extends HTMLElement {
	connectedCallback() {
		this.sync();
		app.addEventListener("counters-updated", this);
	}

	disconnectedCallback() {
		app.removeEventListener("counters-updated", this);
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
