/* builder.ts
 * - Construit le DOM à partir de l'UI déclarative (ui.ts).
 * - Gère listeners, visible/enable, sous-UI, listes, dialogs et menus.
 * - Appelle Custom.init **après** reconstruction complète de l'interface concernée.
 */

import { buildBootVue, buildStaticBootVue } from "./builder/boot-vue";
import { buildButton, buildStaticButton } from "./builder/button";
import { buildCustom } from "./builder/custom";
import { buildDialog } from "./builder/dialog";
import { buildFlow } from "./builder/flow";
import { buildImg } from "./builder/img";
import { buildInput } from "./builder/input";
import { buildLabel, buildStaticLabel } from "./builder/label";
import { buildListOfVue } from "./builder/list-of-vue";
import { buildMenu } from "./builder/menu";
import { buildSelect } from "./builder/select";
import { buildSpace } from "./builder/space";
import { buildSingleVue } from "./builder/vue";
import { Listener, Unlisten } from "./listener";
import { getListener } from "./listener-factory";
import { BootVueNode, StaticBootVueNode } from "./model/boot-vue";
import { ButtonNode, StaticButtonNode } from "./model/button";
import { CustomNode } from "./model/custom";
import { DialogNode } from "./model/dialog";
import { FlowNode } from "./model/flow";
import { ImgNode } from "./model/img";
import { InputNode } from "./model/input";
import { LabelNode, StaticLabelNode } from "./model/label";
import { ListVueNode } from "./model/list-of-vue";
import { MenuNode } from "./model/menu";
import { SelectNode } from "./model/select";
import { Space } from "./model/space";
import { SingleVueNode } from "./model/vue";
import {
    Vue, UINode

} from "./vue-model";

/* ===================== Runtime result ===================== */
export type VueRuntime<T extends object> = {
    listener: Listener<T>;
    elements: HTMLElement[];
    stop(): void;
};

