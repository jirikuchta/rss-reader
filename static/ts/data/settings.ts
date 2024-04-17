import { Settings } from "data/types";
import * as pubsub from "util/pubsub";

const DEFAULTS: Settings = {
	navWidth: "20%",
	articlesWidth: "40%",
	collapsedCategories: [],
	unreadOnly: true,
	markAsReadOnScroll: true,
	showImages: true,
	theme: "system",
	detailFontSize: 14
}

export function init() {
	let key: keyof Settings;
	for (key in DEFAULTS) {
		localStorage.getItem(key) === null && setItem(key, DEFAULTS[key]!);
	}
	onThemeChange();
}

export function getItem<K extends keyof Settings>(key: K) {
	let data = localStorage.getItem(key);
	return (JSON.parse(data!) as Settings[K]);
}

export function setItem<K extends keyof Settings>(key: K, value: NonNullable<Settings[K]>) {
	localStorage.setItem(key, JSON.stringify(value));
	key == "theme" && onThemeChange();
	pubsub.publish("settings-changed");
}

export function removeItem<K extends keyof Settings>(key: K) {
	localStorage.removeItem(key);
}

function onThemeChange() {
	let theme = getItem("theme");
	document.documentElement.classList.toggle("light", theme == "light");
	document.documentElement.classList.toggle("dark", theme == "dark");
}
