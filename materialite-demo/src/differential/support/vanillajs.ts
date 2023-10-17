const tempEl = document.createElement("div");
type Value = string | HTML | Value[];
type Value2 = string | Node;
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

export function html(handlers?: { [key: string]: (e: Event) => void }) {
  return (parts: TemplateStringsArray, ...values: Value2[]): Node => {
    const slottedHtml = parts
      .map((part, i) => {
        return part + (i < values.length ? `<span id="SLOT_${i}" />` : "");
      })
      .join("");
    const parser = new DOMParser();
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
      const node = doc.getElementById(`SLOT_${i}`);
      if (node == null) {
        console.warn(`No node with id SLOT_${i}`);
        continue;
      }
      if (typeof value === "string") {
        node.textContent = value;
      } else if (Array.isArray(value)) {
        node.textContent = value.join("");
      } else if (typeof value === "object") {
        node.replaceWith(value);
      }
    }

    return doc.firstChild!;
  };
}

let elemId = 0;
const eventMap = new Map<string, WeakRef<(e: Event) => void>>();
(window as any).eventMap = eventMap;
(window as any).doEvent = (id: string, e: Event) => {
  const ref = eventMap.get(id);
  if (ref == null) {
    console.warn(`No event handler for ${id}`);
    return;
  }
  const fn = ref.deref;
  if (fn == null) {
    console.warn(`No event handler for ${id}`);
    eventMap.delete(id);
    return;
  }

  (fn as (e: Event) => void)(e);
};
const eventHandlerRegistry = new FinalizationRegistry((heldValue: string) => {
  eventMap.delete(heldValue);
});

function getEventAttributes(node: Element) {
  const events = node.getAttribute("events");
  return events?.split(",").map((event) => event.trim().split(":")) ?? [];
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