/* ===================== Helpers DOM ===================== */
export function applySize(el: HTMLElement, width?: number | string, height?: number | string) {
    if (width !== undefined) el.style.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) el.style.height = typeof height === 'number' ? `${height}px` : height;
}
export function setVisible(el: HTMLElement, v: boolean, useVisibility: boolean) {
    if (useVisibility) {
        el.style.visibility = v ? "" : "hidden";
        return;
    }
    el.style.display = v ? "" : "none";
}
export function setEnabled(el: HTMLElement, enabled: boolean) {
    if ("disabled" in el) (el as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled = !enabled;
    else el.setAttribute("aria-disabled", String(!enabled));
}
/** Applique id + class si fournis par le node */
export function applyIdAndClass(el: HTMLElement, node: { id?: string; class?: string | string[] }) {
    if (node.id) el.id = node.id;
    if (node.class) {
        if (Array.isArray(node.class)) {
            el.classList.add(...node.class.filter(Boolean) as string[]);
        } else {
            const parts = node.class.split(/\s+/).filter(Boolean);
            if (parts.length) el.classList.add(...parts);
        }
    }
}
export function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
/** ===================== Factorisation visible/enable ===================== */
export type WithVisible<T> = { visible?: keyof T, useVisibility?: boolean };
export type WithEnable<T> = { enable?: keyof T };

export function bindVisible<T extends object>(node: WithVisible<T>, el: HTMLElement, ctx: Ctx<T>) {
    const key = node.visible as keyof T | undefined;
    if (key == null) return;
    setVisible(el, !!(ctx.obj as any)[key], !!node.useVisibility);
    const off = ctx.listener.listen(key, (v: any) => setVisible(el, !!v, !!node.useVisibility));
    ctx.dataUnsubs.push(off);
}

export function bindEnabled<T extends object>(node: WithEnable<T>, el: HTMLElement, ctx: Ctx<T>) {
    const key = node.enable as keyof T | undefined;
    if (key == null) return;
    setEnabled(el, !!(ctx.obj as any)[key]);
    const off = ctx.listener.listen(key, (v: any) => setEnabled(el, !!v));
    ctx.dataUnsubs.push(off);
}

export function bindVisibleEnabled<T extends object>(
    node: WithVisible<T> & WithEnable<T>,
    el: HTMLElement,
    ctx: Ctx<T>
) {
    bindVisible(node, el, ctx);
    bindEnabled(node, el, ctx);
}

/* ===================== Contexte de build ===================== */
export type Ctx<T extends object> = {
    obj: T;
    listener: Listener<T>;
    add: (el: HTMLElement) => void;
    domUnsubs: Array<() => void>;
    dataUnsubs: Array<Unlisten>;
    /** File d'init à déclencher après append de toute l'UI concernée */
    postInits: Array<() => void>;
};

/* ===================== Builder principal ===================== */
/** Le Builder détient un *registry* d’UIs disponibles pour le dispatch dynamique. */
export class Builder {
    registry: Vue<any>[] = [];
    container!: HTMLElement | null
    constructor() { }
    addUI(ui: Vue<any>) {
        this.registry.push(ui);
    }

    /** Monte `ui` dans `selector`. */
    boot<T extends object>(a: T, selector?: string): VueRuntime<T> {
        if (!selector) {
            document.body.className = "app"
            this.container = document.createElement("div")
            document.body.appendChild(this.container)    
            const link = document.createElement("link")
            link.rel ="stylesheet"
            const scriptUrl = import.meta.url;
            const scriptDir = scriptUrl.substring(0, scriptUrl.lastIndexOf('/') + 1);
            const cssLink= `${scriptDir}css/vue-darkmode.css`
            link.href = cssLink
            document.body.appendChild(link)
        } else {
            this.container = document.querySelector(selector) as HTMLElement | null;
        }
        if (!this.container) throw new Error('Conteneur introuvable : ' + selector);
        this.container.replaceChildren()
        return this.bootInto(this.findVueFor(a)!, a, this.container);
    }
    bootInContainer<T extends object>(a: T, parentQueue?: Array<() => void>): VueRuntime<T> {
        if (!this.container) throw new Error('Conteneur introuvable : ');
        this.container.replaceChildren()
        return this.bootInto(this.findVueFor(a)!, a, this.container, parentQueue);
    }

    /**
     * Monte `ui` dans un conteneur DOM donné.
     * @param parentQueue Si fourni, les inits sont *déférées au parent* (aucun run ici).
     */
    bootInto<T extends object>(ui: Vue<T>, a: T, container: HTMLElement, parentQueue?: Array<() => void>): VueRuntime<T> {
        const listener = getListener(a);
        const elements: HTMLElement[] = [];
        const domUnsubs: Array<() => void> = [];
        const dataUnsubs: Array<Unlisten> = [];
        const postInits: Array<() => void> = parentQueue ?? [];


        const ctx: Ctx<T> = {
            obj: a,
            listener,
            add: (el) => elements.push(el),
            domUnsubs,
            dataUnsubs,
            postInits
        };


        this.buildNodes(ui.getTree(), ctx);
        for (const el of elements) container.appendChild(el);

        // Racine : exécuter les inits maintenant que tout est dans le DOM.
        if (!parentQueue) {
            for (const run of postInits) {
                try { run(); } catch (e) { console.warn('[custom.init] failed:', e); }
            }
            postInits.length = 0;
        }
        const i = ui.init
        if (i) {
            try { (a as any)[i as unknown as string]!(container); }
            catch (e) { console.warn('[custom.init] call failed:', e); }
        }

        return {
            listener,
            elements,
            stop: () => {
                try { /* listener.stop(); */ } catch { }
                for (const u of domUnsubs) { try { u(); } catch { } }
                for (const u of dataUnsubs) { try { u(); } catch { } }
            }
        };
    }

    /* ----------- Dispatch des nœuds ----------- */
    buildNodes<T extends object>(nodes: ReadonlyArray<UINode<T>>, ctx: Ctx<T>) {
        for (const node of nodes) {
            switch (node.kind) {
                case 'input': buildInput(this, node as InputNode<T, any>, ctx); break;
                case 'staticButton': buildStaticButton(this, node as StaticButtonNode<T>, ctx); break;
                case 'button': buildButton(this, node as ButtonNode<T, any>, ctx); break;
                case 'img': buildImg(this, node as ImgNode<T, any>, ctx); break;
                case 'select': buildSelect(this, node as SelectNode<T, any, any, any, any>, ctx); break;
                case 'label': buildLabel(this, node as LabelNode<T, any>, ctx); break;
                case 'staticLabel': buildStaticLabel(this, node as StaticLabelNode<T>, ctx); break;
                case 'flow': buildFlow(this, node as FlowNode<T>, ctx); break;
                case 'singleVue': buildSingleVue(this, node as SingleVueNode<T>, ctx); break;
                case 'listOfVue': buildListOfVue(this, node as ListVueNode<T>, ctx); break;
                case 'dialog': buildDialog(this, node as DialogNode<T>, ctx); break;
                case 'menu': buildMenu(this, node as MenuNode<T>, ctx); break;
                case 'custom': buildCustom(this, node as CustomNode<T, any, any>, ctx); break;
                case "bootVue": buildBootVue(this, node as BootVueNode<T, any>, ctx); break;
                case 'staticBootVue': buildStaticBootVue(this, node as StaticBootVueNode<T>, ctx); break;
                case "space": buildSpace(this, node as Space, ctx);
            }
        }
    }

    /* ===================== Sous-UI lookup via registry ===================== */
    findVueFor<T extends object>(value: any): Vue<T> | undefined {
        if (!value || typeof value !== "object") return undefined;
        return this.findVueForConstructor(value.constructor)

    }

    findVueForConstructor<T extends object>(c: new (...args: any[]) => T): Vue<T> | undefined {
        const r = this.registry.find((u: Vue<any>) => c === u.getTargetClass());
        if (r) {
            return r
        }
        const s = Object.getPrototypeOf(c)
        if (s) {
            return this.findVueForConstructor(s)
        }
        return undefined

    }


    /* ---- Helper rendu du bouton trigger (Dialog/Menu) selon node.type ---- */
    renderTrigger(btn: HTMLButtonElement, label: string, type?: 'html' | 'img') {
        if (!type) {
            if (btn.innerHTML !== '') btn.innerHTML = '';
            if (btn.textContent !== label) btn.textContent = label;
            return;
        }
        if (type === 'html') {
            if (btn.innerHTML !== label) btn.innerHTML = label; // HTML de confiance
            return;
        }
        // type === 'img'
        btn.innerHTML = '';
        const img = document.createElement('img');
        if (label) img.setAttribute('src', label); // label = URL
        img.alt = '';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.pointerEvents = 'none';
        btn.appendChild(img);
    }

}
