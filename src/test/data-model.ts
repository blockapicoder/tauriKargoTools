import { createModel } from "../schema/base";


export const model = createModel({
    Cell: {
        nom: "string",
        state: "boolean",
    },
    Groupe: {
        state:"boolean",
        membres: { arrayOf: { ref: ["Cell"] } }
    }
})