async function api(uri, init) {
    try {
        let res = await fetch(uri, init);
        if (!res.ok) {
            throw Error(`${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    catch (e) {
        alert(e);
    }
}

const storage = Object.create(null);
function publish(message, publisher, data) {
    let subscribers = storage[message] || [];
    subscribers.forEach((subscriber) => {
        typeof (subscriber) == "function"
            ? subscriber(message, publisher, data)
            : subscriber.handleMessage(message, publisher, data);
    });
}
function subscribe(message, subscriber) {
    if (!(message in storage)) {
        storage[message] = [];
    }
    storage[message].push(subscriber);
}

let feeds = [];
async function init() {
    let res = await api("/api/feeds/");
    if (res && res.status == "ok") {
        feeds = res.data;
    }
}

var icons = {
    "chevron-down": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" clip-rule="evenodd"/></svg>`,
    "dots-horizontal": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clip-rule="evenodd"/></svg>`
};

const SVGNS = "http://www.w3.org/2000/svg";
function node(name, attrs, content, parent) {
    let n = document.createElement(name);
    Object.assign(n, attrs);
    content && text(content, n);
    parent && parent.appendChild(n);
    return n;
}
function clear(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
    return node;
}
function text(txt, parent) {
    let n = document.createTextNode(txt);
    parent && parent.appendChild(n);
    return n;
}
function button(attrs, content, parent) {
    let result = node("button", attrs, content, parent);
    if (attrs && attrs.icon) {
        let i = icon(attrs.icon);
        result.insertBefore(i, result.firstChild);
    }
    return result;
}
function svg(name, attrs = {}) {
    let node = document.createElementNS(SVGNS, name);
    for (let name in attrs) {
        node.setAttribute(name, attrs[name]);
    }
    return node;
}
function icon(type, title = "", parent) {
    let str = icons[type];
    if (!str) {
        console.error("Bad icon type '%s'", type);
        return node("span", {}, "‽");
    }
    let tmp = node("div");
    tmp.innerHTML = str;
    let s = tmp.querySelector("svg");
    if (!s) {
        throw new Error(`Bad icon source for type '${type}'`);
    }
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
function fragment() {
    return document.createDocumentFragment();
}

let node$1;
let categories = ["tech", "humor+art"];
let feeds$1 = [
    { "name": "Changelog master feed", "category": "tech" },
    { "name": "CSS-Tricks", "category": "tech" },
    { "name": "David Walsch Blog", "category": "tech" },
    { "name": "DEV Community", "category": "tech" },
    { "name": "Go Make Things", "category": "tech" },
    { "name": "Hacker News", "category": "tech" },
    { "name": "Hacker Noon - Medium", "category": "tech" },
    { "name": "ITNEXT - Medium", "category": "tech" },
    { "name": "Jim Fisher`s blog", "category": "tech" },
    { "name": "MDN recent document changes", "category": "tech" },
    { "name": "ROOT.cz - články", "category": "tech" },
    { "name": "Scotch.io RSS Feed", "category": "tech" },
    { "name": "SitePoint", "category": "tech" },
    { "name": "Zdroják", "category": "tech" },
    { "name": "C-Heads Magazine", "category": "humor+art" },
    { "name": "Explosm.net", "category": "humor+art" },
    { "name": "Hyperbole and a Half", "category": "humor+art" },
    { "name": "OPRÁSKI SČESKÍ HISTORJE", "category": "humor+art" },
    { "name": "Roumenův Rouming", "category": "humor+art" },
    { "name": "this isn`t happiness.", "category": "humor+art" },
];
function init$1() {
    build();
    return node$1;
}
async function build() {
    node$1 ? clear(node$1) : node$1 = node("nav");
    categories.forEach(cat => node$1.appendChild(buildCategory(cat)));
}
function buildCategory(cat) {
    let frag = fragment();
    let catNode = node$1.appendChild(node("div", { className: "nav-item category", tabIndex: "0" }));
    let btn = button({ icon: "chevron-down", className: "plain opener" });
    btn.addEventListener("click", e => catNode.classList.toggle("collapsed"));
    catNode.appendChild(btn);
    catNode.appendChild(node("span", { className: "title" }, cat));
    catNode.appendChild(node("span", { className: "count" }, "50"));
    catNode.appendChild(button({ className: "plain menu-opener", icon: "dots-horizontal" }));
    let feedsNode = node("ul");
    feeds$1.filter(feed => feed.category == cat).forEach(feed => feedsNode.appendChild(buildFeed(feed.name)));
    frag.appendChild(catNode);
    frag.appendChild(feedsNode);
    return frag;
}
function buildFeed(feed) {
    let node$1 = node("li", { className: "nav-item", tabIndex: "0" });
    node$1.appendChild(node("span", { className: "title" }, feed));
    node$1.appendChild(node("span", { className: "count" }, "50"));
    button({ className: "plain menu-opener", icon: "dots-horizontal" }, "", node$1);
    return node$1;
}

let selected = null;
async function list(feed) {
    let res = await api(`/api/feeds/${feed ? feed.id + "/" : ""}entries/`);
    if (!res || res.status != "ok") {
        return false;
    }
    return res.data;
}
function select(entry) {
    selected = entry;
    publish("entry-selected");
}

let node$2;
function init$2() {
    build$1();
    subscribe("feed-selected", build$1);
    return node$2;
}
async function build$1() {
    node$2 ? clear(node$2) : node$2 = node("div", { "id": "entries" });
    let items = await list( undefined);
    items && items.forEach(entry => node$2.appendChild(buildItem(entry)));
}
function buildItem(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    entry.summary && node$1.appendChild(node("p", {}, entry.summary));
    node$1.addEventListener("click", e => select(entry));
    return node$1;
}

let node$3;
function init$3() {
    build$2();
    subscribe("entry-selected", build$2);
    return node$3;
}
async function build$2() {
    node$3 ? clear(node$3) : node$3 = node("div", { "id": "detail" });
    let entry = selected;
    if (!entry) {
        return;
    }
    let header = node("header");
    let title = node("h3");
    title.appendChild(node("a", { href: entry.uri, target: "_blank" }, entry.title));
    header.appendChild(title);
    let body = node("div", { "id": "entry-content" });
    body.innerHTML = entry.content || "";
    node$3.appendChild(header);
    node$3.appendChild(body);
}

let node$4 = document.querySelector("main");
function init$4() {
    let sidebarNode = node("div", { id: "layout-sidebar" });
    let entriesNode = node("div", { id: "layout-entries" });
    let detailNode = node("div", { id: "layout-detail" });
    sidebarNode.appendChild(init$1());
    entriesNode.appendChild(init$2());
    detailNode.appendChild(init$3());
    node$4.appendChild(sidebarNode);
    node$4.appendChild(entriesNode);
    node$4.appendChild(detailNode);
    new Resizer(sidebarNode, "sidebar-width");
    new Resizer(entriesNode, "entries-width");
}
class Resizer {
    constructor(node, storageId) {
        this._node = node;
        this._storageId = storageId;
        this._build();
    }
    _build() {
        let node$1 = node("div", { className: "resizer" });
        node$1.addEventListener("mousedown", this);
        this._node.insertAdjacentElement("afterend", node$1);
        this._load();
    }
    handleEvent(ev) {
        switch (ev.type) {
            case "mousedown":
                document.addEventListener("mousemove", this);
                document.addEventListener("mouseup", this);
                document.body.style.userSelect = "none";
                break;
            case "mouseup":
                document.removeEventListener("mousemove", this);
                document.removeEventListener("mouseup", this);
                document.body.style.userSelect = "";
                this._save();
                break;
            case "mousemove":
                this._resize(ev.clientX);
                break;
        }
    }
    _resize(pos) {
        let widthPx = pos - this._node.offsetLeft;
        let widthPerc = (widthPx / document.body.offsetWidth) * 100;
        this._node.style.flexBasis = `${widthPerc}%`;
    }
    _save() {
        let widthPerc = (this._node.offsetWidth / document.body.offsetWidth) * 100;
        this._storageId && localStorage.setItem(this._storageId, `${widthPerc}`);
    }
    _load() {
        let widthPerc = this._storageId && localStorage.getItem(this._storageId);
        widthPerc && (this._node.style.flexBasis = `${widthPerc}%`);
    }
}

async function init$5() {
    await init();
    init$4();
}
init$5();
