import * as test from "./dist/test"
import * as api from './dist/api'
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




})