import { } from "./test-vue-panel"
import { } from "./test-vue"
import { defineVue, boot, Init } from "../vue"
import { DialogOwner, Panel } from "./test-model"

// Statut de commande (multi-ligne)
const s1 = "📦 Commande #A42\n✅ Payée\n⏳ En préparation\n🚚 Livraison prévue : 03/11/2025";

// Fiche contact
const s2 = "👤 Jean Dupont\n📧 jean.dupont@example.com\n📍 Paris";

// Indicateurs rapides
const s3 = "📈 +12%\n💾 Sauvegardé\n🔔 3 alertes";

class Compute {
    value: number
    sqrtValue: number
    text!: string
    constructor() {
        this.value = 0
        this.sqrtValue = 0
        this.text = s1 + s2 + s3
    }
    computeValue() {
        this.value = this.sqrtValue * this.sqrtValue
    }
    computeValueSqrt() {
        this.sqrtValue = Math.sqrt(this.value)
    }
    addMargin( div:HTMLDivElement) {
     //   div.style.margin="25"
    }
}
defineVue(Compute, (vue) => {
    vue.flow({ orientation: "column" , style:{margin:"25"} }, () => {
        vue.flow({ orientation: "row", width: "100%", justify: "center" }, () => {
            vue.input({ name: "sqrtValue", update: "computeValue", inputType: "number", width: "50%" })
            vue.input({ name: "value", update: "computeValueSqrt", inputType: "number", width: "50%" })
        })
        vue.label("text", { width: '100%', height: 400 })
    })

}, { init:"addMargin"})

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
    initVue(div: HTMLDivElement):string {
        console.log("init Main")
        console.log(div.parentNode)
        return ""
    }
    initF( d:DialogOwner) {

    }
    


}



defineVue(Main, (ui) => {

    ui.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
        ui.staticBootVue({ factory: "demarerDialogue", label: "Dialogue", width: "33%"  })
        ui.staticBootVue({ factory: "demarerPanel", label: "Panel", width: "33%" })
        ui.staticBootVue({ factory: "demarerCompute", label: "Compute", width: "34%" })
    })

},{ init:"initVue"})

boot(new Main())


