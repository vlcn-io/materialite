import { ImmRandomBST } from "./trees/ImmRandomBST.js";

let tree = new ImmRandomBST<number>((a, b) => a - b);
for (let i = 0; i < 3; i++) {
  console.log(`Iter: ${i}`);
  tree = tree.add(i);
  console.log([...tree]);
}

// console.log(tree.actualDepth_expensive());
// console.log(tree.likelyDepth());
