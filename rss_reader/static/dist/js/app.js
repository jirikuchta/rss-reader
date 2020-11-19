(() => {
  // src/js/.build/util/api.js
  async function api(method, uri, data = null) {
    let init8 = {method};
    if (data) {
      init8.body = JSON.stringify(data);
      init8.headers = new Headers({"Content-Type": "application/json"});
    }
    let res = await fetch(uri, init8);
    let body = res.status != 204 ? await res.json() : null;
    return {
      ok: res.ok,
      [res.ok ? "data" : "error"]: res.ok ? body : body["error"]
    };
  }

  // src/js/.build/util/pubsub.js
  const storage = Object.create(null);
  function publish(message, publisher, data) {
    let subscribers = storage[message] || [];
    subscribers.forEach((subscriber) => {
      typeof subscriber == "function" ? subscriber(message, publisher, data) : subscriber.handleMessage(message, publisher, data);
    });
  }
  function subscribe(message, subscriber) {
    if (!(message in storage)) {
      storage[message] = [];
    }
    storage[message].push(subscriber);
  }

  // src/js/.build/data/subscriptions.js
  let subscriptions;
  function isSubscription(entity) {
    return entity.feed_url != void 0;
  }
  function init() {
    return sync();
  }
  async function sync() {
    let res = await api("GET", "/api/subscriptions/");
    res.ok && (subscriptions = res.data) && publish("subscriptions-changed");
  }
  function list() {
    return subscriptions;
  }
  async function add(data) {
    let res = await api("POST", "/api/subscriptions/", data);
    if (res.ok) {
      subscriptions.push(res.data);
      publish("subscriptions-changed");
    }
    return res;
  }
  async function edit(id2, data) {
    let res = await api("PATCH", `/api/subscriptions/${id2}/`, data);
    if (res.ok) {
      let i = subscriptions.findIndex((s) => s.id == id2);
      if (i != -1) {
        subscriptions[i] = res.data;
        publish("subscriptions-changed");
      }
    }
    return res;
  }
  async function remove(id2) {
    let res = await api("DELETE", `/api/subscriptions/${id2}/`);
    if (res.ok) {
      let i = subscriptions.findIndex((s) => s.id == id2);
      if (i != -1) {
        subscriptions.splice(i, 1);
        publish("subscriptions-changed");
      }
    }
    return res;
  }
  async function markRead(id2) {
    return await api("PUT", `/api/subscriptions/${id2}/read/`);
  }

  // src/js/.build/data/categories.js
  let categories = [];
  async function init2() {
    let res = await api("GET", "/api/categories/");
    res.ok && (categories = res.data);
  }
  function list2() {
    return categories;
  }
  async function add2(data) {
    let res = await api("POST", "/api/categories/", data);
    if (res.ok) {
      categories.push(res.data);
      publish("categories-changed");
    }
    return res;
  }
  async function edit2(id2, data) {
    let res = await api("PATCH", `/api/categories/${id2}/`, data);
    if (res.ok) {
      let i = categories.findIndex((s) => s.id == id2);
      if (i != -1) {
        categories[i] = res.data;
        publish("categories-changed");
      }
    }
    return res;
  }
  async function remove2(id2) {
    let res = await api("DELETE", `/api/categories/${id2}/`);
    if (res.ok) {
      let i = categories.findIndex((s) => s.id == id2);
      if (i != -1) {
        categories.splice(i, 1);
        sync();
        publish("categories-changed");
      }
    }
    return res;
  }
  async function markRead2(id2) {
    return await api("PUT", `/api/categories/${id2}/read/`);
  }

  // src/js/.build/ui/icons.js
  var icons_default = {
    check: `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/></svg>`,
    "check-all": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M12.354 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/><path d="M6.25 8.043l-.896-.897a.5.5 0 10-.708.708l.897.896.707-.707zm1 2.414l.896.897a.5.5 0 00.708 0l7-7a.5.5 0 00-.708-.708L8.5 10.293l-.543-.543-.707.707z"/></svg>`,
    "chevron-down": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" clip-rule="evenodd"/></svg>`,
    cross: `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.854 4.146a.5.5 0 010 .708l-7 7a.5.5 0 01-.708-.708l7-7a.5.5 0 01.708 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M4.146 4.146a.5.5 0 000 .708l7 7a.5.5 0 00.708-.708l-7-7a.5.5 0 00-.708 0z" clip-rule="evenodd"/></svg>`,
    "dots-horizontal": `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clip-rule="evenodd"/></svg>`,
    pencil: `<svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clip-rule="evenodd"/></svg>`,
    "plus-circle": `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.5 8a.5.5 0 01.5-.5h4a.5.5 0 010 1H8.5V12a.5.5 0 01-1 0V8z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" clip-rule="evenodd"/></svg>`,
    trash: `<svg viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clip-rule="evenodd"/></svg>`
  };

  // src/js/.build/util/html.js
  const SVGNS = "http://www.w3.org/2000/svg";
  function node(name, attrs, content, parent) {
    let n = document.createElement(name);
    Object.assign(n, attrs);
    content && text(content, n);
    parent && parent.appendChild(n);
    return n;
  }
  function clear(node6) {
    while (node6.firstChild) {
      node6.removeChild(node6.firstChild);
    }
    return node6;
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
    let node6 = document.createElementNS(SVGNS, name);
    for (let name2 in attrs) {
      node6.setAttribute(name2, attrs[name2]);
    }
    return node6;
  }
  function icon(type, title = "", parent) {
    let str = icons_default[type];
    if (!str) {
      console.error("Bad icon type '%s'", type);
      return node("span", {}, "\u203D");
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

  // src/js/.build/data/articles.js
  async function list3(entity) {
    let res;
    if (entity) {
      if (isSubscription(entity)) {
        res = await api("GET", `/api/subscriptions/${entity["id"]}/articles/`);
      } else {
        res = await api("GET", `/api/categories/${entity["id"]}/articles/`);
      }
    } else {
      res = await api("GET", `/api/articles/`);
    }
    return res.data;
  }

  // src/js/.build/ui/list.js
  let node2;
  let selectedNavItem;
  function init3() {
    build();
    return node2;
  }
  function setSelectedNavItem(item) {
    selectedNavItem = item;
    build();
  }
  async function build() {
    node2 ? clear(node2) : node2 = node("section", {id: "list"});
    let items = await list3(selectedNavItem);
    items && items.forEach((article) => node2.appendChild(buildItem(article)));
  }
  function buildItem(article) {
    let node6 = node("article");
    node6.appendChild(node("h3", {}, article.title));
    article.summary && node6.appendChild(node("p", {}, article.summary));
    return node6;
  }

  // src/js/.build/util/random.js
  function id() {
    return `i${Math.random().toString(36).substr(2, 9)}`;
  }

  // src/js/.build/ui/widget/subscription-form.js
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
          category_id: (_a = await getCategory(this._category.value)) === null || _a === void 0 ? void 0 : _a.id
        };
        let res;
        if (this._subscription) {
          res = await edit(this._subscription.id, data);
        } else {
          res = await add(data);
        }
        this._validate(res);
        this.node.checkValidity() && this.afterSubmit();
      }
    }
    afterSubmit() {
    }
    _build() {
      var _a;
      this.node = node("form", {id: id()});
      this.node.noValidate = true;
      this.submitBtn = button({type: "submit"}, "Submit");
      this.submitBtn.setAttribute("form", this.node.id);
      this._title = node("input", {type: "text", required: "true"});
      this._url = node("input", {type: "url", required: "true"});
      this._category = node("input", {type: "text"});
      if (this._subscription) {
        this._title.value = this._subscription.title;
        this._url.value = this._subscription.feed_url;
        this._url.disabled = true;
        let catTitle = (_a = list2().find((c) => {
          var _a2;
          return c.id == ((_a2 = this._subscription) === null || _a2 === void 0 ? void 0 : _a2.category_id);
        })) === null || _a === void 0 ? void 0 : _a.title;
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
  function labelInput(text2, input) {
    let label = node("label", {}, text2);
    input.required && label.classList.add("required");
    let id2 = id();
    label.setAttribute("for", id2);
    input.setAttribute("id", id2);
    let frag = fragment();
    frag.appendChild(label);
    frag.appendChild(input);
    return frag;
  }
  function buildCategoryList() {
    let node6 = node("datalist", {id: id()});
    list2().forEach((c) => node("option", {value: c.title}, c.title, node6));
    return node6;
  }
  async function getCategory(title) {
    title = title.trim();
    if (!title) {
      return;
    }
    let category = list2().find((cat) => cat.title.trim().toLowerCase() == title.toLowerCase());
    if (!category) {
      let res = await add2({title});
      res.ok && (category = res.data);
    }
    return category;
  }

  // src/js/.build/ui/widget/category-form.js
  class CategoryForm {
    constructor(category) {
      this._category = category;
      this._build();
      this.node.addEventListener("submit", this);
    }
    async handleEvent(e) {
      if (e.type == "submit") {
        e.preventDefault();
        let res = await edit2(this._category.id, {
          title: this._title.value
        });
        this._validate(res);
        this.node.checkValidity() && this.afterSubmit();
      }
    }
    afterSubmit() {
    }
    _build() {
      this.node = node("form", {id: id()});
      this.node.noValidate = true;
      this.submitBtn = button({type: "submit"}, "Submit");
      this.submitBtn.setAttribute("form", this.node.id);
      this._title = node("input", {type: "text", required: "true", value: this._category.title});
      this.node.appendChild(labelInput2("Title", this._title));
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
  function labelInput2(text2, input) {
    let label = node("label", {}, text2);
    input.required && label.classList.add("required");
    let id2 = id();
    label.setAttribute("for", id2);
    input.setAttribute("id", id2);
    let frag = fragment();
    frag.appendChild(label);
    frag.appendChild(input);
    return frag;
  }

  // src/js/.build/ui/widget/popup.js
  const PAD = 8;
  let current = null;
  function preventOverflow(position2, type, avail) {
    let overflow = 0;
    switch (type) {
      case "left":
        overflow = PAD - position2.left;
        if (overflow > 0) {
          position2.left += overflow;
          position2.right += overflow;
        }
        break;
      case "right":
        overflow = position2.right + PAD - avail[0];
        if (overflow > 0) {
          position2.left -= overflow;
          position2.right -= overflow;
        }
        break;
      case "bottom":
        overflow = position2.bottom + PAD - avail[1];
        if (overflow > 0) {
          position2.top -= overflow;
          position2.bottom -= overflow;
        }
        break;
      case "top":
        overflow = PAD - position2.top;
        if (overflow > 0) {
          position2.top += overflow;
          position2.bottom += overflow;
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
          } else {
            targetPosition.left = referenceRect.right + offset[0];
          }
        }
        break;
      case "below":
        {
          let wantedTop = referenceRect.bottom + offset[1];
          if (wantedTop + windowSize[1] <= avail[1] - PAD) {
            targetPosition.top = wantedTop;
          } else {
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
      this.node = node("div", {className: "popup"});
      this.node.addEventListener("mousedown", (e) => e.stopPropagation());
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
    anchorTo(node6, type, offset) {
      position(this.node, node6, type, offset);
    }
    onClose() {
    }
    addMenuItem(title, icon2, onClick) {
      let node6 = button({icon: icon2}, title, this.node);
      node6.addEventListener("click", (e) => {
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
    addItem(title, icon2, onClick) {
      let node6 = button({icon: icon2}, title, this.node);
      node6.addEventListener("click", (e) => {
        this.close();
        onClick();
      });
      return node6;
    }
  }
  window.addEventListener("keydown", (e) => e.keyCode == 27 && (current === null || current === void 0 ? void 0 : current.close()));
  document.addEventListener("mousedown", (e) => current === null || current === void 0 ? void 0 : current.close());

  // src/js/.build/ui/widget/dialog.js
  let current2 = null;
  class Dialog {
    constructor() {
      this.node = node("div", {id: "dialog"});
    }
    open() {
      current2 === null || current2 === void 0 ? void 0 : current2.close();
      current2 = this;
      document.body.classList.add("with-dialog");
      document.body.appendChild(this.node);
    }
    close() {
      var _a;
      current2 = null;
      document.body.classList.remove("with-dialog");
      (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.node);
      this.onClose();
    }
    onClose() {
    }
    closeButton() {
      let button2 = button({icon: "cross", className: "close"});
      button2.addEventListener("click", (e) => this.close());
      return button2;
    }
  }
  async function confirm(text2, ok, cancel) {
    let dialog2 = new Dialog();
    let header = node("header", {}, "", dialog2.node);
    header.appendChild(dialog2.closeButton());
    node("h3", {}, text2, header);
    let footer = node("footer", {}, "", dialog2.node);
    let btnOk = button({type: "submit"}, ok || "OK", footer);
    let btnCancel = button({type: "button"}, cancel || "Cancel", footer);
    dialog2.open();
    return new Promise((resolve) => {
      dialog2.onClose = () => resolve(false);
      btnOk.addEventListener("click", (e) => {
        resolve(true);
        dialog2.close();
      });
      btnCancel.addEventListener("click", (e) => dialog2.close());
    });
  }
  window.addEventListener("keydown", (e) => e.keyCode == 27 && (current2 === null || current2 === void 0 ? void 0 : current2.close()));

  // src/js/.build/ui/nav.js
  const SELECTED_CSS_CLASS = "is-selected";
  let node3;
  function init4() {
    build2();
    subscribe("subscriptions-changed", build2);
    subscribe("categories-changed", build2);
    return node3;
  }
  async function build2() {
    node3 ? clear(node3) : node3 = node("nav");
    let header = node("header", {}, "", node3);
    node("h3", {}, "Subscriptions", header);
    let btn = button({icon: "plus-circle"}, "", header);
    btn.addEventListener("click", (e) => editSubscription());
    list2().forEach((cat) => node3.appendChild(buildCategory(cat)));
    let uncategorized = node("ul", {}, "", node3);
    list().filter((s) => s.category_id == null).forEach((s) => uncategorized.appendChild(buildItem2(s)));
  }
  function buildCategory(category) {
    let list6 = node("ul");
    list6.appendChild(buildItem2(category));
    list().filter((s) => s.category_id == category.id).forEach((s) => list6.appendChild(buildItem2(s)));
    return list6;
  }
  function buildItem2(entity) {
    let node6 = node("li");
    if (isSubscription(entity)) {
      node6.appendChild(node("span", {className: "title"}, entity.title));
      node6.appendChild(node("span", {className: "count"}, "50"));
    } else {
      node6.classList.add("category");
      let btn2 = button({icon: "chevron-down", className: "plain btn-chevron"}, "", node6);
      btn2.addEventListener("click", (e) => {
        e.stopPropagation();
        node6.classList.toggle("is-collapsed");
      });
      node6.appendChild(node("span", {className: "title"}, entity.title));
      node6.appendChild(node("span", {className: "count"}, "50"));
    }
    node6.addEventListener("click", (e) => selectItem(node6, entity));
    let btn = button({className: "plain btn-dots", icon: "dots-horizontal"}, "", node6);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showItemPopup(entity, btn);
    });
    return node6;
  }
  function selectItem(itemNode, entity) {
    var _a;
    (_a = node3.querySelector(`.${SELECTED_CSS_CLASS}`)) === null || _a === void 0 ? void 0 : _a.classList.remove(SELECTED_CSS_CLASS);
    itemNode.classList.add(SELECTED_CSS_CLASS);
    setSelectedNavItem(entity);
  }
  function showItemPopup(entity, target) {
    let menu = new PopupMenu();
    if (isSubscription(entity)) {
      menu.addItem("Mark as read", "check-all", () => markRead(entity.id));
      menu.addItem("Edit subscription", "pencil", () => editSubscription(entity));
      menu.addItem("Unsubscribe", "trash", () => deleteSubscription(entity));
    } else {
      menu.addItem("Mark as read", "check-all", () => markRead2(entity.id));
      menu.addItem("Edit category", "pencil", () => editCategory(entity));
      menu.addItem("Delete category", "trash", () => deleteCategory(entity));
    }
    menu.open(target, "below");
  }
  function editSubscription(subscription) {
    let dialog2 = new Dialog();
    let subscriptionForm = new SubscriptionForm(subscription);
    subscriptionForm.afterSubmit = () => dialog2.close();
    let header = node("header", {}, `${subscription ? "Edit" : "Add"} subscription`, dialog2.node);
    header.appendChild(dialog2.closeButton());
    dialog2.node.appendChild(subscriptionForm.node);
    let footer = node("footer", {}, "", dialog2.node);
    footer.appendChild(subscriptionForm.submitBtn);
    dialog2.open();
  }
  async function deleteSubscription(subscription) {
    if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
      remove(subscription.id);
    }
  }
  function editCategory(category) {
    let dialog2 = new Dialog();
    let categoryForm = new CategoryForm(category);
    categoryForm.afterSubmit = () => dialog2.close();
    let header = node("header", {}, "Edit category", dialog2.node);
    header.appendChild(dialog2.closeButton());
    dialog2.node.appendChild(categoryForm.node);
    let footer = node("footer", {}, "", dialog2.node);
    footer.appendChild(categoryForm.submitBtn);
    dialog2.open();
  }
  async function deleteCategory(category) {
    if (await confirm(`Delete category ${category.title}? Any nested subscriptions would be `)) {
      remove2(category.id);
    }
  }

  // src/js/.build/ui/detail.js
  let node4;
  function init5() {
    build3();
    return node4;
  }
  async function build3() {
    node4 ? clear(node4) : node4 = node("section", {id: "detail"});
  }

  // src/js/.build/ui/layout.js
  let node5 = document.querySelector("main");
  async function init6() {
    let navNode = init4();
    let listNode = init3();
    node5.appendChild(navNode);
    node5.appendChild(listNode);
    node5.appendChild(init5());
    new Resizer(navNode, "sidebar-width");
    new Resizer(listNode, "articles-width");
  }
  class Resizer {
    constructor(node6, storageId) {
      this._node = node6;
      this._storageId = storageId;
      this._build();
    }
    _build() {
      let node6 = node("div", {className: "resizer"});
      node6.addEventListener("mousedown", this);
      this._node.insertAdjacentElement("afterend", node6);
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
      let widthPerc = widthPx / document.body.offsetWidth * 100;
      this._node.style.flexBasis = `${widthPerc}%`;
    }
    _save() {
      let widthPerc = this._node.offsetWidth / document.body.offsetWidth * 100;
      this._storageId && localStorage.setItem(this._storageId, `${widthPerc}`);
    }
    _load() {
      let widthPerc = this._storageId && localStorage.getItem(this._storageId);
      widthPerc && (this._node.style.flexBasis = `${widthPerc}%`);
    }
  }

  // src/js/.build/app.js
  async function init7() {
    await init2();
    await init();
    init6();
  }
  init7();
})();
