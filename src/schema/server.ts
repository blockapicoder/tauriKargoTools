import { set } from "../container";
import { Ref, Structure, ToInterface, DataModel, DataModelReponse, RefUnion } from "./base";
import { Value } from "./client";

export interface SetDataModelProp {
    type: "setDataModelProp",
    ref: { ref: string }
    field: string
    value: Value
}
export interface SimpleRef {
    ref: string
}

export class DataModelServer<T extends { [name: string]: Structure<T>; }> extends DataModel<T> {

    constructor(def: T) {
        super(def)
    }
    process(worker: Worker, check: (setDataModelProp: SetDataModelProp) => boolean, ref:SimpleRef) {
        worker.addEventListener("message", async (event) => {
            const data = event.data;
            if (data.type === "setDataModelProp") {
                const setDataModelProp = data as SetDataModelProp;
                if (check(setDataModelProp)) {
                    this.initField(setDataModelProp.ref.ref, setDataModelProp.field, setDataModelProp.value);
                    worker.postMessage(this.cloneMap());
                }
            }
            if (data.type === "getDataModel") {
                worker.postMessage(this.cloneMap());
            }
            if (data.type === "getSelf") {
                const refReponse = { type: 'refReponse', ref: ref.ref };
                worker.postMessage(refReponse);
            }
        })

    }
    cloneMap(): DataModelReponse {
        return { type: 'dataModelReponse', value: JSON.parse(JSON.stringify(this.map)) };
    }

}