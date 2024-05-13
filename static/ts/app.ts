import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/subscriptions";
import * as counters from "data/counters";

import Header from "ui/header";
import Feeds from "ui/feeds";
import Articles from "ui/articles";
import Detail from "ui/detail";
import MainButton from "ui/main-button";

import Resizer from "ui/widget/resizer";

export default class App extends HTMLElement {
	readonly header = new Header();
	readonly feeds = new Feeds();
	readonly articles = new Articles();
	readonly detail = new Detail();
	readonly mainButton = new MainButton();

	constructor() {
		super();
		this.addEventListener("click", e => this.toggleNav(false));
	}

	async connectedCallback() {
		settings.init();

		await categories.init();
		await subscriptions.init();
		await articles.init();

		counters.init();

		let nav = document.createElement("nav");
		nav.append(this.header, this.feeds);

		let main = document.createElement("main");
		main.append(this.articles, new Resizer(this.articles, "articlesWidth"), this.detail);

		this.append(nav, new Resizer(nav, "navWidth"), main, this.mainButton);
	}

	toggleNav(toggle?: boolean) {
		this.classList.toggle("nav-open", toggle);
	}

	toggleDetail(toggle?: boolean) {
		this.classList.toggle("detail-open", toggle);
	}

	get navOpen() { return this.classList.contains("nav-open"); }
	get detailOpen() { return this.classList.contains("detail-open"); }
}

customElements.define("rr-app", App);
