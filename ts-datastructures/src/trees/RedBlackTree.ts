import { INode, TreeBase } from "./TreeBase";

export class RBNode<V> implements INode<V> {
  data: V | null;
  left: RBNode<V> | null = null;
  right: RBNode<V> | null = null;
  red = true;

  constructor(data: V) {
    this.data = data;
  }

  getChild(dir: boolean) {
    return dir ? this.right : this.left;
  }

  setChild(dir: boolean, val: RBNode<V> | null) {
    if (dir) {
      this.right = val;
    } else {
      this.left = val;
    }
  }
}

export class RBTree<V> extends TreeBase<V> {
  protected readonly _comparator: (a: V, b: V) => number;

  constructor(comparator: (a: V, b: V) => number) {
    super();
    this._comparator = comparator;
  }

  insert(data: V) {
    let ret = false;

    if (this._root === null) {
      // empty tree
      this._root = new RBNode(data);
      ret = true;
      ++this._version;
      ++this._size;
    } else {
      const head = new RBNode<V>(undefined as any); // fake tree root

      let dir = false;
      let last = false;

      // setup
      let gp: RBNode<V> | null = null; // grandparent
      let ggp = head; // grand-grand-parent
      let p: RBNode<V> | null = null; // parent
      let node: RBNode<V> | null = this._root as RBNode<V>;
      ggp.right = this._root as RBNode<V>;

      // search down
      while (true) {
        if (node === null) {
          // insert new node at the bottom
          node = new RBNode(data);
          p!.setChild(dir, node);
          ret = true;
          ++this._size;
          ++this._version;
        } else if (is_red(node.left) && is_red(node.right)) {
          // color flip
          node.red = true;
          node.left!.red = false;
          node.right!.red = false;
        }

        // fix red violation
        if (is_red(node) && is_red(p)) {
          const dir2 = ggp.right === gp;

          if (node === p!.getChild(last)) {
            ggp.setChild(dir2, single_rotate(gp!, !last));
          } else {
            ggp.setChild(dir2, double_rotate(gp!, !last));
          }
        }

        const cmp = this._comparator(node.data!, data);

        // stop if found
        if (cmp === 0) {
          break;
        }

        last = dir;
        dir = cmp < 0;

        // update helpers
        if (gp !== null) {
          ggp = gp;
        }
        gp = p;
        p = node;
        node = node.getChild(dir);
      }

      // update root
      this._root = head.right;
    }

    // make root black
    if (this._root !== null) {
      (this._root as RBNode<V>).red = false;
    }

    return ret;
  }

  remove(data: V) {
    if (this._root === null) {
      return false;
    }

    const head = new RBNode<V>(undefined as any); // fake tree root
    let node: RBNode<V> = head;
    node.right = this._root as RBNode<V>;
    let p: RBNode<V> | null = null; // parent
    let gp: RBNode<V> | null = null; // grand parent
    let found: RBNode<V> | null = null; // found item
    let dir = true;

    while (node.getChild(dir) !== null) {
      const last = dir;

      // update helpers
      gp = p;
      p = node;
      node = node.getChild(dir)!;

      const cmp = this._comparator(data, node.data!);

      dir = cmp > 0;

      // save found node
      if (cmp === 0) {
        found = node;
      }

      // push the red node down
      if (!is_red(node) && !is_red(node.getChild(dir))) {
        if (is_red(node.getChild(!dir))) {
          const sr = single_rotate(node, dir);
          p!.setChild(last, sr);
          p = sr;
        } else if (!is_red(node.getChild(!dir))) {
          const sibling = p!.getChild(!last);
          if (sibling !== null) {
            if (
              !is_red(sibling.getChild(!last)) &&
              !is_red(sibling.getChild(last))
            ) {
              // color flip
              p!.red = false;
              sibling.red = true;
              node.red = true;
            } else {
              const dir2 = gp!.right === p;

              if (is_red(sibling.getChild(last))) {
                gp!.setChild(dir2, double_rotate(p, last));
              } else if (is_red(sibling.getChild(!last))) {
                gp!.setChild(dir2, single_rotate(p, last));
              }

              // ensure correct coloring
              const gpc = gp!.getChild(dir2)!;
              gpc.red = true;
              node.red = true;
              gpc.left!.red = false;
              gpc.right!.red = false;
            }
          }
        }
      }
    }

    // replace and remove if found
    if (found !== null) {
      found.data = node.data;
      ++this._version;
      p!.setChild(p!.right === node, node.getChild(node.left === null));
      --this._size;
    }

    // update root and make it black
    this._root = head.right;
    if (this._root !== null) {
      (this._root as RBNode<V>).red = false;
    }

    return found !== null;
  }
}

function is_red<V>(node: RBNode<V> | null) {
  return node !== null && node.red;
}

function single_rotate<V>(root: RBNode<V>, dir: boolean) {
  var save = root.getChild(!dir)!;

  root.setChild(!dir, save.getChild(dir));
  save.setChild(dir, root);

  root.red = true;
  save.red = false;

  return save;
}

function double_rotate<V>(root: RBNode<V>, dir: boolean) {
  root.setChild(!dir, single_rotate(root.getChild(!dir)!, !dir));
  return single_rotate(root, dir);
}
