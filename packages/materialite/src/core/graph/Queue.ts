// Queue abstraction that sits between readers and writers.
// This queue understands what version it has sent and will not send old data
// unless explicitly requested to do so.
// E.g., a re-pull would re-set operators and allow old data to be sent.
// re-pulls need to happen if views are attached late to a data stream.
// Those view are missing all the history and so need to issue a re-pull for past data.

import { Multiset } from "../multiset.js";
import { Version } from "../types.js";

type Node<T> = {
  data: [Version, Multiset<T>];
  next: Node<T> | null;
};

export class Queue {
  #lastSeenVersion = -1;
  #head: Node<any> | null = null;
  #tail: Node<any> | null = null;

  enqueue(data: [number, Multiset<any>]) {
    if (data[0] <= this.#lastSeenVersion) {
      // throw an error?
      console.warn("enqueueing old data");
      return;
    }
    this.#lastSeenVersion = data[0];
    const node = { data, next: null };
    if (this.#head == null) {
      this.#head = node;
    } else {
      this.#tail!.next = node;
    }
    this.#tail = node;
  }

  dequeue() {
    if (this.#head == null) {
      return null;
    }
    const ret = this.#head.data;
    this.#head = this.#head.next;
    if (this.#head == null) {
      this.#tail = null;
    }
    return ret;
  }

  isEmpty() {
    return this.#head == null;
  }
}
