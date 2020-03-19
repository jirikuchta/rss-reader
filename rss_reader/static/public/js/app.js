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
    let res = await fetch("/api/feeds/");
    feeds = await res.json();
}
function list() { return feeds; }
function select(feed) {
    selected = feed;
    publish("feed-selected");
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

let selected$1 = null;
async function list$1(feed) {
    let res = await fetch(`/api/entries/${feed ? feed.id + "/" : ""}`);
    let entries = await res.json();
    return entries;
}
function select$1(entry) {
    selected$1 = entry;
    publish("entry-selected");
}

let node$2 = document.querySelector("#entries");
function init$2() {
    build();
    subscribe("feed-selected", build);
}
async function build() {
    clear(node$2);
    let items = await list$1(selected || undefined);
    items.forEach(entry => node$2.appendChild(buildItem$1(entry)));
}
function buildItem$1(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    entry.summary && node$1.appendChild(node("p", {}, entry.summary));
    node$1.addEventListener("click", e => select$1(entry));
    return node$1;
}

let node$3 = document.querySelector("#detail");
function init$3() {
    build$1();
    subscribe("entry-selected", build$1);
}
async function build$1() {
    clear(node$3);
    selected$1 && (node$3.innerHTML = selected$1.content || "");
}

async function init$4() {
    await init();
    await init$1();
    init$2();
    init$3();
}
init$4();
