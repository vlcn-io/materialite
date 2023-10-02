export type Opaque<BaseType, BrandType = unknown> = BaseType & {
  readonly [Symbols.base]: BaseType;
  readonly [Symbols.brand]: BrandType;
};

namespace Symbols {
  export declare const base: unique symbol;
  export declare const brand: unique symbol;
}

export type TypeNum = Opaque<number, 'TypeNum'>;
export type AttrNum = Opaque<number, 'AttrNum'>;

export type Schema = {
  [type: string]: {
    num: TypeNum;
    attrs: {
      [attr: string]: {
        num: AttrNum;
        type: string;
        // We can do non-unique indices by suffixing the index name with a number that increments?
        index?: 'unqiue' | 'normal';
      };
    }
  };
};

export type StorageKey = Uint8Array;
export type SubjectKey = [TypeNum, AttrNum, Key];
type Predicate = AttrNum;
type Value = any;
export type Key = any;

export type Triple = [SubjectKey, Predicate, Value];
