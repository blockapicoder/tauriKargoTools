import { DataModelClient } from "../schema/client"
import { model } from "./data-model"


const client = new DataModelClient(model);


(async () => {
    const dm = await client.getDataModel();
    for (const o of dm.getValues()) {
        if (dm.is(o, "Groupe")) {
            for (const ref of o.membres) {
                console.log(dm.map)
                const tmp = await client.setProp({ ref: ref, field: "state", value: true });
                console.log(tmp.map)
            }


        }
    }
    const selfRef = await client.getSelf();
    if (dm.isRef(selfRef, "Groupe")) {
        await client.setProp({ ref: selfRef, field: "state", value: true });
    }


})()