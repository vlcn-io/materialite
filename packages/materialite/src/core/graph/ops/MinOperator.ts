// import { Multiset } from "../../multiset.js";
// import { DifferenceStreamReader } from "../DifferenceReader.js";
// import { DifferenceStreamWriter } from "../DifferenceWriter.js";
// import { LinearUnaryOperator } from "./LinearUnaryOperator.js";

// export class MinOperator<I> extends LinearUnaryOperator<I, I> {
//   constructor(
//     input: DifferenceStreamReader<I>,
//     output: DifferenceStreamWriter<I>,
//     minBy: (a: I) => number,
//   ) {
//     // TODO: need to maintain a heap so we can remove minimums
//     let min = Number.POSITIVE_INFINITY;
//     const inner = (collection: Multiset<I>) => {
//       for (const item of collection.entries) {
//         const num = minBy(item[0]);
//       }
//     };
//     super(input, output, inner);
//   }
// }
