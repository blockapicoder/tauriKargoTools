import { AfficherImage, App, AppPersonMoral, AppPersonPhysique, AppTree, ButtonPanel, DialogOwner, ElementPanel, Panel, Tree, TreeMenu } from "./test-model"
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

    uiDialog.flow({ orientation: "column" }, () => {
        uiDialog.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
            uiDialog.dialog({ name: "app", label: 'Personne', action: "initDialogue", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appTable", label: 'Table', action: "initDialogueAppTable", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appImage", label: 'Image', action: "initDialogueAfficherImage", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appTree", label: 'Tree', action: "initTree", buttonWidth: "20%", width: "50%" })

            uiDialog.buttonLabel({ label: "label", action: "actionLabel", width: "20%" })
        })
        uiDialog.label("sizeCanvas", { width: "100%" })
        uiDialog.custom({ factory: "createCanvas", init: "initCanvas", width: "100%", height: "100%" })

    })

})
defineUI(AfficherImage, (ui) => {
    ui.flow({ orientation: "column", gap: 10, height: "100%",width:"100%" ,align:"center"}, () => {
        ui.flow({ orientation: "row", gap: 5,width:"100%" }, () => {
            ui.button({ action: "chat", label: "Chat",width:"50%" })
            ui.button({ action: "chien", label: "Chien",width:"50%"})
        })
        ui.img({ url: "urlImage", width: "50%", height: 500})
        ui.button({ action: "close", label: "Close", width: "100%" });

    })
})
defineUI(AppTree, (ui) => {
    ui.flow({ orientation: "column", gap: 5 }, () => {
        ui.ui({ name: "tree" })
        ui.button({ action: "close", label: "Close" })
    })
})
defineUI(TreeMenu, (ui) => {
    ui.flow({ orientation: "column", gap: 5, style: { margin: "5px" } }, () => {
        ui.button({ action: "add", label: "Add" })
        ui.button({ action: "remove", label: "Remove" })
    })
})
defineUI(Tree, (ui) => {

    ui.flow({ orientation: "row", gap: 5 }, () => {
        ui.buttonLabel({ action: "toggle", label: "labelToggle", type: "img", height: 64, width: 64 })
        ui.flow({ orientation: "column", gap: 5 }, () => {
            ui.flow({ orientation: "row", gap: 5 }, () => {

                ui.menu({ name: "treeMenu", label: "./edit-2-line.png", action: "menu", type: "img", buttonHeight: 64, buttonWidth: 64 })
                ui.input({ name: "value" })
            })
            ui.listUI({
                orientation: "column",
                list: "childrenVisible",
                gap: 5
            })
        })
    })

})
defineUI(ButtonPanel, (ui) => {
    ui.flow({ orientation: "row" }, () => {
        ui.buttonLabel({ label: "name", action: "select", width: "100%" ,enable:"enable"})
    })
})
defineUI(Panel, (ui) => {
    ui.flow({ orientation: "column", width: "100%", gap: 10 }, () => {
        ui.listUI({ orientation: "row", list: "buttons", gap: 5, class: "container" })
        ui.ui({ name: "elementPanel", width: "100%" })


    })
})
const app = new App();
const dialog = new DialogOwner()
boot(new Panel(), "#app")
//uiApp.boot(app, "#app"); // <div id="app"></div>
