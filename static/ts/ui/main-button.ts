import app from "app";
import icon from "ui/icon";

export default class MainButton extends HTMLElement {

	constructor() {
		super();
		this.addEventListener("click", this);
	}

	handleEvent(e: Event) {
		e.stopPropagation();

		if (app.detailOpen) {
			app.toggleDetail(false);
			return;
		}

		app.toggleNav(!app.navOpen);
	}

	connectedCallback() {
		this.append(
			icon("cross"),
			icon("menu")
		);
	}
}

customElements.define("rr-main-button", MainButton);
