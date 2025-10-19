import { App, AppPersonMoral, AppPersonPhysique } from "./test-model"
import { UI } from "./dist/ui";

// ---- Montage UI ----

const uiPerson = new UI(AppPersonPhysique);




uiPerson.flow({ orientation: "column", gap: 16 }, () => {
    uiPerson.flow({ orientation: "row", gap: 24, align: "start", justify: "start" }, () => {
        // Côté gauche : ligne d'inputs (nom, prénom, âge, sexe)
        uiPerson.flow({ orientation: "column", gap: 8, align: "start" }, () => {
            uiPerson.input({ name: "editingNom", update: "applyEdit", label: "Nom" });
            uiPerson.input({ name: "editingPrenom", update: "applyEdit", label: "Prénom" });
            uiPerson.input({ name: "editingAge", update: "applyEdit", label: "Âge", inputType: "number" });
            uiPerson.select({
                list: "sexes",
                displayMethod: "displaySex",
                selection: "sexSelection",
                update: "onSexChange",
                mode: "dropdown"
            });
        });

        // Côté droit : bouton ajout + liste des personnes
        uiPerson.flow({ orientation: "column", gap: 8, align: "start" }, () => {
            uiPerson.button({ label: "➕ Ajouter", action: "add", muted: false });
            uiPerson.select({
                list: "people",
                displayMethod: "formatPerson",
                selection: "selected",
                update: "onSelectedChange",
                mode: "list"
            });
        });
    });
});
const uiPersonMoral = new UI(AppPersonMoral);


uiPersonMoral.flow({ orientation: "column", gap: 16 }, () => {
    uiPersonMoral.flow({ orientation: "row", gap: 24, align: "start", justify: "start" }, () => {
        // Côté gauche : ligne d'inputs (nom, prénom, âge, sexe)
        uiPersonMoral.flow({ orientation: "column", gap: 8, align: "start" }, () => {
            uiPersonMoral.input({ name: "editingNom", update: "applyEdit", label: "Nom" });

            uiPersonMoral.input({ name: "editingAge", update: "applyEdit", label: "Âge", inputType: "number" });

        });

        // Côté droit : bouton ajout + liste des personnes
        uiPersonMoral.flow({ orientation: "column", gap: 8, align: "start" }, () => {
            uiPersonMoral.button({ label: "➕ Ajouter", action: "add", muted: false });
            uiPersonMoral.select({
                list: "people",
                displayMethod: "formatPerson",
                selection: "selected",
                update: "onSelectedChange",
                mode: "list"
            });
        });
    });
});


const uiApp = new UI(App)
uiApp.flow({ orientation: "column" }, () => {
    uiApp.select({
        list: "applis",
        selection: "idxApp",
        displayMethod: "showApp",
        update: "changeApp",
        mode: "dropdown"
    })
    uiApp.ui({ listUI: [uiPersonMoral, uiPerson], name: "appli" })
})
const app = new App();
uiApp.boot(app, "#app"); // <div id="app"></div>
