interface Attributes {[key:string]: string};

export function node<K extends keyof HTMLElementTagNameMap>(name: K, attrs?: Attributes, content?: string, parent?: Node): HTMLElementTagNameMap[K] {
	let n = document.createElement(name);
	Object.assign(n, attrs);

	if (attrs && attrs.title) { n.setAttribute("aria-label", attrs.title); }

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

export function fragment() {
	return document.createDocumentFragment();
}
