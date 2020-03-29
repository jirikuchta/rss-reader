import icons from "ui/icons";


interface Attributes {[key:string]: string};

const SVGNS = "http://www.w3.org/2000/svg";


export function node<K extends keyof HTMLElementTagNameMap>(name: K, attrs?: Attributes, content?: string, parent?: Node): HTMLElementTagNameMap[K] {
	let n = document.createElement(name);
	Object.assign(n, attrs);

	content && text(content, n);
	parent && parent.appendChild(n);
	return n;
}

export function clear(node: Node) {
	while (node.firstChild) { node.removeChild(node.firstChild); }
	return node;
}

export function text(txt:string, parent?: Node) {
	let n = document.createTextNode(txt);
	parent && parent.appendChild(n);
	return n;
}

export function button(attrs: Attributes, content?: string, parent?: Node) {
	let result = node("button", attrs, content, parent);
	if (attrs && attrs.icon) {
		let i = icon(attrs.icon);
		result.insertBefore(i, result.firstChild);
	}
	return result;
}

export function svg(name: string, attrs: Attributes = {}) {
	let node = document.createElementNS(SVGNS, name);
	for (let name in attrs) {
		node.setAttribute(name, attrs[name]);
	}
	return node;
}

export function icon(type:string, title = "", parent?: Node) {
	type Dict = {[key:string]:string};
	let str = (icons as Dict)[type];
	if (!str) {
		console.error("Bad icon type '%s'", type);
		return node("span", {}, "‽");
	}

	let tmp = node("div");
	tmp.innerHTML = str;
	let s = tmp.querySelector("svg");
	if (!s) { throw new Error(`Bad icon source for type '${type}'`); }

	s.classList.add("icon");
	s.classList.add(`icon-${type}`);

	if (title) {
		let t = svg("title");
		text(title, t);
		s.insertAdjacentElement("afterbegin", t);
	}

	parent && parent.appendChild(s);
	return s;
}


export function fragment() {
	return document.createDocumentFragment();
}
