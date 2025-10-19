import { UI } from "./dist/ui";

// --- Modèle ---
class App {
    persons: Personne[] = [];
    colNom = "Nom"
    colPrenom = "Prenom"
    colAge = "Age"
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
}

class Personne {
    selected = false;
    nom = "";
    prenom = "";
    age = 0;


    constructor(public app: App) { }

    // Appelée par les inputs (peut rester vide)
    update() { }

    // Appelée par le bouton supprimer (sur la ligne)
    deleteSelf() {
        this.app.removePerson(this);
    }
}

// --- UIs (en t’appuyant sur ta classe UI avec .flow/.listUI/.input/.button) ---

// UI d'une ligne Personne (une "row" = une personne)
const PersonRowUI = new UI(Personne);
PersonRowUI.flow({ orientation: "row", gap: 12, align: "center", justify: "start" }, () => {
    // Case à cocher
    // PersonRowUI.input({ name: "selected", update: "update", inputType: "checkbox" });

    // Colonnes éditables
    PersonRowUI.input({ name: "nom", update: "update",  width:200});
    PersonRowUI.input({ name: "prenom", update: "update",  width:200 });
    PersonRowUI.input({ name: "age", update: "update", width:200, inputType: "number" });

    // Action supprimer (sur la ligne)
    PersonRowUI.button({ label: "Supprimer", action: "deleteSelf" });
});

// UI principale (liste + bouton ajouter)
const AppUI = new UI(App);
AppUI.flow({ orientation: "column", gap: 16, align: "center", justify: "start" }, () => {
    // Ligne d'actions (bouton Ajouter)
    AppUI.flow({ orientation: "row", gap: 8, align: "center" }, () => {
        AppUI.button({ label: "Ajouter", action: "addPerson" });
    });
    AppUI.flow({ orientation: "row", gap: 12,  align: "center", justify: "start" }, () => {
        AppUI.label("colNom",{ width:200})
        AppUI.label("colPrenom",{ width:200})
        AppUI.label("colAge",{ width:200})
    });
    // Liste des personnes : une sous-UI PersonRowUI par élément
    AppUI.listUI({
        list: "persons",
        listUI: [PersonRowUI],
        orientation: "column",
        gap: 10,
        align: "stretch",
        justify: "start",
    });
});

// --- Montage ---
const app = new App();
AppUI.boot(app, "#app");
/*
HTML:
<div id="app"></div>
*/
