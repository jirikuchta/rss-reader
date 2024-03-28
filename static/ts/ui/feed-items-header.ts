import App from "app";
import Counter from "ui/counter";
import icon from "ui/icon";

export default class FeedItemsHeader extends HTMLElement {
	connectedCallback() {
		let { app } = this;
		let navItem = app.nav.activeItem;

		let title = document.createElement("h4");
		title.append(navItem.icon, navItem.data.title)

		let counter = new Counter();
		counter.getCount = () => navItem.unreadCount;

		this.append(buildMenu(app), title, counter);
	}

	get app() {
		return this.closest("rr-app") as App;
	}
}

function buildMenu(app: App) {
	let node = document.createElement("button");
	node.append(icon("menu"));
	node.addEventListener("click", e => {
		e.stopPropagation();
		app.toggleNav(true);
	});
	return node;
}

customElements.define("rr-feed-items-header", FeedItemsHeader);

