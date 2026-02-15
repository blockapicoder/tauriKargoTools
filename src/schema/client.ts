import { Ref, Structure, ToInterface, DataModel, World, Api, ToInterfaceForStructure, WorldAction } from "./base";
export type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
export type Value = string | number | boolean | Value[]
export interface DataModelProp<T extends { [name: string]: Structure<T>; }, K extends keyof T, F extends keyof ToInterface<T, K>> {
  ref: Ref<T, K>
  field: F
  value: ToInterface<T, K>[F]
}
export interface DoAction<T extends { [name: string]: Structure<T>; }, K extends keyof T, F extends keyof ToInterface<T, K>> extends DataModelProp<T, K, F> {
  type: "doAction"
}

export class DataModelClient<T extends { [name: string]: Structure<T>; }, M extends keyof T,A extends Api<T>> {
  world: World<T,A>
  resolveDataModel: (dm: DataModel<T>) => void = () => { };
  resolveRefUnion: (ref: Ref<T, M>) => void = () => { };

  async doAction<K extends keyof A>(op: K, value: ToInterfaceForStructure<T, A[K]>): Promise<DataModel<T>> {
    const setDataModelProp: WorldAction<T,A,K> = { type: "doAction", op: op, value: value }
    self.postMessage(JSON.parse(JSON.stringify(setDataModelProp)))

    const r = new Promise<DataModel<T>>((resolve) => {
      this.resolveDataModel = resolve;
    })
    return r;

  }
  async getObservation(): Promise<DataModel<T>> {
    self.postMessage({ type: "getObservation" })
    const r = new Promise<DataModel<T>>((resolve) => {
      this.resolveDataModel = resolve;
    })
    return r;
  }
  async getSelf(): Promise<Ref<T, M>> {
    self.postMessage({ type: "getSelf" })
    const r = new Promise<Ref<T, M>>((resolve) => {
      this.resolveRefUnion = resolve;
    })
    return r;


  }
  constructor(world: World<T,A>, type: M) {
    this.world = world
    self.addEventListener("message", (event) => {
      const data = event.data;
      if (data.type === "refReponse") {
        const refReponse = data as { type: 'refReponse', ref: string };
        const r = { ref: refReponse.ref } as Ref<T, M>;
        this.resolveRefUnion(r);
        return;
      }
      if (data.type === "dataModelReponse") {
        const r = new DataModel<T>(this.world.def)
        r.init(data.value)
        this.resolveDataModel(r);
      }

    })
  }
}
