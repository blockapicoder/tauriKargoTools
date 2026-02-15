import { set } from "../container";
import { Ref, Structure, ToInterface, DataModel, DataModelReponse, World, WorldActionFonction, Api } from "./base";
import { Value } from "./client";

export interface DoAction {
    type: "doAction",
    ref: { ref: string }
    field: string
    value: Value
}
export interface SimpleRef {
    ref: string
}

export class DataModelServer<T extends { [name: string]: Structure<T>; }, M extends keyof T,A extends Api<T>> extends DataModel<T> {
    world: World<T,A>
    constructor(world: World<T,A>, type: M) {
        super(world.def)
        this.world = world
    }

    process(worker: Worker, action: WorldActionFonction<T,A,  M>, ref: Ref<T, M>) {
        worker.addEventListener("message", async (event) => {
            const data = event.data;
            if (data.type === "doAction") {

                const error = (action( { op:data.op,value:data.value,type:"doAction"}, ref))
                worker.postMessage(this.cloneMap(error));

            }
            if (data.type === "getObservation") {
                worker.postMessage(this.cloneMap(false));
            }
            if (data.type === "getSelf") {
                const refReponse = { type: 'refReponse', ref: ref.ref };
                worker.postMessage(refReponse);
            }
        })

    }
    cloneMap(error: boolean): DataModelReponse {
        return { type: 'dataModelReponse', value: JSON.parse(JSON.stringify(this.map)), error: error };
    }

}