import * as settings from "data/settings";
import Icon from "ui/icon";
import { openDialog as openSubscriptionForm } from "ui/widget/subscription-form";
import { open as openSettings } from "ui/widget/settings";
import { PopupMenu } from "ui/widget/popup";

export default class Header extends HTMLElement {
	connectedCallback() {
		let logo = document.createElement("a");
		logo.href = "/";
		logo.append(new Icon("rss"));

		let add = document.createElement("button");
		add.title = "Add feed";
		add.append(new Icon("plus"));
		add.addEventListener("click", e => openSubscriptionForm());

		let theme = document.createElement("button");
		theme.className = "theme";
		theme.title = "Set theme";
		theme.append(new Icon("circle-half"), new Icon("sun-fill"), new Icon("moon-fill"));
		theme.addEventListener("click", e => {
			e.stopPropagation();
			showThemeMenu(theme);
		});

		let settings = document.createElement("button");
		settings.title = "Settings";
		settings.append(new Icon("gear-fill"));
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
