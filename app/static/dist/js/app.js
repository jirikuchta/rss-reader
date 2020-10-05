async function api(method, uri, data = null) {
    let init = { method: method };
    if (data) {
        init.body = JSON.stringify(data);
        init.headers = new Headers({ "Content-Type": "application/json" });
    }
    let res = await fetch(uri, init);
    let body = res.status != 204 ? await res.json() : null;
    return {
        ok: res.ok,
        [res.ok ? "data" : "error"]: res.ok ? body : body["error"]
    };
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

let subscriptions;
function isSubscription(entity) {
    return entity.feed_url != undefined;
}
function init() {
    return sync();
}
async function sync() {
    let res = await api("GET", "/api/subscriptions/");
    res.ok && (subscriptions = res.data) && publish("subscriptions-changed");
}
function list() { return subscriptions; }
async function add(data) {
    let res = await api("POST", "/api/subscriptions/", data);
    if (res.ok) {
        subscriptions.push(res.data);
        publish("subscriptions-changed");
    }
    return res;
}
async function edit(id, data) {
    let res = await api("PATCH", `/api/subscriptions/${id}/`, data);
    if (res.ok) {
        let i = subscriptions.findIndex(s => s.id == id);
        if (i != -1) {
            subscriptions[i] = res.data;
            publish("subscriptions-changed");
        }
    }
    return res;
}
async function remove(id) {
    let res = await api("DELETE", `/api/subscriptions/${id}/`);
    if (res.ok) {
        let i = subscriptions.findIndex(s => s.id == id);
        if (i != -1) {
            subscriptions.splice(i, 1);
            publish("subscriptions-changed");
        }
    }
    return res;
}
async function markRead(id) {
    return await api("PUT", `/api/subscriptions/${id}/read/`);
}

let categories = [];
async function init$1() {
    let res = await api("GET", "/api/categories/");
    res.ok && (categories = res.data);
}
function list$1() { return categories; }
async function add$1(data) {
    let res = await api("POST", "/api/categories/", data);
    if (res.ok) {
        categories.push(res.data);
        publish("categories-changed");
    }
    return res;
}
async function edit$1(id, data) {
    let res = await api("PATCH", `/api/categories/${id}/`, data);
    if (res.ok) {
        let i = categories.findIndex(s => s.id == id);
        if (i != -1) {
            categories[i] = res.data;
            publish("categories-changed");
        }
    }
    return res;
}
async function remove$1(id) {
    let res = await api("DELETE", `/api/categories/${id}/`);
    if (res.ok) {
        let i = categories.findIndex(s => s.id == id);
        if (i != -1) {
            categories.splice(i, 1);
            sync();
            publish("categories-changed");
        }
    }
    return res;
}
async function markRead$1(id) {
    return await api("PUT", `/api/categories/${id}/read/`);
}

var icons = {
    "check": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/></svg>`,
    "check-all": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M12.354 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/><path d="M6.25 8.043l-.896-.897a.5.5 0 10-.708.708l.897.896.707-.707zm1 2.414l.896.897a.5.5 0 00.708 0l7-7a.5.5 0 00-.708-.708L8.5 10.293l-.543-.543-.707.707z"/></svg>`,
    "chevron-down": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" clip-rule="evenodd"/></svg>`,
    "cross": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>`,
    "dots-horizontal": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clip-rule="evenodd"/></svg>`,
    "pencil": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clip-rule="evenodd"/></svg>`,
    "plus-circle": `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.5 8a.5.5 0 01.5-.5h4a.5.5 0 010 1H8.5V12a.5.5 0 01-1 0V8z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/></svg>`,
    "trash": `<svg viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clip-rule="evenodd"/></svg>`
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

async function list$2(entity) {
    let res;
    if (entity) {
        if (isSubscription(entity)) {
            res = await api("GET", `/api/subscriptions/${entity['id']}/articles/`);
        }
        else {
            res = await api("GET", `/api/categories/${entity['id']}/articles/`);
        }
    }
    else {
        res = await api("GET", `/api/articles/`);
    }
    return res.data;
}

let node$1;
let selectedNavItem;
function init$2() {
    build();
    return node$1;
}
function setSelectedNavItem(item) {
    selectedNavItem = item;
    build();
}
async function build() {
    node$1 ? clear(node$1) : node$1 = node("section", { "id": "list" });
    let items = await list$2(selectedNavItem);
    items && items.forEach(article => node$1.appendChild(buildItem(article)));
}
function buildItem(article) {
    let node$1 = node("article");
    node$1.appendChild(node("h3", {}, article.title));
    article.summary && node$1.appendChild(node("p", {}, article.summary));
    return node$1;
}

function id() {
    return `i${Math.random().toString(36).substr(2, 9)}`;
}

class SubscriptionForm {
    constructor(subscription) {
        this._subscription = subscription;
        this._build();
        this.node.addEventListener("submit", this);
    }
    async handleEvent(e) {
        var _a;
        if (e.type == "submit") {
            e.preventDefault();
            let data = {
                title: this._title.value,
                feed_url: this._url.value,
                category_id: (_a = (await getCategory(this._category.value))) === null || _a === void 0 ? void 0 : _a.id
            };
            let res;
            if (this._subscription) {
                res = await edit(this._subscription.id, data);
            }
            else {
                res = await add(data);
            }
            this._validate(res);
            this.node.checkValidity() && this.afterSubmit();
        }
    }
    afterSubmit() { }
    _build() {
        var _a;
        this.node = node("form", { id: id() });
        this.node.noValidate = true;
        this.submitBtn = button({ type: "submit" }, "Submit");
        this.submitBtn.setAttribute("form", this.node.id);
        this._title = node("input", { type: "text", required: "true" });
        this._url = node("input", { type: "url", required: "true" });
        this._category = node("input", { type: "text" });
        if (this._subscription) {
            this._title.value = this._subscription.title;
            this._url.value = this._subscription.feed_url;
            this._url.disabled = true;
            let catTitle = (_a = list$1().find(c => { var _a; return c.id == ((_a = this._subscription) === null || _a === void 0 ? void 0 : _a.category_id); })) === null || _a === void 0 ? void 0 : _a.title;
            catTitle && (this._category.value = catTitle);
        }
        this._subscription && this.node.appendChild(labelInput("Title", this._title));
        this.node.appendChild(labelInput("Feed URL", this._url));
        this.node.appendChild(labelInput("Category", this._category));
        let categoryList = buildCategoryList();
        this._category.setAttribute("list", categoryList.id);
        this.node.appendChild(categoryList);
    }
    _validate(res) {
        var _a;
        this._clearValidation();
        switch ((_a = res.error) === null || _a === void 0 ? void 0 : _a.code) {
            case "missing_field":
                let msg = "Please fill out this field.";
                res.error.field == "title" && this._title.setCustomValidity(msg);
                res.error.field == "uri" && this._url.setCustomValidity(msg);
                break;
            case "invalid_field":
                res.error.field == "categoryId" && this._category.setCustomValidity("Category not found.");
                break;
            case "parser_error":
                this._url.setCustomValidity("No valid RSS/Atom feed found.");
                break;
            case "already_exists":
                this._url.setCustomValidity("You are already subscribed to this feed.");
                break;
        }
        this.node.classList.toggle("invalid", !this.node.checkValidity());
        this.node.reportValidity();
    }
    _clearValidation() {
        this._title.setCustomValidity("");
        this._url.setCustomValidity("");
        this._category.setCustomValidity("");
    }
}
function labelInput(text, input) {
    let label = node("label", {}, text);
    input.required && label.classList.add("required");
    let id$1 = id();
    label.setAttribute("for", id$1);
    input.setAttribute("id", id$1);
    let frag = fragment();
    frag.appendChild(label);
    frag.appendChild(input);
    return frag;
}
function buildCategoryList() {
    let node$1 = node("datalist", { id: id() });
    list$1().forEach(c => node("option", { value: c.title }, c.title, node$1));
    return node$1;
}
async function getCategory(title) {
    title = title.trim();
    if (!title) {
        return;
    }
    let category = list$1()
        .find(cat => cat.title.trim().toLowerCase() == title.toLowerCase());
    if (!category) {
        let res = await add$1({ title });
        res.ok && (category = res.data);
    }
    return category;
}

class CategoryForm {
    constructor(category) {
        this._category = category;
        this._build();
        this.node.addEventListener("submit", this);
    }
    async handleEvent(e) {
        if (e.type == "submit") {
            e.preventDefault();
            let res = await edit$1(this._category.id, {
                title: this._title.value
            });
            this._validate(res);
            this.node.checkValidity() && this.afterSubmit();
        }
    }
    afterSubmit() { }
    _build() {
        this.node = node("form", { id: id() });
        this.node.noValidate = true;
        this.submitBtn = button({ type: "submit" }, "Submit");
        this.submitBtn.setAttribute("form", this.node.id);
        this._title = node("input", { type: "text", required: "true", value: this._category.title });
        this.node.appendChild(labelInput$1("Title", this._title));
    }
    _validate(res) {
        var _a;
        this._clearValidation();
        switch ((_a = res.error) === null || _a === void 0 ? void 0 : _a.code) {
            case "missing_field":
                this._title.setCustomValidity("Please fill out this field.");
                break;
            case "already_exists":
                this._title.setCustomValidity(`Title already exists.`);
                break;
        }
        this.node.classList.toggle("invalid", !this.node.checkValidity());
        this.node.reportValidity();
    }
    _clearValidation() {
        this._title.setCustomValidity("");
    }
}
function labelInput$1(text, input) {
    let label = node("label", {}, text);
    input.required && label.classList.add("required");
    let id$1 = id();
    label.setAttribute("for", id$1);
    input.setAttribute("id", id$1);
    let frag = fragment();
    frag.appendChild(label);
    frag.appendChild(input);
    return frag;
}

const PAD = 8;
let current = null;
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
        this.node.addEventListener("mousedown", e => e.stopPropagation());
    }
    open(target, pos, offset) {
        current === null || current === void 0 ? void 0 : current.close();
        current = this;
        document.body.appendChild(this.node);
        this.anchorTo(target, pos, offset);
    }
    close() {
        var _a;
        current = null;
        (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
        this.onClose();
    }
    anchorTo(node, type, offset) {
        position(this.node, node, type, offset);
    }
    onClose() { }
    addMenuItem(title, icon, onClick) {
        let node = button({ icon: icon }, title, this.node);
        node.addEventListener("click", e => {
            this.close();
            onClick();
        });
    }
}
class PopupMenu extends Popup {
    constructor() {
        super();
        this.node.classList.add("popup-menu");
    }
    addItem(title, icon, onClick) {
        let node = button({ icon: icon }, title, this.node);
        node.addEventListener("click", e => {
            this.close();
            onClick();
        });
        return node;
    }
}
window.addEventListener("keydown", e => e.keyCode == 27 && (current === null || current === void 0 ? void 0 : current.close()));
document.addEventListener("mousedown", e => current === null || current === void 0 ? void 0 : current.close());

let current$1 = null;
class Dialog {
    constructor() {
        this.node = node("div", { id: "dialog" });
    }
    open() {
        current$1 === null || current$1 === void 0 ? void 0 : current$1.close();
        current$1 = this;
        document.body.classList.add("with-dialog");
        document.body.appendChild(this.node);
    }
    close() {
        var _a;
        current$1 = null;
        document.body.classList.remove("with-dialog");
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
async function confirm(text, ok, cancel) {
    let dialog = new Dialog();
    let header = node("header", {}, "", dialog.node);
    header.appendChild(dialog.closeButton());
    node("h3", {}, text, header);
    let footer = node("footer", {}, "", dialog.node);
    let btnOk = button({ type: "submit" }, ok || "OK", footer);
    let btnCancel = button({ type: "button" }, cancel || "Cancel", footer);
    dialog.open();
    return new Promise(resolve => {
        dialog.onClose = () => resolve(false);
        btnOk.addEventListener("click", e => {
            resolve(true);
            dialog.close();
        });
        btnCancel.addEventListener("click", e => dialog.close());
    });
}
window.addEventListener("keydown", e => e.keyCode == 27 && (current$1 === null || current$1 === void 0 ? void 0 : current$1.close()));

const SELECTED_CSS_CLASS = "is-selected";
let node$2;
function init$3() {
    build$1();
    // FIXME: may cause two consecutive builds
    subscribe("subscriptions-changed", build$1);
    subscribe("categories-changed", build$1);
    return node$2;
}
async function build$1() {
    node$2 ? clear(node$2) : node$2 = node("nav");
    let header = node("header", {}, "", node$2);
    node("h3", {}, "Subscriptions", header);
    let btn = button({ icon: "plus-circle" }, "", header);
    btn.addEventListener("click", e => editSubscription());
    list$1()
        .forEach(cat => node$2.appendChild(buildCategory(cat)));
    let uncategorized = node("ul", {}, "", node$2);
    list()
        .filter(s => s.category_id == null)
        .forEach(s => uncategorized.appendChild(buildItem$1(s)));
}
function buildCategory(category) {
    let list$1 = node("ul");
    list$1.appendChild(buildItem$1(category));
    list()
        .filter(s => s.category_id == category.id)
        .forEach(s => list$1.appendChild(buildItem$1(s)));
    return list$1;
}
function buildItem$1(entity) {
    let node$1 = node("li");
    if (isSubscription(entity)) {
        node$1.appendChild(node("span", { className: "title" }, entity.title));
        node$1.appendChild(node("span", { className: "count" }, "50"));
    }
    else {
        node$1.classList.add("category");
        let btn = button({ icon: "chevron-down", className: "plain btn-chevron" }, "", node$1);
        btn.addEventListener("click", e => {
            e.stopPropagation();
            node$1.classList.toggle("is-collapsed");
        });
        node$1.appendChild(node("span", { className: "title" }, entity.title));
        node$1.appendChild(node("span", { className: "count" }, "50"));
    }
    node$1.addEventListener("click", e => selectItem(node$1, entity));
    let btn = button({ className: "plain btn-dots", icon: "dots-horizontal" }, "", node$1);
    btn.addEventListener("click", e => {
        e.stopPropagation();
        showItemPopup(entity, btn);
    });
    return node$1;
}
function selectItem(itemNode, entity) {
    var _a;
    (_a = node$2.querySelector(`.${SELECTED_CSS_CLASS}`)) === null || _a === void 0 ? void 0 : _a.classList.remove(SELECTED_CSS_CLASS);
    itemNode.classList.add(SELECTED_CSS_CLASS);
    setSelectedNavItem(entity);
}
function showItemPopup(entity, target) {
    let menu = new PopupMenu();
    if (isSubscription(entity)) {
        menu.addItem("Mark as read", "check-all", () => markRead(entity.id));
        menu.addItem("Edit subscription", "pencil", () => editSubscription(entity));
        menu.addItem("Unsubscribe", "trash", () => deleteSubscription(entity));
    }
    else {
        menu.addItem("Mark as read", "check-all", () => markRead$1(entity.id));
        menu.addItem("Edit category", "pencil", () => editCategory(entity));
        menu.addItem("Delete category", "trash", () => deleteCategory(entity));
    }
    menu.open(target, "below");
}
function editSubscription(subscription) {
    let dialog = new Dialog();
    let subscriptionForm = new SubscriptionForm(subscription);
    subscriptionForm.afterSubmit = () => dialog.close();
    let header = node("header", {}, `${subscription ? "Edit" : "Add"} subscription`, dialog.node);
    header.appendChild(dialog.closeButton());
    dialog.node.appendChild(subscriptionForm.node);
    let footer = node("footer", {}, "", dialog.node);
    footer.appendChild(subscriptionForm.submitBtn);
    dialog.open();
}
async function deleteSubscription(subscription) {
    if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
        remove(subscription.id);
    }
}
function editCategory(category) {
    let dialog = new Dialog();
    let categoryForm = new CategoryForm(category);
    categoryForm.afterSubmit = () => dialog.close();
    let header = node("header", {}, "Edit category", dialog.node);
    header.appendChild(dialog.closeButton());
    dialog.node.appendChild(categoryForm.node);
    let footer = node("footer", {}, "", dialog.node);
    footer.appendChild(categoryForm.submitBtn);
    dialog.open();
}
async function deleteCategory(category) {
    if (await confirm(`Delete category ${category.title}? Any nested subscriptions would be `)) {
        remove$1(category.id);
    }
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
async function init$5() {
    let navNode = init$3();
    let listNode = init$2();
    node$4.appendChild(navNode);
    node$4.appendChild(listNode);
    node$4.appendChild(init$4());
    new Resizer(navNode, "sidebar-width");
    new Resizer(listNode, "articles-width");
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
    await init$1();
    await init();
    init$5();
}
init$6();