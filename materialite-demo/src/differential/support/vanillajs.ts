const tempEl = document.createElement("div");
type Value = string | HTML | Value[];
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

export const html = (parts: TemplateStringsArray, ...values: Value[]) => {
  return {
    __html__: parts
      .map((part, i) => {
        return part + (i < values.length ? sanitize(values[i]) : "");
      })
      .join(""),
  };
};

export function htmle(handlers: {
  [key: string]: (e: Event) => void;
}): (parts: TemplateStringsArray, ...values: Value[]) => HTML {
  return (parts: TemplateStringsArray, ...values: Value[]) => {
    const html = {
      __html__: parts
        .map((part, i) => {
          return part + (i < values.length ? sanitize(values[i]) : "");
        })
        .join(""),
    };
    return bind(html, handlers);
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

export const bind = (
  html: HTML,
  handlers: { [key: string]: (e: Event) => void }
) => {
  // parse the html
  // for each element with an event attribute
  // create a unique id for that element and store the event handler in map.
  // replace the `event` call with `onX="eventHandler(id)"` where X is the event type
  // return the html

  const { __html__ } = html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(__html__, "text/html");
  const elements = doc.querySelectorAll("[event]");
  elements.forEach((el) => {
    const id = "EL_" + elemId++;

    const events = getEventAttributes(el);
    for (const [event, handler] of events) {
      const handlerFn = handlers[handler];
      if (!handlerFn) {
        console.warn(`No handler for event ${event}`);
        return;
      }
      eventMap.set(id, new WeakRef(handlerFn));
      eventHandlerRegistry.register(handlerFn, id);
      el.removeAttribute(event);
      el.setAttribute(event, `doEvent(${id}, event)`);
    }
  });
  return {
    __html__: doc.body.innerHTML,
    eventMap,
  };
};

function getEventAttributes(node: Element) {
  const attrs = Array.from(node.attributes);
  return attrs
    .filter((attr) => attr.name.startsWith("on"))
    .map((attr) => [attr.name, attr.value]);
}
