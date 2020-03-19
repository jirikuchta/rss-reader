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
    let res = await fetch("/feeds");
    let data = await res.json();
    feeds = data.feeds;
}
function list() { return feeds; }
function getSelected() {
    if (!selected) {
        return null;
    }
    return feeds.filter(f => f.link == selected)[0] || null;
}
function select(feed) {
    selected = feed.link;
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
function init$1() {
    clear(node$1);
    list().forEach(feed => node$1.appendChild(buildItem(feed)));
}
function buildItem(feed) {
    let node$1 = node("article", {}, feed.title);
    node$1.addEventListener("click", e => select(feed));
    return node$1;
}

function list$1() {
    let selected_feed = getSelected();
    return selected_feed ? selected_feed.items : [];
}

let node$2 = document.querySelector("#items");
function init$2() {
    build();
    subscribe("selected-feed-change", build);
}
function build() {
    clear(node$2);
    list$1().forEach(item => node$2.appendChild(buildItem$1(item)));
}
function buildItem$1(item) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, item.title));
    if (item.summary) {
        node$1.appendChild(node("p", {}, item.summary));
    }
    return node$1;
}

async function init$3() {
    await init();
    init$1();
    init$2();
}
init$3();
