import { Subscription, Category } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import * as pubsub from "util/pubsub";

import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";

import App from "app";
import Header from "ui/header";
import NavItem from "ui/nav-item";

export default class Nav extends HTMLElement {
	protected wrap = document.createElement("div");

	get items() {
		return [...this.querySelectorAll("rr-nav-item")] as NavItem[];
	}

	get activeItem() {
		return this.items.find(i => i.active)!;
	}

	get app() {
		return this.closest("rr-app") as App;
	}

	connectedCallback() {
		this.wrap.className = "scroll";
		this.wrap.replaceChildren(...buildItems());

		this.append(new Header(), this.wrap);
		this.items[0].active = true;

		this.addEventListener("click", this);
		this.addEventListener("contextmenu", this);

		pubsub.subscribe("subscriptions-changed", this);
		pubsub.subscribe("categories-changed", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("subscriptions-changed", this);
		pubsub.unsubscribe("categories-changed", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		this.wrap.replaceChildren(...buildItems());
	}

	handleEvent(e: PointerEvent) {
		e.stopPropagation();

		let item = (e.target as HTMLElement).closest("rr-nav-item") as NavItem;
		if (!item) { return; }

		switch(e.type) {
			case "click":
				this.items.forEach(i => i.active = false);
				item.active = true;

				let { app } = this;
				app.feedItems.update();
				app.toggleNav(false);
			break;
			case "contextmenu":
				e.preventDefault();
				showContextMenu(item, e);
			break;
		}
	}
}

customElements.define("rr-nav", Nav);

function buildItems() {
	let items: HTMLElement[] = [
		new NavItem({title: "All articles"}, "all"),
		new NavItem({title: "Starred"}, "starred"),
	];

	if (subscriptions.list().some(s => s.favorite)) {
		items.push(buildTitle("Favorites"), ...subscriptions.list()
			.filter(s => s.favorite)
			.map(s => new NavItem(s, "subscription"))
		);
	}

	items.push(buildTitle("Folders"), ...categories.list().map(c => {
		let node = document.createElement("div");
		let cat = new NavItem(c, "category");
		node.append(cat, ...subscriptions.list()
			.filter(s => s.category_id == c.id)
			.map(s => new NavItem(s, "subscription")
		));
		return node;
	}));

	items.push(buildTitle("Feeds"), ...subscriptions.list()
		.filter(s => !s.category_id)
		.map(s => new NavItem(s, "subscription"))
	);

	return items;
}

function buildTitle(title: string) {
	let node = document.createElement("h3");
	node.textContent = title;
	return node;
}

function showContextMenu(item: NavItem, e: PointerEvent) {
	let menu = new PopupMenu();

	if (item.type == "all") {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
	}

	if (item.type == "category") {
		let data = item.data as Category;
		menu.addItem("Mark as read", "check-all", () => categories.markRead(data.id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(data));
		menu.addItem("Delete category", "trash", () => deleteCategory(data));
	}

	if (item.type == "subscription") {
		let data = item.data as Subscription;
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(data.id));
		menu.addItem(`${data.favorite ? "Remove from" : "Add to"} favorites`, data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(data.id, {favorite: !data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(data));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(data));
	}

	menu.open(item, "below", [
		e.clientX - item.getBoundingClientRect().left + 8,
		e.clientY - item.getBoundingClientRect().bottom + 8
	]);
}

async function deleteCategory(category: Category) {
	if (await confirm(`Delete category ${category.title}? Any nested subscriptions will be moved to uncategorized.`)) {
		categories.remove(category.id);
	}
}

async function deleteSubscription(subscription: Subscription) {
	if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
		subscriptions.remove(subscription.id);
	}
}
