import * as settings from "data/settings";
import * as html from "util/html";
import SubscriptionForm from "ui/widget/subscription-form";
import { open as openSettings } from "ui/widget/settings";
import { PopupMenu } from "ui/widget/popup";

export default class Header extends HTMLElement {
	connectedCallback() {
		let logo = document.createElement("a");
		logo.href = "/";
		logo.append(html.icon("rss"));

		let add = document.createElement("button");
		add.title = "Add feed";
		add.append(html.icon("plus"));
		add.addEventListener("click", e => SubscriptionForm.open());

		let theme = document.createElement("button");
		theme.className = "theme";
		theme.title = "Set theme";
		theme.append(html.icon("circle-half"), html.icon("sun-fill"), html.icon("moon-fill"));
		theme.addEventListener("click", e => {
			e.stopPropagation();
			showThemeMenu(theme);
		});

		let settings = document.createElement("button");
		settings.title = "Settings";
		settings.append(html.icon("gear-fill"));
		settings.addEventListener("click", e => openSettings());

		this.append(logo, add, theme, settings);
	}
}

customElements.define("rr-header", Header);

function showThemeMenu(node: HTMLElement) {
	let menu = new PopupMenu();
	menu.addItem("OS Default", "circle-half", () => settings.setItem("theme", "system"));
	menu.addItem("Light", "sun-fill", () => settings.setItem("theme", "light"));
	menu.addItem("Dark", "moon-fill", () => settings.setItem("theme", "dark"));
	menu.open(node, "side", [-8, 8]);
}
