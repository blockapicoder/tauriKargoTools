import { Vue } from "./src/vue-model";
import { AppTable, Personne } from "./test-model";
import { defineVue } from "./src/vue";


// --- UIs (en t’appuyant sur ta classe UI avec .flow/.listUI/.input/.button) ---



defineVue(Personne, (PersonRowUI) => {
    PersonRowUI.flow({ orientation: "row", gap: 12, align: "center", justify: "start" ,class:"marge"}, () => {
        // Case à cocher
        // PersonRowUI.input({ name: "selected", update: "update", inputType: "checkbox" });

        // Colonnes éditables
        PersonRowUI.input({ name: "nom", update: "update", width: 200 });
        PersonRowUI.input({ name: "prenom", update: "update", width: 200 });
        PersonRowUI.input({ name: "age", update: "update", width: 200, inputType: "number" });

        // Action supprimer (sur la ligne)
        PersonRowUI.staticButton({ label: "Supprimer", action: "deleteSelf" });
    });
})
// UI principale (liste + bouton ajouter)

defineVue(AppTable, (AppUI) => {
    AppUI.flow({ orientation: "column", gap: 16, align: "center", justify: "start" }, () => {
        // Ligne d'actions (bouton Ajouter)
        AppUI.flow({ orientation: "row", gap: 8, align: "center" }, () => {
            AppUI.staticButton({ label: "Ajouter", action: "addPerson" });
        });
        AppUI.flow({ orientation: "row", gap: 12, align: "center", justify: "start" }, () => {
            AppUI.label("colNom", { width: 200 })
            AppUI.label("colPrenom", { width: 200 })
            AppUI.label("colAge", { width: 200 })
        });
        // Liste des personnes : une sous-UI PersonRowUI par élément
        AppUI.listOfVue({
            list: "persons",
            orientation: "column",
            gap: 10,
           // align: "stretch",
            justify: "start",
            class:"cadre"
        });
        AppUI.staticButton({ label: "Close", action: "close" })
    });
})

