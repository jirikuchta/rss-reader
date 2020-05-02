var icons = {
    "chevron-down": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" clip-rule="evenodd"/></svg>`,
    "dots-horizontal": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clip-rule="evenodd"/></svg>`,
    "cross": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>`
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

let current = null;
class Dialog {
    constructor() {
        this.node = node("div", { className: "dialog" });
    }
    open() {
        current === null || current === void 0 ? void 0 : current.close();
        current = this;
        document.body.classList.add("with-dialog");
        document.body.appendChild(this.node);
    }
    close() {
        var _a;
        current = null;
        document.body.classList.remove("with-dialog");
        (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
        this.onClose();
    }
    onClose() { }
    closeButton() {
        let button$1 = button({ icon: "cross" });
        button$1.addEventListener("click", e => this.close());
        return button$1;
    }
}
async function alert(text, description) {
    let dialog = new Dialog();
    let header = node("header", {}, "", dialog.node);
    header.appendChild(dialog.closeButton());
    node("h3", {}, text, header);
    description && node("p", {}, description, header);
    let footer = node("footer", {}, "", dialog.node);
    let button$1 = button({ type: "submit" }, "OK", footer);
    button$1.addEventListener("click", _ => dialog.close());
    dialog.open();
    return new Promise(resolve => dialog.onClose = resolve);
}
window.addEventListener("keydown", e => e.keyCode == 27 && (current === null || current === void 0 ? void 0 : current.close()));

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

let subscriptions = [];
async function init() {
    let res = await api("/api/subscriptions/");
    if (res && res.status == "ok") {
        subscriptions = res.data;
    }
}

const PAD = 8;
let current$1 = null;
function preventOverflow(position, type, avail) {
    let overflow = 0;
    switch (type) {
        case "left":
            overflow = PAD - position.left;
            if (overflow > 0) {
                position.left += overflow;
                position.right += overflow;
            }
            break;
        case "right":
            overflow = position.right + PAD - avail[0];
            if (overflow > 0) {
                position.left -= overflow;
                position.right -= overflow;
            }
            break;
        case "bottom":
            overflow = position.bottom + PAD - avail[1];
            if (overflow > 0) {
                position.top -= overflow;
                position.bottom -= overflow;
            }
            break;
        case "top":
            overflow = PAD - position.top;
            if (overflow > 0) {
                position.top += overflow;
                position.bottom += overflow;
            }
            break;
    }
}
function position(windowNode, referenceNode, type, offset) {
    const referenceRect = referenceNode.getBoundingClientRect();
    const avail = [window.innerWidth, window.innerHeight];
    const windowSize = [windowNode.offsetWidth, windowNode.offsetHeight];
    switch (type) {
        case "side":
            offset = offset || [8, 0];
            break;
        case "below":
            offset = offset || [0, 8];
            break;
        default:
            offset = offset || [0, 0];
            break;
    }
    let targetPosition = {
        left: referenceRect.left + offset[0],
        top: referenceRect.top + offset[1],
        right: 0,
        bottom: 0
    };
    switch (type) {
        case "side":
            {
                let wantedLeft = referenceRect.left - offset[0] - windowSize[0];
                if (wantedLeft >= PAD) {
                    targetPosition.left = wantedLeft;
                }
                else {
                    targetPosition.left = referenceRect.right + offset[0];
                }
            }
            break;
        case "below":
            {
                let wantedTop = referenceRect.bottom + offset[1];
                if (wantedTop + windowSize[1] <= avail[1] - PAD) {
                    targetPosition.top = wantedTop;
                }
                else {
                    targetPosition.top = referenceRect.top - offset[1] - windowSize[1];
                }
            }
            break;
    }
    targetPosition.right = targetPosition.left + windowSize[0];
    targetPosition.bottom = targetPosition.top + windowSize[1];
    preventOverflow(targetPosition, "right", avail);
    preventOverflow(targetPosition, "left", avail);
    preventOverflow(targetPosition, "bottom", avail);
    preventOverflow(targetPosition, "top", avail);
    windowNode.style.left = `${targetPosition.left}px`;
    windowNode.style.top = `${targetPosition.top}px`;
}
class Popup {
    constructor() {
        this.node = node("div", { className: "popup" });
    }
    open(target, pos, offset) {
        current$1 === null || current$1 === void 0 ? void 0 : current$1.close();
        current$1 = this;
        document.body.appendChild(this.node);
        this.anchorTo(target, pos, offset);
    }
    close() {
        var _a;
        current$1 = null;
        (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
        this.onClose();
    }
    anchorTo(node, type, offset) {
        position(this.node, node, type, offset);
    }
    onClose() { }
}
window.addEventListener("keydown", e => e.keyCode == 27 && (current$1 === null || current$1 === void 0 ? void 0 : current$1.close()));
document.addEventListener("mousedown", e => current$1 === null || current$1 === void 0 ? void 0 : current$1.close(), true);

let node$1;
let categories = ["tech", "humor+art"];
let feeds = [
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
    let node$1 = node("ul");
    node$1.appendChild(buildItem(cat, true));
    feeds.filter(feed => feed.category == cat).forEach(feed => node$1.appendChild(buildItem(feed.name)));
    return node$1;
}
function buildItem(name, isCategory = false) {
    let node$1 = node("li", { tabIndex: "0" });
    if (isCategory) {
        node$1.classList.add("category");
        let btn = button({ icon: "chevron-down", className: "plain btn-chevron" }, "", node$1);
        btn.addEventListener("click", e => node$1.classList.toggle("collapsed"));
    }
    node$1.appendChild(node("span", { className: "title" }, name));
    node$1.appendChild(node("span", { className: "count" }, "50"));
    let btn = button({ className: "plain btn-dots", icon: "dots-horizontal" }, "", node$1);
    btn.addEventListener("click", e => showItemPopup(btn));
    return node$1;
}
function showItemPopup(target) {
    let popup = new Popup();
    node("div", {}, "ahfsadfa sdf as fas fsa fas foj", popup.node);
    popup.open(target, "side");
}

async function list(subscription) {
    let res = await api(`/api/subscriptions/${subscription ? subscription.id + "/" : ""}entries/`);
    if (!res || res.status != "ok") {
        return false;
    }
    return res.data;
}
function select(entry) {
    publish("entry-selected");
}

let node$2;
function init$2() {
    build$1();
    subscribe("subscription-selected", build$1);
    return node$2;
}
async function build$1() {
    node$2 ? clear(node$2) : node$2 = node("section", { "id": "list" });
    let items = await list( undefined);
    items && items.forEach(entry => node$2.appendChild(buildItem$1(entry)));
}
function buildItem$1(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    entry.summary && node$1.appendChild(node("p", {}, entry.summary));
    node$1.addEventListener("click", e => select());
    return node$1;
}

let node$3;
function init$3() {
    build$2();
    return node$3;
}
async function build$2() {
    node$3 ? clear(node$3) : node$3 = node("section", { "id": "detail" });
}

let node$4 = document.querySelector("main");
function init$4() {
    let navNode = init$1();
    let listNode = init$2();
    node$4.appendChild(navNode);
    node$4.appendChild(listNode);
    node$4.appendChild(init$3());
    new Resizer(navNode, "sidebar-width");
    new Resizer(listNode, "entries-width");
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
