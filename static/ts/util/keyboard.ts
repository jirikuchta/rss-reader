import app from "app";
import { current as popup } from "ui/widget/popup";

window.addEventListener("keydown", e => {
	if (["Alt", "Control", "Shift", "OS", "Meta"].some(key => e.getModifierState(key))) { return; }
	if (e.isComposing) { return; }

	switch(e.code) {
		case "ArrowRight":
			app.articles.next();
		break;
		case "ArrowLeft":
			app.articles.prev();
		break;
		case "Escape":
			if (popup) {
				popup.close();
			} else {
				app.toggleNav(false);
				app.toggleDetail(false);
			}
		break;
	}
});