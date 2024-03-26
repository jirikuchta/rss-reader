import * as navigation from "ui/nav";
import * as html from "util/html";
import * as pubsub from "util/pubsub";

export default class FeedItemsHeader extends HTMLElement {
	connectedCallback() {
		let navItem = navigation.selected;

		let title = document.createElement("h4");
		title.append(navItem.icon, navItem.data.title)

		let counter = document.createElement("span");
		counter.className = "counter";

		this.append(buildMenu(), title, counter);
		this.syncCounter();

		pubsub.subscribe("counters-updated", this);
	}

	set shadow(toggle: boolean) {
		this.classList.toggle("has-shadow", toggle);
	}

	disconnectCallback() {
		pubsub.unsubscribe("counters-updated", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		message == "counters-updated" && this.syncCounter();
	}

	protected syncCounter() {
		let count = String(navigation.selected.unreadCount || "");
		let counter = this.querySelector(".counter") as HTMLElement;
		counter.textContent = count;
	}
}

function buildMenu() {
	let node = document.createElement("button");
	node.append(html.icon("menu"));
	node.addEventListener("click", e => {
		e.stopPropagation();
		navigation.toggleOpen(true);
	});
	return node;
}

customElements.define("rr-feed-items-header", FeedItemsHeader);

