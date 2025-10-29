import { } from "./test-vue-panel"
import { } from "./test-vue"
import { defineVue, boot } from "./dist/vue"
import { DialogOwner, Panel } from "./test-model"


class Main {
    dialogue: DialogOwner
    panel: Panel

    constructor() {
        this.dialogue = new DialogOwner()
        this.panel = new Panel()
    }

    demarerPanel():Panel {
        return this.panel
    }
    demarerDialogue():DialogOwner {
       return this.dialogue
    }


}
defineVue(Main, (ui) => {
   
        ui.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
            ui.staticBootVue({ factory:"demarerDialogue", label: "Dialogue",  width: "50%" })
            ui.staticBootVue({ factory: "demarerPanel", label: "Panel", width: "50%" })
        })
 
})

boot(new Main(), "#app")