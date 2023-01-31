import * as html from "util/html";
import * as random from "util/random";

export function labelInput(text: string, input: HTMLInputElement) {
    let label = html.node("label", {}, text);
    input.required && label.classList.add("required");

    let id = random.id();
    label.setAttribute("for", id);
    input.setAttribute("id", id);

    let frag = html.fragment();
    frag.appendChild(label);
    frag.appendChild(input);

    return frag;
}

export function externalLink(node: HTMLAnchorElement) {
    node.target = "_blank";
    node.rel = "noopener noreferrer";
    return node;
}
