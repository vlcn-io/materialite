// Queue abstraction that sits between readers and writers.
// This queue understands what version it has sent and will not send old data
// unless explicitly requested to do so.
// E.g., a re-pull would re-set operators and allow old data to be sent.
// re-pulls need to happen if views are attached late to a data stream.
// Those view are missing all the history and so need to issue a re-pull for past data.

import { Multiset, isRecmopute } from "../multiset.js";
import { Version } from "../types.js";

type Node<T> = {
  data: [Version, Multiset<T>];
  next: Node<T> | null;
};

export class Queue<T> {
  #lastSeenVersion = -1;
  #awaitingRecompute = false;
  #head: Node<T> | null = null;
  #tail: Node<T> | null = null;

  enqueue(data: [number, Multiset<T>]) {
    if (data[0] <= this.#lastSeenVersion) {
      // throw an error?
      console.warn("enqueueing old data");
      return;
    }
    if (isRecmopute(data[1])) {
      if (this.#awaitingRecompute) {
        this.#awaitingRecompute = false;
      } else {
        // this channel didn't pull for old data
        return;
      }
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

  prepareForRecompute() {
    this.#awaitingRecompute = true;
  }

  peek() {
    return this.#head;
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

  clear() {
    this.#head = null;
    this.#tail = null;
  }
}
