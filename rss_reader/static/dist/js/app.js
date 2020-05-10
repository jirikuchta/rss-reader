var icons = {
    "chevron-down": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" clip-rule="evenodd"/></svg>`,
    "dots-horizontal": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clip-rule="evenodd"/></svg>`,
    "cross": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>`,
    "plus-circle": `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.5 8a.5.5 0 01.5-.5h4a.5.5 0 010 1H8.5V12a.5.5 0 01-1 0V8z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/></svg>`
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
        document.body.classList.add("has-dialog");
        document.body.appendChild(this.node);
    }
    close() {
        var _a;
        current = null;
        document.body.classList.remove("has-dialog");
        (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
        this.onClose();
    }
    onClose() { }
    closeButton() {
        let button$1 = button({ icon: "cross", className: "close" });
        button$1.addEventListener("click", e => this.close());
        return button$1;
    }
}
async function alert(text, description) {
    let dialog = new Dialog();
    dialog.node.classList.add("alert");
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

async function api(uri, method = "GET", data = null) {
    try {
        let init = { method: method };
        if (data) {
            init.body = JSON.stringify(data),
                init.headers = { "Content-Type": "application/json" };
        }
        let res = await fetch(uri, init);
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

let categories = [];
async function init() {
    let res = await api("/api/categories/");
    categories = res;
}
function list() { return categories; }
async function add(title) {
    let res = await api("/api/categories/", "POST", { "title": title });
    categories.push(res);
    publish("categories-changed");
    return res;
}

let subscriptions = [];
async function init$1() {
    let res = await api("/api/subscriptions/");
    subscriptions = res;
}
function list$1() { return subscriptions; }
async function add$1(uri, categoryId) {
    let res = await api("/api/subscriptions/", "POST", {
        "uri": uri,
        "categoryId": categoryId !== null && categoryId !== void 0 ? categoryId : null
    });
    subscriptions.push(res);
    publish("subscriptions-changed");
    return true;
}

const CategoryListId = "subscriptionFormCategoryList";
class SubscriptionForm {
    constructor(subscription) {
        this._subscription = subscription;
        this._inputs = {
            url: buildURLInput(subscription === null || subscription === void 0 ? void 0 : subscription.uri),
            category: buildCategoryInput(subscription === null || subscription === void 0 ? void 0 : subscription.title)
        };
        this.node = this._build();
    }
    _build() {
        let node$1 = node("form");
        node$1.appendChild(this._inputs.url);
        node$1.appendChild(this._inputs.category);
        node$1.appendChild(buildCategoryList());
        return node$1;
    }
    async submit() {
        let category;
        if (this._inputs.category.value) {
            category = await add(this._inputs.category.value);
        }
        add$1(this._inputs.url.value, category === null || category === void 0 ? void 0 : category.id);
    }
}
function buildURLInput(value) {
    return node("input", { placeholder: "Feed URL", value: value || "" });
}
function buildCategoryInput(value) {
    let node$1 = node("input", { value: value || "" });
    node$1.setAttribute("list", CategoryListId);
    return node$1;
}
function buildCategoryList() {
    let node$1 = node("datalist", { id: CategoryListId });
    list().forEach(category => node("option", { value: category.title }, category.title, node$1));
    return node$1;
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
function init$2() {
    build();
    subscribe("subscriptions-changed", build);
    subscribe("categories-changed", build);
    return node$1;
}
async function build() {
    node$1 ? clear(node$1) : node$1 = node("nav");
    let header = node("header", {}, "", node$1);
    node("h3", {}, "Subscriptions", header);
    let btn = button({ icon: "plus-circle" }, "", header);
    btn.addEventListener("click", e => editSubscription());
    list().forEach(cat => node$1.appendChild(buildCategory(cat)));
}
function buildCategory(category) {
    let node$1 = node("ul");
    node$1.appendChild(buildItem(category.title, true));
    list$1()
        .filter(s => s.categoryId == category.id)
        .forEach(s => node$1.appendChild(buildItem(s.title)));
    return node$1;
}
function buildItem(name, isCategory = false) {
    let node$1 = node("li", { tabIndex: "0" });
    if (isCategory) {
        node$1.classList.add("category");
        let btn = button({ icon: "chevron-down", className: "plain btn-chevron" }, "", node$1);
        btn.addEventListener("click", e => node$1.classList.toggle("is-collapsed"));
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
    popup.open(target, "below");
}
function editSubscription() {
    let dialog = new Dialog();
    let subscriptionForm = new SubscriptionForm();
    let header = node("header", {}, "", dialog.node);
    header.appendChild(subscriptionForm.node);
    let footer = node("footer", {}, "", dialog.node);
    let btnOk = button({ type: "submit" }, "Submit", footer);
    let btnCancel = button({ type: "button" }, "Cancel", footer);
    dialog.open();
    return new Promise(resolve => {
        dialog.onClose = () => resolve(false);
        btnOk.addEventListener("click", e => subscriptionForm.submit());
        btnCancel.addEventListener("click", e => dialog.close());
    });
}

async function list$2(subscription) {
    let res = await api(`/api/entries/`);
    return res;
}

let node$2;
function init$3() {
    build$1();
    subscribe("subscription-selected", build$1);
    return node$2;
}
async function build$1() {
    node$2 ? clear(node$2) : node$2 = node("section", { "id": "list" });
    let items = await list$2();
    items && items.forEach(entry => node$2.appendChild(buildItem$1(entry)));
}
function buildItem$1(entry) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, entry.title));
    return node$1;
}

let node$3;
function init$4() {
    build$2();
    return node$3;
}
async function build$2() {
    node$3 ? clear(node$3) : node$3 = node("section", { "id": "detail" });
}

let node$4 = document.querySelector("main");
function init$5() {
    let navNode = init$2();
    let listNode = init$3();
    node$4.appendChild(navNode);
    node$4.appendChild(listNode);
    node$4.appendChild(init$4());
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

async function init$6() {
    await init();
    await init$1();
    init$5();
}
init$6();
