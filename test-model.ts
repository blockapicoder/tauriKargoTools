
type Sexe = "Homme" | "Femme";
type Person = { nom: string; prenom: string; age: number; sexe: Sexe };
type PersonMoral = { nom: string; age: number; };
class AppPerson {

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

}