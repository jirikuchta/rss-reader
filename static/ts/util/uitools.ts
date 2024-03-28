import * as random from "util/random";

export function labelInput(text: string, input: HTMLInputElement) {
    let label = document.createElement("label");
    label.textContent = text;
    input.required && label.classList.add("required");

    let id = random.id();
    label.setAttribute("for", id);
    input.setAttribute("id", id);

    let frag = document.createDocumentFragment();
    frag.appendChild(label);
    frag.appendChild(input);

    return frag;
}
