import { defineVue } from "../vue"
import { ElementPanel } from "./test-model-panel"




export class Base extends ElementPanel {
    op!: string
    a!: number
    b!: number
    r!: number
    constructor() {
        super()

    }
    compute() {
        if (this.op === "+") {
            this.r = this.a + this.b
        }
        if (this.op === "*") {
            this.r = this.a * this.b
        }
        if (this.op === "-") {
            this.r = this.a - this.b
        }
        if (this.op === "/") {
            this.r = this.a / this.b
        }
    }
}
export class BaseAvecLog extends Base {
    compute(): void {
        if (this.op === "pow") {
            this.r = Math.pow(this.a, this.b)
        } else {
            super.compute()
        }
        console.log(this.a, this.op, this.b, "=", this.r)
    }
}
defineVue(Base, {
    kind: "flow",
    orientation: "column",
    gap: 10,
    children: [
        {
            kind: "flow",
            orientation: "row",

            gap: 10,
            children: [
                { kind: "input", name: "op", width: '34%' },
                { kind: "input", name: "a", width: '33%', inputType: "number" },
                { kind: "input", name: "b", width: '33%', inputType: "number" }
            ]

        },
        { kind: "label", name: "r", height: 30 },
        { kind: "staticButton", action: "compute", label: "Calculer" }
    ]
})
class MenuOp {
    base!: BaseAvecMenu
    constructor() {

    }
    add() {
        this.base.op = "+"
        this.compute()

    }
    mul() {
        this.base.op = "*"
        this.compute()

    }
    sub() {
        this.base.op = "-"
        this.compute()

    }
    div() {
        this.base.op = "/"
        this.compute()
    }
    compute() {
        this.base.compute()
        this.base.mennu = undefined
    }
}
defineVue(MenuOp, {
    kind: 'flow',
    orientation: "column",
    gap: 10,
    children: [
        {
            kind: 'staticButton',
            label: '+',
            action: "add",
            width: "100%"
        },
        {
            kind: 'staticButton',
            label: '*',
            action: "mul",
            width: "100%"
        },
        {
            kind: 'space',
            height: 10
        },
        {
            kind: 'staticButton',
            label: '/',
            action: "div",
            width: "100%"
        },
        {
            kind: 'staticButton',
            label: '-',
            action: "sub",
            width: "100%"
        }
    ]
})
export class BaseAvecMenu extends Base {
    mennu?: MenuOp
    constructor() {
        super()
    }
    initMenu() {
        this.mennu = new MenuOp()
        this.mennu.base = this
    }

}

defineVue(BaseAvecMenu, {
    kind: "flow",
    orientation: "column",
    gap: 10,
    children: [
        {
            kind: "flow",
            orientation: "row",

            gap: 10,
            children: [

                { kind: "input", name: "a", width: '50%', inputType: "number" },
                { kind: "input", name: "b", width: '50%', inputType: "number" }
            ]

        },
        { kind: "label", name: "r", height: 30 },
        { kind: "menu", label: "Calculer", name: "mennu", action: "initMenu" }
    ]
})