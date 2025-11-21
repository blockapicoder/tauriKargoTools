import { AfficherImage, App, AppPersonMoral, AppPersonPhysique, AppTree, ButtonPanel, DialogOwner, Panel, Tree, TreeMenu } from "./test-model"
import { } from "./test-table"
import { defineVue, boot } from "../vue";

// ---- Montage UI ----
defineVue(AppPersonPhysique, (uiPerson) => {

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
                uiPerson.staticButton({ label: "➕ Ajouter", action: "add", muted: false });
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


defineVue(AppPersonMoral, (uiPersonMoral) => {
    uiPersonMoral.flow({ orientation: "column", gap: 16 }, () => {
        uiPersonMoral.flow({ orientation: "row", gap: 24, align: "start", justify: "start" }, () => {
            // Côté gauche : ligne d'inputs (nom, prénom, âge, sexe)
            uiPersonMoral.flow({ orientation: "column", gap: 8, align: "start" }, () => {
                uiPersonMoral.input({ name: "editingNom", update: "applyEdit", label: "Nom" });

                uiPersonMoral.input({ name: "editingAge", update: "applyEdit", label: "Âge", inputType: "number" });

            });

            // Côté droit : bouton ajout + liste des personnes
            uiPersonMoral.flow({ orientation: "column", gap: 8, align: "start" }, () => {
                uiPersonMoral.staticButton({ label: "➕ Ajouter", action: "add", muted: false });
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


defineVue(App, (uiApp) => {
    uiApp.flow({ orientation: "column", gap: 10 }, () => {
        uiApp.select({
            list: "applis",
            selection: "idxApp",
            displayMethod: "showApp",
            update: "changeApp",
            mode: "dropdown"
        })
        uiApp.vue({ name: "appli" }),
            uiApp.staticButton({ action: "close", label: "Close" })
    })
})



defineVue(DialogOwner, (uiDialog) => {

    uiDialog.flow({ orientation: "column" }, () => {
        uiDialog.flow({ orientation: "row", gap: 20, align: "center", justify: "center" }, () => {
            uiDialog.dialog({ name: "app", label: 'Personne', action: "initDialogue", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appTable", label: 'Table', action: "initDialogueAppTable", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appImage", label: 'Image', action: "initDialogueAfficherImage", buttonWidth: "20%", width: "50%" })
            uiDialog.dialog({ name: "appTree", label: 'Tree', action: "initTree", buttonWidth: "20%", width: "50%" })

            uiDialog.button({ label: "label", action: "actionLabel", width: "20%" })
        })
        uiDialog.label("sizeCanvas", { width: "100%" })
        uiDialog.custom({ factory: "createCanvas", init: "initCanvas", width: "100%", height: "100%" })

    })

}, { init: "initVue" })
defineVue(AfficherImage, (ui) => {
    ui.flow({ orientation: "column", gap: 10, height: "100%", width: "100%", align: "center" }, () => {
        ui.flow({ orientation: "row", gap: 5, width: "100%" }, () => {
            ui.staticButton({ action: "chat", label: "Chat", width: "50%" })
            ui.staticButton({ action: "chien", label: "Chien", width: "50%" })
        })
        ui.img({ url: "urlImage", width: "50%", height: 500 })
        ui.staticButton({ action: "close", label: "Close", width: "100%" });

    })
})
defineVue(AppTree, (ui) => {
    ui.flow({ orientation: "column", gap: 5 }, () => {
        ui.vue({ name: "tree" })
        ui.staticButton({ action: "close", label: "Close" })
    })
})
defineVue(TreeMenu, (ui) => {
    ui.flow({ orientation: "column", gap: 5, style: { margin: "5px" } }, () => {
        ui.staticButton({ action: "add", label: "Add" })
        ui.staticButton({ action: "remove", label: "Remove" })
    })
})
defineVue(Tree, (ui) => {

    ui.flow({ orientation: "row", gap: 5 }, () => {
        ui.button({ action: "toggle", label: "labelToggle", type: "img", height: 64, width: 64 ,visible:"showToggle",useVisibility:true})
        ui.flow({ orientation: "column"}, () => {
            ui.flow({ orientation: "row", gap: 5 ,style:{ marginBottom:'8px'} }, () => {

                ui.menu({ name: "treeMenu", label: "./src/test/edit-2-line.png", action: "menu", type: "img", buttonHeight: 64, buttonWidth: 64 })
                ui.input({ name: "value", width: 300 })
            })
            ui.listOfVue({
                orientation: "column",
                list: "children",
                visible: "show",
                gap: 5,

                wrap: false
            })
        })
    })

})
defineVue(ButtonPanel, (ui) => {

    ui.button({ label: "name", action: "select", enable: "enable", width: "100%" })

})
defineVue(Panel, (ui) => {
    ui.flow({ orientation: "column", width: "100%", gap: 10 }, () => {
        ui.listOfVue({
            orientation: "row", list: "buttons", gap: 5, wrap: true
        })
        ui.vue({ name: "elementPanel", width: "100%" })


    })
})

boot(new Panel())

