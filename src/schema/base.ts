export type Type<T> =

  | "string"

  | "number"

  | "boolean"

  | { union: readonly string[]; }

  | { ref: readonly (keyof T)[]; }



  | { arrayOf: Type<T>; }

  | { optional: Type<T>; };



export type Structure<T> = { [name: string]: Type<T>; };
export type EntityFieldValue = number | string | boolean | { ref: string } | EntityFieldValue[]
export type Entity = { [name: string]: EntityFieldValue }
export type EntityMap = { [id: string]: Entity }

export function createModel<T extends { [name: string]: Structure<T>; }>(def: T): T {
  return def;
}



export class DataModel<T extends { [name: string]: Structure<T>; }> {

  def: T;

  map: { [id: string]: ModelElement<T>; } = {};
  types: { [id: string]: keyof T } = {}
  idx = 0;
  idForModelElement: Map<ModelElement<T>, string>;
  constructor(def: T) {
    this.idForModelElement = new Map()
    this.def = def;

  }
  getValues(): ModelElement<T>[] {
    return Object.values(this.map)
  }

  getValue(ref: string): ModelElement<T> {
    return this.map[ref];
  }

  is<K extends keyof T>(m: any, type: K): m is Interfaces<T>[K] {
    const id = this.idForModelElement.get(m)
    if (!id) {
      return false
    }
    return this.types[id] === type

  }
  isRef<K extends keyof T>(ref: any, type: K): ref is Ref<T, K> {
    if (typeof ref.ref !== "string") {
      return false
    }
    const value = this.getValue(ref.ref)
    if (ref.ref && this.is(value, type)) {
      ref.getValue = () => value
      return true
    }
    return false

  }
  initField(ref: string, name: string, value: EntityFieldValue) {
    const entity = this.map[ref]
    if (entity) {
      const type = this.types[ref]
      const typeField = this.def[type][name]
      if (this.checkType(typeField, this.map, value, {})) {
        (entity as any)[name] = value
      }
    }


  }

  init(value: EntityMap) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;

    const map: { [id: string]: keyof T } = {};

    for (const id in value) {
      let ok = false;

      for (const t in this.def) {
        if (this.check(id, value, t as keyof T, map)) {
          ok = true;
          break;
        }
      }

      if (!ok) return undefined; // ou throw new Error(`No type matches for ${id}`)
    }
    this.map = value as any
    for (let e of Object.entries(this.map)) {
      this.idForModelElement.set(e[1], e[0])
    }
    this.types = map

    return map;
  }


  check<K extends keyof T>(id: string, value: any, type: K, map: { [id: string]: keyof T }): boolean {
    if (map[id] === type) {
      return true
    }
    if (map[id] !== undefined) {
      return false
    }


    map[id] = type
    const struct = this.def[type]
    if (this.checkStructure(struct, value, value[id], map)) {
      return true
    }
    delete map[id]
    return false


  }
  checkStructure(
    struct: Structure<T>,
    value: any,
    obj: any,
    map: { [id: string]: keyof T }
  ): boolean {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;

    // mode strict : pas de propriétés inconnues
    for (const k of Object.keys(obj)) {
      if (!(k in struct)) return false;
    }

    for (const [prop, t] of Object.entries(struct)) {
      const v = (obj as any)[prop];

      // optional
      if (this.isOptionalType(t)) {
        if (v === undefined) continue;
        if (!this.checkType(t.optional, value, v, map)) return false;
        continue;
      }

      // required
      if (v === undefined) return false;
      if (!this.checkType(t as Type<T>, value, v, map)) return false;
    }

    return true;
  }

  private checkType(
    t: Type<T>,
    root: any, // le "value" global (map d'objets)
    v: any,
    map: { [id: string]: keyof T }
  ): boolean {
    if (t === "string") return typeof v === "string";
    if (t === "number") return typeof v === "number";
    if (t === "boolean") return typeof v === "boolean";

    if (this.isUnionType(t)) {
      return typeof v === "string" && t.union.includes(v);
    }

    if (this.isArrayOfType(t)) {
      return Array.isArray(v) && v.every(el => this.checkType(t.arrayOf, root, el, map));
    }

    if (this.isOptionalType(t)) {
      return v === undefined || this.checkType(t.optional, root, v, map);
    }

    if (this.isRefType(t)) {
      // runtime minimal : { ref: "$0" }
      if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
      const rid = (v as any).ref;

      if (typeof rid !== "string") return false;
      if (!(rid in root)) return false;

      // doit matcher AU MOINS un type autorisé
      const allowed = t.ref as readonly (keyof T)[];
      for (const candidate of allowed) {
        if (this.check(rid, root, candidate, map)) {
          (v as any).getValue = () => root[rid]
          return true;
        }
      }
      return false;
    }

    return false;
  }

  private isUnionType(x: any): x is { union: readonly string[] } {
    return typeof x === "object" && x !== null && Array.isArray(x.union);
  }
  private isRefType(x: any): x is { ref: readonly (keyof T)[] } {
    return typeof x === "object" && x !== null && Array.isArray(x.ref);
  }
  private isArrayOfType(x: any): x is { arrayOf: Type<T> } {
    return typeof x === "object" && x !== null && "arrayOf" in x;
  }
  private isOptionalType(x: any): x is { optional: Type<T> } {
    return typeof x === "object" && x !== null && "optional" in x;
  }


  createValue<K extends keyof T>(type: K, value: Interfaces<T>[K]): Ref<T, K> {

    const ref = `$${this.idx}`;

    this.idx++;

    this.map[ref] = value as any;
    this.types[ref] = type
    this.idForModelElement.set(this.map[ref], ref)

    return { ref: ref, getValue: () => value } as any;

  }




}

