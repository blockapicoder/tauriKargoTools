import { ElementPanel } from "./test-model-panel";
import { Base, BaseAvecLog, BaseAvecMenu } from "./test-polymorphe";


type Sexe = "Homme" | "Femme";
type Person = { nom: string; prenom: string; age: number; sexe: Sexe };
type PersonMoral = { nom: string; age: number; };

class AppPerson {

}

// --- Modèle ---
export class AppTable extends ElementPanel {
    persons: Personne[] = [];
    colNom = "Nom"
    colPrenom = "Prenom"
    colAge = "Age"
    dialogOwner!: DialogOwner
    constructor() {
        super()
        // une ligne de départ
        this.addPerson();
    }

    addPerson() {
        this.persons = [...this.persons, new Personne(this)];
    }

    removePerson(p: Personne) {
        this.persons = this.persons.filter(x => x !== p);
    }
    close() {
        if (this.dialogOwner) {
            this.dialogOwner.appTable = undefined
        }
    }
}

export class Personne {
    selected = false;
    nom = "";
    prenom = "";
    age = 0;


    constructor(public app: AppTable) { }

    // Appelée par les inputs (peut rester vide)
    update() { }

    // Appelée par le bouton supprimer (sur la ligne)
    deleteSelf() {
        this.app.removePerson(this);
    }
}
export class AppPersonMoral extends AppPerson {
    // Données
    people: PersonMoral[] = [
        { nom: "Dupont", age: 32 },
        { nom: "Martin", age: 28 },
    ];
    selected: number[] = [0]; // index sélectionné (0..n-1)

    // Édition du person sélectionné
    editingNom = "";

    editingAge = 0;



    constructor() {
        super()
        // Charger l'état d'édition initial depuis le premier élément
        this.onSelectedChange();
    }

    // ---- Méthodes utilisées par l'UI ----

    // Affichage d'une personne dans la liste
    formatPerson(p: PersonMoral): string {
        return `${p.nom}  (${p.age}) `;
    }

    // Affichage d’un item "sexe"


    // Quand on change la sélection de personne (dans la liste)
    onSelectedChange(): void {
        if (this.selected.length === 0) {
            this.editingNom = ""
            return
        }
        const i = this.selected[0];
        if (i == null || i < 0 || i >= this.people.length) return;
        const p = this.people[i];
        this.editingNom = p.nom;

        this.editingAge = p.age;



    }

    // Applique les champs d’édition sur l’élément sélectionné
    applyEdit(): void {
        const i = this.selected[0];
        if (i == null || i < 0 || i >= this.people.length) return;
        const copy = this.people.slice();
        copy[i] = {
            nom: this.editingNom,

            age: Number.isFinite(this.editingAge) ? this.editingAge : 0,

        };
        this.people = copy; // réassignation -> déclenche la mise à jour de la liste
    }



    // Ajoute une nouvelle personne
    add(): void {
        const n: PersonMoral = {
            nom: this.editingNom || "Nom",

            age: Number.isFinite(this.editingAge) ? this.editingAge : 0,

        };
        this.people = [...this.people, n];
        this.selected = [this.people.length - 1];
        this.onSelectedChange();
    }
}

export class AppPersonPhysique extends AppPerson {
    // Données
    people: Person[] = [
        { nom: "Dupont", prenom: "Jean", age: 32, sexe: "Homme" },
        { nom: "Martin", prenom: "Claire", age: 28, sexe: "Femme" },
    ];
    selected: number[] = [0]; // index sélectionné (0..n-1)

    // Édition du person sélectionné
    editingNom = "";
    editingPrenom = "";
    editingAge = 0;
    editingSexe: Sexe = "Homme";

    // Pour le select "sexe"
    sexes: string[] = ["Homme", "Femme"];
    sexSelection: number[] = [0];

    constructor() {
        super()
        // Charger l'état d'édition initial depuis le premier élément
        this.onSelectedChange();
    }

    // ---- Méthodes utilisées par l'UI ----

    // Affichage d'une personne dans la liste
    formatPerson(p: Person): string {
        return `${p.nom} ${p.prenom} (${p.age}) - ${p.sexe}`;
    }

    // Affichage d’un item "sexe"
    displaySex(s: string): string { return s; }

    // Quand on change la sélection de personne (dans la liste)
    onSelectedChange(): void {
        if (this.selected.length === 0) {
            this.editingNom = ""
            return
        }
        const i = this.selected[0];
        if (i == null || i < 0 || i >= this.people.length) return;
        const p = this.people[i];
        this.editingNom = p.nom;
        this.editingPrenom = p.prenom;
        this.editingAge = p.age;
        this.editingSexe = p.sexe;
        const idx = this.sexes.indexOf(p.sexe);
        this.sexSelection = [idx >= 0 ? idx : 0];
    }

    // Applique les champs d’édition sur l’élément sélectionné
    applyEdit(): void {
        const i = this.selected[0];
        if (i == null || i < 0 || i >= this.people.length) return;
        const copy = this.people.slice();
        copy[i] = {
            nom: this.editingNom,
            prenom: this.editingPrenom,
            age: Number.isFinite(this.editingAge) ? this.editingAge : 0,
            sexe: this.editingSexe,
        };
        this.people = copy; // réassignation -> déclenche la mise à jour de la liste
    }

    // Quand le select "sexe" change
    onSexChange(): void {
        const idx = this.sexSelection[0];
        this.editingSexe = (this.sexes[idx] as Sexe) ?? "Homme";
        this.applyEdit();
    }

