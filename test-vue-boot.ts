import { } from "./test-vue-panel"
import { } from "./test-vue"
import { defineVue, boot } from "./dist/vue"
import { DialogOwner, Panel } from "./test-model"
class Compute {
    value: number
    sqrtValue: number
    constructor() {
        this.value = 0
        this.sqrtValue = 0
    }
    computeValue() {
        this.value = this.sqrtValue * this.sqrtValue
    }
    computeValueSqrt() {
        this.sqrtValue = Math.sqrt(this.value)
    }
}
defineVue(Compute, (vue) => {

    vue.flow({ orientation: "row", width: "100%", justify: "center" }, () => {
        vue.input({ name: "sqrtValue", update: "computeValue", inputType: "number", width: "50%" })
        vue.input({ name: "value", update: "computeValueSqrt", inputType: "number", width: "50%" })
    })

})

class Main {
    dialogue: DialogOwner
    panel: Panel
    compute: Compute

    constructor() {
        this.dialogue = new DialogOwner()
        this.panel = new Panel()
        this.compute = new Compute()
    }

    demarerPanel(): Panel {
        return this.panel
    }
    demarerDialogue(): DialogOwner {
        return this.dialogue
    }
    demarerCompute(): Compute {
        return this.compute
    }

}
defineVue(Main, (ui) => {

    ui.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
        ui.staticBootVue({ factory: "demarerDialogue", label: "Dialogue", width: "33%" })
        ui.staticBootVue({ factory: "demarerPanel", label: "Panel", width: "33%" })
        ui.staticBootVue({ factory: "demarerCompute", label: "Compute", width: "34%" })
    })

})

boot(new Main(), "#app")