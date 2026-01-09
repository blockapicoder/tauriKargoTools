import * as test from "../test"
import * as api from '../api'
import * as schema from "../schema/base"
import { DataModelServer, SetDataModelProp } from "../schema/server"
import { model } from "./data-model"
test.test("Test schema client server", async () => {

    const server = new DataModelServer(model)
    const state = server.createValue("Cell", { nom: "A", state: false })
    const groupe = server.createValue("Groupe", { membres: [state], state: false })
    let resolve: (b: SetDataModelProp[]) => void = () => { }
    const p = new Promise<SetDataModelProp[]>((r) => {
        resolve = r
    })
    const m: SetDataModelProp[] = []
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    server.process(worker, (op) => {
        m.push(op)
        if (m.length >= 2) {
            resolve(m)
        }
        return true
    }, groupe)
    const v = await p
    test.assertEquals(v[0].ref.ref === (state.ref as any), true)
    test.assertEquals(v[1].ref.ref === (groupe.ref as any), true)
    worker.terminate()

})
test.test("Test schema simple un type", async () => {
    const vue = new schema.DataModel({
        Point: {
            x: "number",
            y: "number"
        }
    })
    const p = vue.createValue("Point", { x: 10, y: 15 })
    test.assertEquals(p.getValue().x, 10)
    test.assertEquals(p.getValue().y, 15)
    const anotherVue = new schema.DataModel({
        Point: {
            x: "number",
            y: "number"
        }
    })
    const copy = JSON.parse(JSON.stringify(vue.map))
    const map = anotherVue.init(copy)
    test.assertEquals(map !== undefined, true)
    test.assertEquals(map![p.ref], "Point")
    const p2 = anotherVue.getValue(p.ref)
    test.assertEquals(p2.x, 10)
    test.assertEquals(p2.y, 15)
    console.log(map)



})

test.test("Test schema simple avec deux type", async () => {
    const vue = new schema.DataModel({
        Point: {
            x: "number",
            y: "number"
        },
        Personne: {
            nom: "string",
            prenom: "string"
        }
    })
    const point = vue.createValue("Point", { x: 10, y: 15 })
    const personne = vue.createValue("Personne", { nom: "Toto", prenom: "Lili" })
    let testPoint = false
    let testPersonne = false
    for (const p of vue.getValues()) {
        if (vue.is(p, "Point")) {
            test.assertEquals(p.x, 10)
            test.assertEquals(p.y, 15)
            testPoint = true
        }
        if (vue.is(p, "Personne")) {
            test.assertEquals(p.nom, "Toto")
            test.assertEquals(p.prenom, "Lili")
            testPersonne = true
        }
    }
    test.assertEquals(testPoint, true)
    test.assertEquals(testPersonne, true)





})
test.test("Test read file", async () => {

    const client = api.createClient();
    const txt = "hello.world"
    await client.writeFileText("test.txt", txt)
    let rep = await client.explorer({})
    test.assertEquals(rep.type === "directory", true)
    if (rep.type === "directory") {

        test.assertEquals(rep.content.some((e) => {
            if (e.type !== "directory") {
                return e.name === "test.txt"
            }
            return false

        }), true, "pas dans rep")
    }

    const r = await client.readFileText("test.txt")

    test.assertEquals(r, txt)

    await client.deleteFile("test.txt")
    rep = await client.explorer({})
    test.assertEquals(rep.type === "directory", true)
    if (rep.type === "directory") {

        test.assertEquals(rep.content.some((e) => {
            if (e.type !== "directory") {
                return e.name === "test.txt"
            }
            return false

        }), false, "pas dans rep")
    }
    const repCreateDir = await client.createDirectory("toto/titi");
    rep = await client.explorer({})
    if (rep.type === "directory") {
        test.assertEquals(rep.content.some((e) => e.name === "toto"), true)

    } else {
        throw new Error('error pas rep')
    }
    rep = await client.explorer({ type: "array", path: "C:/Users/david/Documents/GitHub/tauriKargoExamples/examples/test-api-file-typescript" })
    console.log(rep)



})