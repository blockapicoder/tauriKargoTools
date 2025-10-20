import { App, AppPersonMoral, AppPersonPhysique, DialogOwner } from "./test-model"
import { } from "./test-table"
import { defineUI, boot } from "./dist/ui";

// ---- Montage UI ----
defineUI(AppPersonPhysique, (uiPerson) => {

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
})


defineUI(AppPersonMoral, (uiPersonMoral) => {
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
})


defineUI(App, (uiApp) => {
    uiApp.flow({ orientation: "column", gap: 10 }, () => {
        uiApp.select({
            list: "applis",
            selection: "idxApp",
            displayMethod: "showApp",
            update: "changeApp",
            mode: "dropdown"
        })
        uiApp.ui({ name: "appli" }),
            uiApp.button({ action: "close", label: "Close" })
    })
})



defineUI(DialogOwner, (uiDialog) => {
    uiDialog.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
        uiDialog.dialog({ name: "app", label: 'Open', action: "initDialogue", buttonWidth: "50%", width: "50%" })
        uiDialog.dialog({ name: "appTable", label: 'Open', action: "initDialogueAppTable", buttonWidth: "50%", width: "50%" })
    })
})
const app = new App();
const dialog = new DialogOwner()
boot(dialog, "#app")
//uiApp.boot(app, "#app"); // <div id="app"></div>