export type RefUnion<TDefs extends { [name: string]: Structure<TDefs>; }> = {
  [K in keyof TDefs]: Ref<TDefs, K>;
}[keyof TDefs];

type UnwrapOptional<V> = V extends { optional: infer O; } ? O : V;

export type Ref<TDefs extends { [name: string]: Structure<TDefs>; }, K extends keyof TDefs> = { ref: string, getValue(): Interfaces<TDefs>[K] }

// Résout un champ du DSL vers un type TypeScript concret

type ToTsType<

  TDefs extends { [name: string]: Structure<TDefs>; },

  V

> =

  V extends "string" ? string :

  V extends "number" ? number :

  V extends "boolean" ? boolean :

  V extends { ref: infer K; }

  ? K extends readonly (keyof TDefs)[]

  ? { [U in K[number]]: Ref<TDefs, U> }[K[number]]

  : never

  : V extends { arrayOf: infer O; }

  ? ToTsType<TDefs, O>[]

  : V extends { optional: infer O; }

  ? ToTsType<TDefs, O>

  : V extends { union: infer L; }

  ? L extends readonly string[]

  ? L[number]

  : never

  : never;



// Matérialise une "entité" (clé de TDefs) en interface concrète

export type ToInterface<

  TDefs extends { [name: string]: Structure<TDefs>; },

  Name extends keyof TDefs

> =

  // Propriétés requises (pas 'optional')

  {
    -readonly [P in keyof TDefs[Name]as TDefs[Name][P] extends { optional: any; } ? never : P]:

    ToTsType<TDefs, TDefs[Name][P]>;

  }

  &

  // Propriétés optionnelles ('optional')

  {

    -readonly [P in keyof TDefs[Name]as TDefs[Name][P] extends { optional: any; } ? P : never]?:

    ToTsType<TDefs, UnwrapOptional<TDefs[Name][P]>>;

  };

// Matérialise l’ensemble des interfaces

type Interfaces<TDefs extends { [name: string]: Structure<TDefs>; }> = {

  [K in keyof TDefs]: ToInterface<TDefs, K>;

};

type ModelElement<TDefs extends { [name: string]: Structure<TDefs>; }> = Interfaces<TDefs>[keyof TDefs];



type Def<TDefs> = { [name: string]: Structure<TDefs> };

export class TypeImplicationChecker<TDefs extends Def<TDefs>> {
  constructor(public readonly def: TDefs) { }

  /** Calcule la matrice implies[A][B] (point fixe) et la liste des incohérences A⇒B (A≠B). */
  analyze() {
    const names = Object.keys(this.def) as (keyof TDefs & string)[];
    const implies: Record<string, Record<string, boolean>> = {};

    for (const a of names) {
      implies[a] = {};
      for (const b of names) implies[a][b] = (a === b);
    }

    let changed = true;
    while (changed) {
      changed = false;

      for (const a of names) {
        for (const b of names) {
          if (a === b) continue;
          if (implies[a][b]) continue;

          if (this.impliesStructure(a, b, implies)) {
            implies[a][b] = true;
            changed = true;
          }
        }
      }
    }

    const problems: Array<{ A: string; B: string }> = [];
    for (const a of names) {
      for (const b of names) {
        if (a !== b && implies[a][b]) problems.push({ A: a, B: b });
      }
    }

    return { implies, problems };
  }

