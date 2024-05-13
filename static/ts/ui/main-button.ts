import App from "app";
import Icon from "ui/icon";

export default class MainButton extends HTMLElement {

	constructor() {
		super();
		this.addEventListener("click", this);
	}

	get app() {
		return this.closest("rr-app") as App;
	}

	handleEvent(e: Event) {
		e.stopPropagation();

		let { app } = this;

		if (app.detailOpen) {
			app.toggleDetail(false);
			return;
		}

		app.toggleNav(!app.navOpen);
	}

	connectedCallback() {
		this.append(
			new Icon("cross"),
			new Icon("menu")
		);
	}
}

customElements.define("rr-main-button", MainButton);