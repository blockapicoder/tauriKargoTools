import { createModel } from "../schema/base";


export const model = createModel({
    Cell: {
        nom: "string",
        state: "boolean",
        p: { struct: "Point" }
    },
    Groupe: {
        state: "boolean",
        membres: { arrayOf: { ref: ["Cell"] } }
    },
    Point: {
        x: "number",
        y: "number"
    }
}, {
    setCell: {
        ref: { ref: ["Cell"] },
        value: "boolean",
        p: { struct: "Point" }
    }
})