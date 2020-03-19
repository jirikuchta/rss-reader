;
export function node(name, attrs, content, parent) {
    let n = document.createElement(name);
    Object.assign(n, attrs);
    if (attrs && attrs.title) {
        n.setAttribute("aria-label", attrs.title);
    }
    content && text(content, n);
    parent && parent.appendChild(n);
    return n;
}
export function clear(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
    return node;
}
export function text(txt, parent) {
    let n = document.createTextNode(txt);
    parent && parent.appendChild(n);
    return n;
}
export function fragment() {
    return document.createDocumentFragment();
}
