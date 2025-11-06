// ./builder/boot-vue.ts
import { BootVueNode, StaticBootVueNode } from "../model/boot-vue";
import {
    Builder,
    Ctx,
    applyIdAndClass,
    applySize,
    bindVisible,
    bindEnabled,
} from "../vue-builder";
import {

    Vue,
} from "../vue-model";

/**
 * BootVue — bouton avec label dynamique (KeysOfType<T,string>) qui,
 * au clic, exécute `action()` puis monte la Vue de `name` dans un conteneur local.
 */
export function buildBootVue<T extends object>(
    b: Builder,
    node: BootVueNode<T, any, any, any>,
    ctx: Ctx<T>
) {
    // wrapper racine du node



    // bouton + conteneur d'accueil de la sous-UI
    const btn = document.createElement("button");
    applyIdAndClass(btn, node);


    // taille appliquée au bouton (cohérent avec ButtonNode)
    applySize(btn, node.width, node.height);

    // visible sur le wrapper, enable sur le bouton
    bindVisible(node as any, btn, ctx);
    bindEnabled(node as any, btn, ctx);

    // rendu du label dynamique
    const labelKey = node.label as keyof T;
    const render = (val: any) => b.renderTrigger(btn, String(val ?? ""), node.type);
    render((ctx.obj as any)[labelKey]);

    // écoute des changements du label
    const offLabel = ctx.listener.listen(labelKey, (v: any) => render(v));
    ctx.dataUnsubs.push(offLabel);

    // logique de boot (montage/cleanup de la sous-UI)
    let subStop: (() => void) | undefined;

    const onClick = () => {
        // 1) action()
        try {
            const fn = (ctx.obj as any)[node.factory];
            if (typeof fn !== "function") return;

            const child = fn.call(ctx.obj);

            if (!child) return;
            for (const u of ctx.domUnsubs) { try { u(); } catch { } }
            for (const u of ctx.dataUnsubs) { try { u(); } catch { } }
            b.bootInContainer(child)

            // cleanup précédent
            try { subStop?.(); } catch { }
        } catch (e) {
            console.warn("[bootVue.action] failed:", e);
        }
    };

    btn.addEventListener("click", onClick);
    ctx.domUnsubs.push(() => btn.removeEventListener("click", onClick));
    ctx.domUnsubs.push(() => { try { subStop?.(); } catch { } });


    ctx.add(btn);
}

/**
 * StaticBootVue — bouton avec label fixe (string) qui,
 * au clic, exécute `action()` puis monte la Vue de `name` dans un conteneur local.
 */
export function buildStaticBootVue<T extends object>(
    b: Builder,
    node: StaticBootVueNode<T, any, any>,
    ctx: Ctx<T>
) {
    // wrapper racine du node



    // bouton + conteneur d'accueil de la sous-UI
    const btn = document.createElement("button");
    applyIdAndClass(btn, node);

    // taille appliquée au bouton
    applySize(btn, node.width, node.height);

    // visible sur le wrapper, enable sur le bouton
    bindVisible(node as any, btn, ctx);
    bindEnabled(node as any, btn, ctx);

    // rendu du label fixe (texte / html / img)
    b.renderTrigger(btn, node.label, node.type);

    // logique de boot (montage/cleanup de la sous-UI)
    let subStop: (() => void) | undefined;

    const onClick = () => {
        // 1) action()
        try {
            const fn = (ctx.obj as any)[node.factory];
            if (typeof fn !== "function") return;
            const child = fn.call(ctx.obj);
            if (!child) return;
            for (const u of ctx.domUnsubs) { try { u(); } catch { } }
            for (const u of ctx.dataUnsubs) { try { u(); } catch { } }
            b.bootInContainer(child)

            // cleanup précédent
            try { subStop?.(); } catch { }
        } catch (e) {
            console.warn("[staticBootVue.action] failed:", e);
        }
    };

    btn.addEventListener("click", onClick);
    ctx.domUnsubs.push(() => btn.removeEventListener("click", onClick));
    ctx.domUnsubs.push(() => { try { subStop?.(); } catch { } });



    ctx.add(btn);
}
