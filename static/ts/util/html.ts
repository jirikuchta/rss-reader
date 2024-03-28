interface Attributes {[key:string]: string};

export function node<K extends keyof HTMLElementTagNameMap>(name: K, attrs?: Attributes, content?: string, parent?: Node): HTMLElementTagNameMap[K] {
	let n = document.createElement(name);
	Object.assign(n, attrs);
	if (content) { n.textContent = content; }
	parent && parent.appendChild(n);
	return n;
}
