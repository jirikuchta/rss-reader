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
let selected_feed_id = null;
async function init() {
    let res = await fetch("/api/feeds/");
    feeds = await res.json();
}
function list() { return feeds; }
function getSelected() {
    if (selected_feed_id == null) {
        return null;
    }
    let feed = feeds.filter(feed => feed.id == selected_feed_id)[0];
    return feed ? feed : null;
}
function select(feed) {
    selected_feed_id = feed.id;
    publish("selected-feed-change");
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

let node$1 = document.querySelector("#feeds");
async function init$1() {
    clear(node$1);
    let items = await list();
    items.forEach(feed => node$1.appendChild(buildItem(feed)));
}
function buildItem(feed) {
    let node$1 = node("article", {}, feed.title);
    node$1.addEventListener("click", e => select(feed));
    return node$1;
}

async function list$1(feed) {
    let res = await fetch(`/api/entries/${feed ? feed.id + "/" : ""}`);
    let entries = await res.json();
    return entries;
}

let node$2 = document.querySelector("#entries");
function init$2() {
    build();
    subscribe("selected-feed-change", build);
}
async function build() {
    clear(node$2);
    let selected_feed = getSelected();
    let items = await list$1(selected_feed || undefined);
    items.forEach(entry => node$2.appendChild(buildItem$1(entry)));
}
function buildItem$1(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    if (entry.summary) {
        node$1.appendChild(node("p", {}, entry.summary));
    }
    return node$1;
}

async function init$3() {
    await init();
    await init$1();
    init$2();
}
init$3();
