const tempEl = document.createElement("div");
type Value = string | HTML | Value[];
type Value2 = string | Node | Node[] | string[];
type HTML = {
  __html__: string;
};
const sanitize = (value: Value): string => {
  if (value) {
    if (Array.isArray(value)) {
      return value.map(sanitize).join("");
    }
    if (typeof value === "object") {
      return value.__html__;
    }
  }
  tempEl.textContent = value;
  return tempEl.innerHTML;
};

// Mount and unmount lifecycle events?
export function html(handlers?: { [key: string]: (e: Event) => void }) {
  return (parts: TemplateStringsArray, ...values: Value2[]): Node => {
    let slottedHtml = parts
      .map((part, i) => {
        if (i < values.length) {
          const value = values[i];
          if (typeof value === "string") {
            return part + value;
          } else if (Array.isArray(value)) {
            if (value[0] instanceof Node) {
              return part + `<script id="SLOT_${i}"></script>`;
            } else {
              return part + value.join("");
            }
          } else {
            return part + `<script id="SLOT_${i}"></script>`;
          }
        }
        return part;
      })
      .join("")
      .trim();
    const parser = new DOMParser();

    let nodeGetter = () => doc.body.firstChild;
    // Handle parenting requirements of table elements
    if (slottedHtml.startsWith("<tr")) {
      slottedHtml = `<table><tbody>${slottedHtml}</tbody></table>`;
      nodeGetter = () => doc.body.firstChild!.firstChild!.firstChild!;
    } else if (slottedHtml.startsWith("<td")) {
      slottedHtml = `<table><tbody><tr>${slottedHtml}</tr></tbody></table>`;
      nodeGetter = () =>
        doc.body.firstChild!.firstChild!.firstChild!.firstChild!;
    } else if (slottedHtml.startsWith("<th")) {
      slottedHtml = `<table><thead><tr>${slottedHtml}</tr></thead></table>`;
      nodeGetter = () =>
        doc.body.firstChild!.firstChild!.firstChild!.firstChild!;
    } else if (slottedHtml.startsWith("<thead")) {
      slottedHtml = `<table>${slottedHtml}</table>`;
      nodeGetter = () => doc.body.firstChild!.firstChild!;
    } else if (slottedHtml.startsWith("<tbody")) {
      slottedHtml = `<table>${slottedHtml}</table>`;
      nodeGetter = () => doc.body.firstChild!.firstChild!;
    }

    const doc = parser.parseFromString(slottedHtml, "text/html");

    // bind event handlers
    if (handlers != null) {
      const elements = doc.querySelectorAll("[events]");
      for (const el of elements) {
        const events = getEventAttributes(el);
        for (const [event, handler] of events) {
          const handlerFn = handlers[handler];
          if (!handlerFn) {
            console.warn(`No handler for event ${event}`);
            break;
          }
          // eventMap.set(id, new WeakRef(handlerFn));
          // eventHandlerRegistry.register(handlerFn, id););
          el.addEventListener(event, handlerFn);
        }
      }
    }

    // now replace each splot with value
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (
        typeof value === "string" ||
        (Array.isArray(value) && !(value[0] instanceof Node))
      ) {
        continue;
      }
      const node = doc.getElementById(`SLOT_${i}`);
      if (node == null) {
        console.warn(`No node with id SLOT_${i}`);
        continue;
      }
      if (typeof value === "string") {
        node.textContent = value;
      } else if (Array.isArray(value)) {
        node.replaceWith(...value);
      } else if (typeof value === "object") {
        node.replaceWith(value);
      }
    }

    return nodeGetter()!;
  };
}

function getEventAttributes(node: Element) {
  const events = node.getAttribute("events");
  return events?.split(",").map((event) => event.trim().split(":")) ?? [];
}
