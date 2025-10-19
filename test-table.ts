import { UI } from "./dist/ui-model";
import { boot } from "./dist/ui-builder"
import { AppTable, Personne } from "./test-model";


// --- UIs (en t’appuyant sur ta classe UI avec .flow/.listUI/.input/.button) ---

// UI d'une ligne Personne (une "row" = une personne)
export const PersonRowUI = new UI(Personne);
PersonRowUI.flow({ orientation: "row", gap: 12, align: "center", justify: "start" }, () => {
    // Case à cocher
    // PersonRowUI.input({ name: "selected", update: "update", inputType: "checkbox" });

    // Colonnes éditables
    PersonRowUI.input({ name: "nom", update: "update", width: 200 });
    PersonRowUI.input({ name: "prenom", update: "update", width: 200 });
    PersonRowUI.input({ name: "age", update: "update", width: 200, inputType: "number" });

    // Action supprimer (sur la ligne)
    PersonRowUI.button({ label: "Supprimer", action: "deleteSelf" });
});

// UI principale (liste + bouton ajouter)
export const AppUI = new UI(AppTable);
AppUI.flow({ orientation: "column", gap: 16, align: "center", justify: "start" }, () => {
    // Ligne d'actions (bouton Ajouter)
    AppUI.flow({ orientation: "row", gap: 8, align: "center" }, () => {
        AppUI.button({ label: "Ajouter", action: "addPerson" });
    });
    AppUI.flow({ orientation: "row", gap: 12, align: "center", justify: "start" }, () => {
        AppUI.label("colNom", { width: 200 })
        AppUI.label("colPrenom", { width: 200 })
        AppUI.label("colAge", { width: 200 })
    });
    // Liste des personnes : une sous-UI PersonRowUI par élément
    AppUI.listUI({
        list: "persons",
        orientation: "column",
        gap: 10,
        align: "stretch",
        justify: "start",
    });
    AppUI.button({ label: "Close", action: "close" })
});

// --- Montage ---
const app = new AppTable();
//boot(AppUI,app, "#app");
/*
HTML:
<div id="app"></div>
*/
