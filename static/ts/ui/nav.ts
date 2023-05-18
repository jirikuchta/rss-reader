import { Category, Subscription } from "data/types";
import * as settings from "data/settings";
import * as articles from "data/articles";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import subscriptionIcon from "ui/widget/subscription-icon";
import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { open as openSettings } from "ui/widget/settings";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";

const SELECTED_CSS_CLASS = "is-selected";

export const node = document.querySelector("main > nav") as HTMLElement;
export let selected: Item;

let items: Item[] = [];
const header = node.querySelector("header") as HTMLElement;
const scroll = node.querySelector(".scroll") as HTMLElement;

interface HasTitle {
	title: string;}

export function init() {
	buildHeader();
	build();

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", build);
	pubsub.subscribe("categories-changed", build);

	pubsub.subscribe("counters-updated", syncCounters);
}

export function toggle(force?: boolean) {
	node.classList.toggle("is-open", force);
}

async function build() {
	html.clear(scroll);
	items = [];

	let list: HTMLElement;

	list = html.node("ul", {}, "", scroll);

	let allItem = new AllItem();
	list.appendChild(allItem.node);

	list.appendChild((new ReadLaterItem()).node);

	if (subscriptions.list().some(s => s.favorite)) {
		buildFavorites();
	}

	html.node("h3", {}, "Folders", scroll);
	categories.list().forEach(c => buildCategory(c));

	html.node("h3", {}, "Feeds", scroll);
	list = html.node("ul", {}, "", scroll);
	subscriptions.list()
		.filter(s => !s.category_id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));

	syncCounters();
	select(allItem);
}

function buildHeader() {
	let buttons = html.node("div", {className: "buttons"}, "", header);

	let addBtn = html.button({icon: "plus"}, "", buttons);
	addBtn.addEventListener("click", e => SubscriptionForm.open());

	let themeBtn = html.button({className:"theme"}, "", buttons);
	themeBtn.append(html.icon("circle-half"), html.icon("sun-fill"), html.icon("moon-fill"));
	themeBtn.addEventListener("click", e => showThemeMenu(themeBtn, e));

	let settingsBtn = html.button({icon: "gear-fill"}, "", buttons);
	settingsBtn.addEventListener("click", e => openSettings());
}

function buildFavorites() {
	html.node("h3", {}, "Favorites", scroll);
	subscriptions.list().filter(s => s.favorite).forEach(s => {
		scroll.appendChild(new SubscriptionItem(s).node);
	});
}

function buildCategory(category: Category) {
	let list = html.node("ul", {}, "", scroll);
	let item = new CategoryItem(category);

	list.appendChild(item.node);
	items.push(item);

	subscriptions.list()
		.filter(s => s.category_id == category.id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));
}

function select(item: Item) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	item.node.classList.add(SELECTED_CSS_CLASS);
	selected = item;
	articles.clear();
}

function syncCounters() {
	items.forEach(i => i.syncCounter());
}

class Item {
	protected _data: HasTitle;
	protected _node!: HTMLLIElement;
	protected counter!: HTMLElement;

	constructor(data: HasTitle) {
		this._data = data;

		this.build();
		this.syncCounter();

		items.push(this);
	}

	get data() {
		return this._data;
	}

	get node() {
		return this._node;
	}

	count() {

	}

	syncCounter() {};

	handleEvent(e: MouseEvent) {
		e.preventDefault();
		switch (e.type) {
			case "contextmenu": showContextMenu(this, e); break;
			case "click": select(this); break;
		}
	}

	protected build() {
		let node = html.node("li");
		let counter = html.node("span", {className: "count"});

		node.appendChild(html.node("span", {className: "title"}, this.data.title));
		node.appendChild(counter)

		node.addEventListener("click", this);
		node.addEventListener("contextmenu", this);

		this._node = node;
		this.counter = counter;
	}
}

export class AllItem extends Item {

	constructor() { super({title: "All articles"}); }

	syncCounter() {
		html.clear(this.counter);
		let count = counters.sum();
		count && this.counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", html.icon("stack"));
	}
}

export class ReadLaterItem extends Item {

	constructor() { super({title: "Read later"}); }

	syncCounter() {}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", html.icon("bookmark-fill"));
	}
}

export class CategoryItem extends Item {
	protected opener!: HTMLButtonElement;

	get data() {
		return this._data as Category;
	}

	syncCounter() {
		html.clear(this.counter);
		let count = subscriptions.list()
			.filter(s => s.category_id == this.data.id)
			.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
		count && this.counter.appendChild(html.text(`${count}`));
	}

	handleEvent(e: MouseEvent) {
		if (e.type == "click" && e.currentTarget == this.opener) {
			e.stopPropagation();
			return this.toggle();
		}
		super.handleEvent(e);
	}

	protected build() {
		super.build();

		this.opener = html.button({icon: "chevron-down", className: "plain btn-chevron"});
		this.opener.addEventListener("click", this);

		this.node.classList.add("category");
		this.node.insertAdjacentElement("afterbegin", this.opener);

		if (settings.getItem("collapsedCategories").includes(this.data.id)) {
			this.toggle(true);
		}
	}

	protected toggle(force?: boolean) {
		this.node.classList.toggle("is-collapsed", force);

		let data = settings.getItem("collapsedCategories");
		if (this.node.classList.contains("is-collapsed")) {
			data.push(this.data.id);
		} else {
			data = data.filter(id => id != this.data.id);
		}
		settings.setItem("collapsedCategories", data);
	}
}

export class SubscriptionItem extends Item {

	get data() {
		return this._data as Subscription;
	}

	syncCounter() {
		html.clear(this.counter);
		let count = counters.get(this.data.id);
		count && this.counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", subscriptionIcon(this.data));
	}
}

function showContextMenu(item: Item, e: MouseEvent) {
	e.preventDefault();

	let menu = new PopupMenu();

	if (item instanceof AllItem) {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
	}

	if (item instanceof CategoryItem) {
		menu.addItem("Mark as read", "check-all", () => categories.markRead(item.data.id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(item.data));
		menu.addItem("Delete category", "trash", () => deleteCategory(item.data));
	}

	if (item instanceof SubscriptionItem) {
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(item.data.id));
		menu.addItem(`${item.data.favorite ? "Remove from" : "Add to"} favorites`, item.data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(item.data.id, {favorite: !item.data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(item.data));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(item.data));
	}

	menu.open(item.node, "below", [
		e.clientX - item.node.getBoundingClientRect().left + 8,
		e.clientY - item.node.getBoundingClientRect().bottom + 8
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

function showThemeMenu(node: HTMLElement, e: MouseEvent) {
	let menu = new PopupMenu();
	menu.addItem("OS Default", "circle-half", () => settings.setItem("theme", "system"));
	menu.addItem("Light", "sun-fill", () => settings.setItem("theme", "light"));
	menu.addItem("Dark", "moon-fill", () => settings.setItem("theme", "dark"));
	menu.open(node, "side", [-8, 8]);
}
