import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/subscriptions";
import * as counters from "data/counters";

import FeedItems from "ui/feed-items";
import * as detail from "ui/detail";
import Nav from "ui/nav";

import Resizer from "ui/widget/resizer";

export default class App extends HTMLElement {
	readonly nav = new Nav();
	readonly feedItems = new FeedItems();

	async connectedCallback() {
		let { nav, feedItems } = this;

		settings.init();

		await categories.init();
		await subscriptions.init();
		await articles.init();

		let main = document.createElement("main");

		detail.init();
		counters.init();

		main.append(feedItems, detail.node);
		this.append(nav, main);

		nav.insertAdjacentElement("afterend", new Resizer(nav, "navWidth"));
		feedItems.insertAdjacentElement("afterend", new Resizer(feedItems, "articlesWidth"));

		this.addEventListener("click", e => this.toggleNav(false));
	}

	toggleNav(toggle?: boolean) {
		this.classList.toggle("nav-open", toggle);
	}
}

customElements.define("rr-app", App);
