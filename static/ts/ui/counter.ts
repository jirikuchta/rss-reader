import * as pubsub from "util/pubsub";

export default class Counter extends HTMLElement {
	connectedCallback() {
		this.sync();
		pubsub.subscribe("counters-updated", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("counters-updated", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		message == "counters-updated" && this.sync();
	}

	getCount(): Number { return 0; }

	protected sync() {
		let count = this.getCount();
		this.textContent = count ? String(count) : "";
	}
}

customElements.define("rr-counter", Counter);
