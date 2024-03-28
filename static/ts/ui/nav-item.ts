import { Category, Subscription } from "data/types";
import * as settings from "data/settings";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";

import * as html from "util/html";

import Counter from "ui/counter";
import FeedIcon from "ui/widget/feed-icon";

type ItemType = "all" | "starred" | "category" | "subscription";

interface HasTitle {
	title: string;
}

export default class NavItem extends HTMLElement {

	constructor(readonly data: HasTitle, readonly type: ItemType) { super(); }

	connectedCallback() {
		this.setAttribute("type", this.type);

		let title = document.createElement("span");
		title.className = "title";
		title.textContent = this.data.title;

		let counter = new Counter();
		counter.getCount = () => this.unreadCount;

		let icon = this.type == "category" ? buildCategoryOpener(this) : this.icon;
		this.append(icon, title, counter);
	}

	get active() {
		return this.classList.contains("is-active");
	}

	set active(active: boolean) {
		this.classList.toggle("is-active", active);
	}

	get itemId() {
		switch(this.type) {
			case "all": return -1; break;
			case "starred": return -1; break;
			case "subscription": return (this.data as Subscription).id; break;
			case "category": return (this.data as Category).id; break;
		}
	}

	get icon() {
		switch(this.type) {
			case "all": return html.icon("stack"); break;
			case "starred": return html.icon("bookmark-fill"); break;
			case "subscription": return new FeedIcon(this.data as Subscription); break;
			case "category": return html.icon("folder-fill"); break;
		}
	}

	get unreadCount() {
		switch(this.type) {
			case "all": return counters.sum(); break;
			case "starred": return 0; break;
			case "subscription": return counters.get(this.itemId) || 0; break;
			case "category": return subscriptions.list()
				.filter(s => s.category_id == this.itemId)
				.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
			break;
		}
	}
}

customElements.define("rr-nav-item", NavItem);

function buildCategoryOpener(item: NavItem) {
	let node = document.createElement("button");
	node.className = "plain btn-chevron";
	node.append(html.icon("chevron-down"));
	node.addEventListener("click", e => {
		e.stopPropagation();
		toggleCategory(item);
	});

	if (settings.getItem("collapsedCategories").includes(item.itemId)) {
		toggleCategory(item, true);
	}

	return node;
}

function toggleCategory(item: NavItem, collapsed?: boolean) {
	item.classList.toggle("collapsed", collapsed);
	let storageData = settings.getItem("collapsedCategories").filter(id => id != item.itemId);
	if (item.classList.contains("collapsed")) { storageData.push(item.itemId); }
	settings.setItem("collapsedCategories", storageData);
}
