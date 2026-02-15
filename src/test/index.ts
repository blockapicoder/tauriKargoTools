import * as test from "../test"
import * as api from '../api'
import * as schema from "../schema/base"
import { DataModelServer } from "../schema/server"
import { model } from "./data-model"
interface V {
    ref: schema.Ref<typeof model.def, "Cell">,
    value: schema.ToInterface<typeof model.def, "Point">
}

test.test("Test schema client server", async () => {

    const server = new DataModelServer(model, "Groupe")
    const state = server.createValue("Cell", { nom: "A", state: false, p: { x: 45, y: 7 } })
    const groupe = server.createValue("Groupe", { membres: [state], state: false })
    let resolve: (b: V) => void = () => { }
    const p = new Promise<V>((r) => {
        resolve = r
    })

    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    server.process(worker, (action, ref) => {
        if (action.op === "setCell") {
            resolve({ ref: action.value.ref, value: action.value.p })
        }
        return true
    }, groupe)
    const v = await p
    test.assertEquals(v.ref.ref === (state.ref as any), true)
    test.assertEquals(v.value.x, 45)
    test.assertEquals(v.value.y, 7)
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
test.test("Test ast typescript ", async () => {
    const client = api.createClient();
    const config = await client.getConfig()

    const rep = config.code + "\\src\\api.ts"

    const r = await client.typescriptAst({ path: rep })
    console.log(JSON.stringify(r))


})
test.test("Test transpile ", async () => {
    const client = api.createClient();
    const src = `  function m( n:number) { return n+1}`
    const r = await client.typescriptTranspile(src)
    console.log(JSON.stringify(r))


})
test.test("Test read file", async () => {

    const client = api.createClient();
    await client.setCurrentDirectory({ path: "." })
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
    await client.setCurrentDirectory({ path: "." })
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