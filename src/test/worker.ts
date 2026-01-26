import { DataModelClient } from "../schema/client"
import { model } from "./data-model"


const client = new DataModelClient(model, "Groupe");


(async () => {
    const dm = await client.getObservation();
    for (const o of dm.getValues()) {
        if (dm.is(o, "Groupe")) {
            for (const ref of o.membres) {
                console.log(dm.map)
                const tmp = await client.doAction({ ref: ref, field: "state", value: true });
                console.log(tmp.map)
            }


        }
    }
    const selfRef = await client.getSelf();

    await client.doAction({ ref: selfRef, field: "state", value: true });



})()