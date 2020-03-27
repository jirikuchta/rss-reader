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
let selected = null;
async function init() {
    let res = await api("/api/feeds/");
    if (res && res.status == "ok") {
        feeds = res.data;
    }
}
function list() { return feeds; }
function select(feed) {
    selected = feed;
    publish("feed-selected");
}
async function add(uri) {
    let body = new FormData();
    body.append("uri", uri);
    let res = await api("/api/feeds/", { method: "POST", body: body });
    if (!res || res.status != "ok") {
        return false;
    }
    feeds.push(res.data);
    publish("feeds-changed");
    return true;
}
async function remove(feed) {
    let res = await api(`/api/feeds/${feed.id}/`, { method: "DELETE" });
    if (!res || res.status != "ok") {
        return false;
    }
    feeds = feeds.filter(item => item.id != feed.id);
    publish("feeds-changed");
    return true;
}

function node(name, attrs, content, parent) {
    let n = document.createElement(name);
    Object.assign(n, attrs);
    if (attrs && attrs.title) {
        n.setAttribute("aria-label", attrs.title);
    }
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

let node$1;
function init$1() {
    build();
    subscribe("feeds-changed", build);
    return node$1;
}
async function build() {
    node$1 ? clear(node$1) : node$1 = node("div", { "id": "feeds" });
    node$1.appendChild(buildHeader());
    let items = await list();
    items.forEach(feed => node$1.appendChild(buildItem(feed)));
}
function buildHeader() {
    let node$1 = node("header", {}, "Feeds");
    let addBtn = node("button", {}, "➕");
    addBtn.addEventListener("click", e => addItem());
    node$1.appendChild(addBtn);
    return node$1;
}
function buildItem(feed) {
    let node$1 = node("article", {}, feed.title);
    node$1.addEventListener("click", e => select(feed));
    let removeBtn = node("button", {}, "➖");
    removeBtn.addEventListener("click", e => removeItem(feed));
    node$1.appendChild(removeBtn);
    return node$1;
}
async function addItem() {
    let uri = prompt();
    if (!uri) {
        return;
    }
    await add(uri);
}
async function removeItem(feed) {
    await remove(feed);
}

let selected$1 = null;
async function list$1(feed) {
    let res = await api(`/api/feeds/${feed ? feed.id + "/" : ""}entries/`);
    if (!res || res.status != "ok") {
        return false;
    }
    return res.data;
}
function select$1(entry) {
    selected$1 = entry;
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
    let items = await list$1(selected || undefined);
    items && items.forEach(entry => node$2.appendChild(buildItem$1(entry)));
}
function buildItem$1(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    entry.summary && node$1.appendChild(node("p", {}, entry.summary));
    node$1.addEventListener("click", e => select$1(entry));
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
    let entry = selected$1;
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
        this._node.classList.add("with-resizer");
        this._node.appendChild(node$1);
        this._load();
    }
    handleEvent(ev) {
        switch (ev.type) {
            case "mousedown":
                document.addEventListener("mousemove", this);
                document.addEventListener("mouseup", this);
                break;
            case "mouseup":
                document.removeEventListener("mousemove", this);
                document.removeEventListener("mouseup", this);
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
