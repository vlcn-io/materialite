import { Materialite } from "../../materialite.js";
import { Source } from "../../sources/Source.js";
import { RootDifferenceStreamWriter } from "./DifferenceWriter.js";
import { HoistableDifferenceStream } from "./HoistableDifferenceStream.js";

export class RootDifferenceStream<T> extends HoistableDifferenceStream<T> {
  constructor(materialite: Materialite, source: Source<unknown, unknown>) {
    super(materialite, new RootDifferenceStreamWriter<T>(source));
  }
}

/**
 * pull...
 *
 * changing writers but do we need to change readers too?
 *
 * source - w -
 */
