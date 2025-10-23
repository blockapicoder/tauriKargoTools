

type Sexe = "Homme" | "Femme";
type Person = { nom: string; prenom: string; age: number; sexe: Sexe };
type PersonMoral = { nom: string; age: number; };
class AppPerson {

}

// --- Modèle ---
export class AppTable {
    persons: Personne[] = [];
    colNom = "Nom"
    colPrenom = "Prenom"
    colAge = "Age"
    dialogOwner!: DialogOwner
    constructor() {
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
export class App {
    applis: AppPerson[] = []
    appli: AppPerson | undefined
    idxApp: number[] = []
    dialogOwner!: DialogOwner
    constructor() {
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
export class AppTree {
    tree: Tree
    owner: DialogOwner | undefined

    constructor() {
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
        this.tree.labelToggle = "+"
        this.tree.childrenVisible = [...this.tree.children]
        this.tree.treeMenu = undefined

    }
    remove() {
        if (this.tree.parent) {
            this.tree.parent.children = this.tree.parent.children.filter((t) => t !== this.tree)
            if (this.tree.parent.childrenVisible) {
                this.tree.parent.childrenVisible = this.tree.parent.children
            }
        }
        this.tree.treeMenu = undefined

    }

}
export class Tree {
    childrenVisible: Tree[] = []
    children: Tree[] = []
    value: string = ""
    parent: Tree | undefined
    treeMenu: TreeMenu | undefined

    labelToggle = "-"


    toggle() {
        if (this.labelToggle === "-") {
            this.childrenVisible = this.children
            this.labelToggle = "+"
        } else {
            this.childrenVisible = []
            this.labelToggle = "-"
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

    }
}
export class AfficherImage {
    urlImage = "./chat.png"
    owner!: DialogOwner

    chat() {
        this.urlImage = "./chat.png"

    }
    chien() {
        this.urlImage = "./chien.png"
    }
    close() {
        if (this.owner) {
            this.owner.appImage = undefined
        }
    }

}