  /** Vrai si le système est cohérent au sens “aucun A⇒B avec A≠B”. */
  isCoherent(): boolean {
    return this.analyze().problems.length === 0;
  }

  /** Lève une erreur si incohérent. */
  assertCoherent(): void {
    const { problems } = this.analyze();
    if (problems.length) {
      const msg = problems.map(p => `${p.A} => ${p.B}`).join(", ");
      throw new Error(`Incoherent type system (implications found): ${msg}`);
    }
  }

  // ----------------- Implémentation interne -----------------

  private isUnion(x: any): x is { union: readonly string[] } {
    return typeof x === "object" && x !== null && Array.isArray(x.union);
  }
  private isRef(x: any): x is { ref: readonly string[] } {
    return typeof x === "object" && x !== null && Array.isArray(x.ref);
  }
  private isArrayOf(x: any): x is { arrayOf: any } {
    return typeof x === "object" && x !== null && "arrayOf" in x;
  }
  private isOptional(x: any): x is { optional: any } {
    return typeof x === "object" && x !== null && "optional" in x;
  }

  private impliesType(a: Type<TDefs>, b: Type<TDefs>, implies: Record<string, Record<string, boolean>>): boolean {
    // primitives
    if (a === "string") return b === "string";
    if (a === "number") return b === "number";
    if (a === "boolean") return b === "boolean";

    // union
    if (this.isUnion(a)) {
      if (b === "string") return true; // union de literals ⊆ string
      if (!this.isUnion(b)) return false;
      const A = new Set(a.union);
      return b.union.every(x => A.has(x)); // A ⊆ B  => union(A) ⇒ union(B)
    }

    // optional
    if (this.isOptional(a)) {
      if (!this.isOptional(b)) return false; // optional(X) ne peut pas impliquer Y (undefined possible)
      return this.impliesType(a.optional, b.optional, implies);
    }
    if (this.isOptional(b)) {
      // X ⇒ optional(Y) si X⇒Y
      return this.impliesType(a, b.optional, implies);
    }

    // arrayOf
    if (this.isArrayOf(a)) {
      if (!this.isArrayOf(b)) return false;
      return this.impliesType(a.arrayOf, b.arrayOf, implies);
    }

    // ref
    if (this.isRef(a)) {
      if (!this.isRef(b)) return false;
      // {ref:[A1..]} ⇒ {ref:[B1..]} si ∀Ai ∃Bj : Ai ⇒ Bj
      return a.ref.every(ai => b.ref.some(bj => implies[String(ai)]?.[String(bj)] === true));
    }

    return false;
  }

  /**
   * Structure-level implication A⇒B en mode STRICT (comme votre checkStructure):
   * - un objet A ne doit pas avoir de propriété inconnue pour B
   * - les requis de B doivent être requis dans A
   * - les types doivent impliquer
   */
  private impliesStructure(
    A: keyof TDefs & string,
    B: keyof TDefs & string,
    implies: Record<string, Record<string, boolean>>
  ): boolean {
    const SA = this.def[A];
    const SB = this.def[B];

    // STRICT: toutes les props de A doivent exister dans B (sinon un objet A échoue chez B)
    for (const p in SA) {
      if (!(p in SB)) return false;
    }

    for (const p in SB) {
      const tb = SB[p];
      const ta = SA[p];

      const bOpt = this.isOptional(tb);
      const aOpt = ta !== undefined ? this.isOptional(ta) : false;

      if (!bOpt) {
        // B requiert p => A doit le requérir aussi
        if (ta === undefined) return false;
        if (aOpt) return false;
        if (!this.impliesType(ta, tb, implies)) return false;
      } else {
        // B optionnel : A peut ne pas avoir p ; si A l'a, il doit impliquer le noyau de B
        if (ta === undefined) continue;
        const taCore = aOpt ? (ta as any).optional : ta;
        const tbCore = (tb as any).optional;
        if (!this.impliesType(taCore, tbCore, implies)) return false;
      }
    }

    return true;
  }
}

export interface DataModelReponse {
  type: 'dataModelReponse';
  value: any;
}
export interface RefReponse {
  type: 'refReponse';
  ref: string;
}