    // Ajoute une nouvelle personne
    add(): void {
        const n: Person = {
            nom: this.editingNom || "Nom",
            prenom: this.editingPrenom || "Prénom",
            age: Number.isFinite(this.editingAge) ? this.editingAge : 0,
            sexe: this.editingSexe,
        };
        this.people = [...this.people, n];
        this.selected = [this.people.length - 1];
        this.onSelectedChange();
    }
}
export class App extends ElementPanel {
    applis: AppPerson[] = []
    appli: AppPerson | undefined
    idxApp: number[] = []
    dialogOwner!: DialogOwner
    constructor() {
        super()
        this.applis = []
        this.applis.push(new AppPersonMoral())
        this.applis.push(new AppPersonPhysique())

    }
    showApp(app: AppPerson): string {
        const idx = this.applis.indexOf(app)
        if (idx === 0) {
            return "Moral"

        }
        if (idx === 1) {
            return "Physique"
        }
        return ""
    }
    changeApp() {
        if (this.idxApp.length === 0) {
            this.appli = undefined
        } else {
            this.appli = this.applis[this.idxApp[0]]
        }
    }
    close() {
        if (this.dialogOwner) {
            this.dialogOwner.app = undefined
        }
    }

}
export class AppTree extends ElementPanel {
    tree: Tree
    owner: DialogOwner | undefined

    constructor() {
        super()
        this.tree = new Tree()
    }
    close() {
        if (this.owner) {
            this.owner.appTree = undefined
        }
    }
}
export class TreeMenu {
    tree!: Tree
    constructor() {

    }
    add() {
        const nb = new Tree()
        nb.parent = this.tree
        this.tree.children.push(nb)
        this.tree.children = [... this.tree.children]
        this.tree.labelToggle = this.tree.open
        this.tree.show = true

        this.tree.treeMenu = undefined
        this.tree.showToggle = true

    }
    remove() {
        if (this.tree.parent) {
            this.tree.parent.children = this.tree.parent.children.filter((t) => t !== this.tree)
            this.tree.parent.showToggle = this.tree.parent.children.length > 0
      
        }
        this.tree.treeMenu = undefined

    }

}
export class Tree {

    children: Tree[] = []
    value: string = ""
    parent: Tree | undefined
    treeMenu: TreeMenu | undefined
    close = "./src/test/folder-add-line.png"
    open = "./src/test/folder-reduce-line.png"
    labelToggle = this.close
    show: boolean = true
    showToggle: boolean = false


    toggle() {
        if (this.labelToggle === this.close) {
          //  this.childrenVisible = this.children
            this.labelToggle = this.open
            this.show = true
        } else {
           // this.childrenVisible = []
            this.labelToggle = this.close
            this.show = false
        }

    }




    menu() {
        const menu = new TreeMenu()
        menu.tree = this
        this.treeMenu = menu
    }


}
export class DialogOwner {
    app: App | undefined
    appTable: AppTable | undefined
    appImage: AfficherImage | undefined
    appTree: AppTree | undefined
    sizeCanvas: string = ""
    canvas!: HTMLCanvasElement
    label: string = "X"
    constructor() {

    }
    actionLabel() {
        this.label = this.label + "X"
    }
    initDialogueAfficherImage() {
        this.appImage = new AfficherImage()
        this.appImage.owner = this
    }
    initTree() {
        this.appTree = new AppTree()
        this.appTree.owner = this

    }
    initDialogue() {
        this.app = new App()
        this.app.dialogOwner = this
    }
    initDialogueAppTable() {
        this.appTable = new AppTable()
        this.appTable.dialogOwner = this
    }
    createCanvas(): HTMLElement {
        this.canvas = document.createElement("canvas")
        const ctx = this.canvas.getContext("2d")
        if (ctx) {
            ctx.fillStyle = "white"
            ctx.clearRect(0, 0, 800, 800)
            ctx.fillStyle = "red"

            ctx.fillRect(0, 0, 800, 800)
        }
        return this.canvas
    }
    initCanvas() {
        window.addEventListener('resize', () => {
            const { width: cssW, height: cssH } = this.canvas.getBoundingClientRect();
            this.sizeCanvas = `${cssW}*${cssH}`
        });
        const { width: cssW, height: cssH } = this.canvas.getBoundingClientRect();
        this.sizeCanvas = `${cssW}*${cssH}`
        console.log("init Canvas")

    }
    initVue(div: HTMLDivElement) {
        console.log("initVue")
        console.log(div.innerHTML)
    }

}
export class AfficherImage extends ElementPanel {
    urlImage = "./src/test/chat.png"
    owner!: DialogOwner

    chat() {
        this.urlImage = "./src/test/chat.png"

    }
    chien() {
        this.urlImage = "./src/test/chien.png"
    }
    close() {
        if (this.owner) {
            this.owner.appImage = undefined
        }
    }

}

export class ButtonPanel {
    name!: string
    elementPanel!: ElementPanel
    panel!: Panel
    idx!: number
    enable: boolean = true
    select() {
        for (const p of this.panel.buttons) {
            p.enable = true
        }
        this.enable = false
        this.panel.elementPanel = this.elementPanel

    }

}
export class Panel {
    buttons: ButtonPanel[] = []
    elementPanel!: ElementPanel
    constructor() {
        let bp = new ButtonPanel()
        bp.elementPanel = new AppTree()
        bp.name = "Tree"
        bp.idx = 0

        this.buttons.push(bp)
        bp = new ButtonPanel()
        bp.elementPanel = new AfficherImage()
        bp.name = "Image"
        bp.idx = 1
        this.buttons.push(bp)
        bp = new ButtonPanel()
        bp.elementPanel = new AppTable()
        bp.name = "Table"
        bp.idx = 2
        this.buttons.push(bp)
        bp = new ButtonPanel()
        bp.elementPanel = new BaseAvecMenu()
        bp.name = "Compute"
        bp.idx = 3
        this.buttons.push(bp)
        for (const b of this.buttons) {
            b.panel = this
        }

    }

}