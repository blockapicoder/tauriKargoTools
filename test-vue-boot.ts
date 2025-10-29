import { } from "./test-vue-panel"
import { } from "./test-vue"
import { defineVue, boot } from "./dist/vue"
import { DialogOwner, Panel } from "./test-model"


class Main {
    dialogue: DialogOwner
    panel: Panel
    model: Object | undefined
    constructor() {
        this.dialogue = new DialogOwner()
        this.panel = new Panel()
    }

    demarerPanel() {
        this.model = this.panel
    }
    demarerDialogue() {
        this.model = this.dialogue
    }


}
defineVue(Main, (ui) => {
   
        ui.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
            ui.staticBootVue({ action: "demarerDialogue", label: "Dialogue", name: "model", width: "50%" })
            ui.staticBootVue({ action: "demarerPanel", label: "Panel", name: "model", width: "50%" })
        })
 
})

boot(new Main(), "#app")