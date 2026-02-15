import { DataModelClient } from "../schema/client"
import { model } from "./data-model"


const client = new DataModelClient(model, "Groupe");


(async () => {
    const dm = await client.getObservation();
    const selfRef = await client.getSelf();
    dm.attach(selfRef)

    for (const ref of selfRef.getValue().membres) {
        console.log(dm.map)
        const tmp = await client.doAction("setCell", { ref: ref, value: false, p: ref.getValue().p });
        console.log(tmp.map)
    }










})()