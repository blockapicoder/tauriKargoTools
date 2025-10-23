/* builder.ts
 * - Construit le DOM à partir de l'UI déclarative (ui.ts).
 * - Gère listeners, visible/enable, sous-UI, listes, dialogs et menus.
 * - Appelle Custom.init **après** reconstruction complète de l'interface concernée.
 */

import { Listener, Unlisten } from "./listener";
import { getListener } from "./listener-factory";
import {
    UI, UINode,
    InputNode, ButtonNode, SelectNode, LabelNode, FlowNode,
    SingleUINode, ListUINode, DialogNode, CustomNode,
    ButtonLabelNode, ImgNode, MenuNode
} from "./ui-model";

/* ===================== Runtime result ===================== */
export type UIRuntime<T extends object> = {
    listener: Listener<T>;
    elements: HTMLElement[];
    stop(): void;
};

/* ===================== Helpers DOM ===================== */
function applySize(el: HTMLElement, width?: number | string, height?: number | string) {
    if (width !== undefined) el.style.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) el.style.height = typeof height === 'number' ? `${height}px` : height;
}
function setVisible(el: HTMLElement, v: boolean) {
    el.style.display = v ? "" : "none";
}
function setEnabled(el: HTMLElement, enabled: boolean) {
    if ("disabled" in el) (el as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled = !enabled;
    else el.setAttribute("aria-disabled", String(!enabled));
}
/** Applique id + class si fournis par le node */
function applyIdAndClass(el: HTMLElement, node: { id?: string; class?: string | string[] }) {
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
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/* ===================== Contexte de build ===================== */
type Ctx<T extends object> = {
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
    registry: UI<any>[] = [];
    constructor() { }
    addUI(ui: UI<any>) {
        this.registry.push(ui);
    }

    /** Monte `ui` dans `selector`. */
    boot<T extends object>(a: T, selector: string): UIRuntime<T> {
        const container = document.querySelector(selector) as HTMLElement | null;
        if (!container) throw new Error('Conteneur introuvable : ' + selector);
        return this.bootInto(this.findUIFor(a)!, a, container);
    }

    /**
     * Monte `ui` dans un conteneur DOM donné.
     * @param parentQueue Si fourni, les inits sont *déférées au parent* (aucun run ici).
     */
    bootInto<T extends object>(ui: UI<T>, a: T, container: HTMLElement, parentQueue?: Array<() => void>): UIRuntime<T> {
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
    private buildNodes<T extends object>(nodes: ReadonlyArray<UINode<T>>, ctx: Ctx<T>) {
        for (const node of nodes) {
            switch (node.kind) {
                case 'input': this.buildInput(node as InputNode<T, any>, ctx); break;
                case 'button': this.buildButton(node as ButtonNode<T>, ctx); break;
                case 'buttonLabel': this.buildButtonLabel(node as ButtonLabelNode<T, any>, ctx); break;
                case 'img': this.buildImg(node as ImgNode<T, any>, ctx); break;
                case 'select': this.buildSelect(node as SelectNode<T, any, any, any, any>, ctx); break;
                case 'label': this.buildLabel(node as LabelNode<T, any>, ctx); break;
                case 'flow': this.buildFlow(node as FlowNode<T>, ctx); break;
                case 'singleUI': this.buildSingleUI(node as SingleUINode<T>, ctx); break;
                case 'listUI': this.buildListUI(node as ListUINode<T>, ctx); break;
                case 'dialog': this.buildDialog(node as DialogNode<T>, ctx); break;
                case 'menu': this.buildMenu(node as MenuNode<T>, ctx); break;
                case 'custom': this.buildCustom(node as CustomNode<T, any, any>, ctx); break;
            }
        }
    }

    /* ===================== Sous-UI lookup via registry ===================== */
    private findUIFor<T extends object>(value: any): UI<T> | undefined {
        if (!value || typeof value !== "object") return undefined;
        return this.registry.find((u: UI<any>) => value instanceof u.getTargetClass());
    }

    /* ----------- Input ----------- */
    private buildInput<T extends object>(node: InputNode<T, any>, ctx: Ctx<T>) {
        const wrapper = document.createElement('label');
        applyIdAndClass(wrapper, node);
        wrapper.style.display = 'block';
        if (node.label) wrapper.append(document.createTextNode(node.label + ' '));

        const input = document.createElement('input');
        applySize(input, node.width, node.height);

        const current = (ctx.obj as any)[node.name];
        const typeGuess =
            node.inputType ??
            (typeof current === 'boolean' ? 'checkbox'
                : typeof current === 'number' ? 'number'
                    : 'text');

        input.type = typeGuess === 'checkbox' ? 'checkbox'
            : typeGuess === 'number' ? 'number'
                : 'text';

        if (typeGuess === 'checkbox') {
            (input as HTMLInputElement).checked = Boolean(current);
        } else if (typeGuess === 'number') {
            (input as HTMLInputElement).valueAsNumber =
                Number.isFinite(Number(current)) ? Number(current) : 0;
        } else {
            (input as HTMLInputElement).value = (current ?? '') as any as string;
        }

        wrapper.appendChild(input);
        ctx.add(wrapper);

        // visible / enable
        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(wrapper, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(wrapper, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(input, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(input, !!v));
            ctx.dataUnsubs.push(off);
        }

        // modèle -> UI
        const offData = ctx.listener.listen(node.name as keyof T, (v) => {
            if (typeGuess === 'checkbox') {
                const nv = Boolean(v);
                if ((input as HTMLInputElement).checked !== nv) (input as HTMLInputElement).checked = nv;
            } else if (typeGuess === 'number') {
                const nv = Number(v ?? 0);
                if ((input as HTMLInputElement).valueAsNumber !== nv) (input as HTMLInputElement).valueAsNumber = nv;
            } else {
                const s = (v as any as string) ?? '';
                if ((input as HTMLInputElement).value !== s) (input as HTMLInputElement).value = s;
            }
        });
        ctx.dataUnsubs.push(offData);

        // UI -> modèle + update
        const onUser = () => {
            const el = input as HTMLInputElement;
            let next: any;
            if (typeGuess === 'checkbox') next = el.checked;
            else if (typeGuess === 'number') next = Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : Number(el.value);
            else next = el.value;

            if (node.muted) {
                ctx.listener.setSilently(node.name as keyof T, next);
                if (node.update) {
                    (ctx.listener as any).withAllMuted
                        ? (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.update](); })
                        : (ctx.obj as any)[node.update]();

                }
            } else {
                (ctx.obj as any)[node.name] = next;
                if (node.update) { (ctx.obj as any)[node.update](); }
            }
        };
        const evt = typeGuess === 'checkbox' ? 'change' : 'input';
        input.addEventListener(evt, onUser);
        ctx.domUnsubs.push(() => input.removeEventListener(evt, onUser));
    }

    /* ----------- Button ----------- */
    private buildButton<T extends object>(node: ButtonNode<T>, ctx: Ctx<T>) {
        const btn = document.createElement('button');
        applyIdAndClass(btn, node);
        btn.type = 'button';
        btn.textContent = node.label;
        applySize(btn, node.width, node.height);
        ctx.add(btn);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(btn, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(btn, !!v));
            ctx.dataUnsubs.push(off);
        }

        const onClick = () => {
            if (node.muted && (ctx.listener as any).withAllMuted) {
                (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.action](); });
            } else {
                (ctx.obj as any)[node.action]();
            }
        };
        btn.addEventListener('click', onClick);
        ctx.domUnsubs.push(() => btn.removeEventListener('click', onClick));
    }

    /* ----------- ButtonLabel ----------- */
    private buildButtonLabel<T extends object>(node: ButtonLabelNode<T, any>, ctx: Ctx<T>) {
        const btn = document.createElement('button');
        applyIdAndClass(btn, node);
        btn.type = 'button';
        btn.textContent = String((ctx.obj as any)[node.label] ?? '');
        applySize(btn, node.width, node.height);
        ctx.add(btn);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(btn, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(btn, !!v));
            ctx.dataUnsubs.push(off);
        }

        const offLabel = ctx.listener.listen(node.label as keyof T, (v) => {
            const s = String(v ?? '');
            if (btn.textContent !== s) btn.textContent = s;
        });
        ctx.dataUnsubs.push(offLabel);

        const onClick = () => {
            if (node.muted && (ctx.listener as any).withAllMuted) {
                (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.action](); });
            } else {
                (ctx.obj as any)[node.action]();
            }
        };
        btn.addEventListener('click', onClick);
        ctx.domUnsubs.push(() => btn.removeEventListener('click', onClick));
    }

    /* ----------- Img ----------- */
    private buildImg<T extends object>(node: ImgNode<T, any>, ctx: Ctx<T>) {
        const img = document.createElement('img');
        applyIdAndClass(img, node);
        applySize(img, node.width, node.height);
        if (node.alt != null) img.alt = node.alt;

        // init src depuis le modèle (en évitant la normalisation .src absolue)
        const initial = String((ctx.obj as any)[node.url] ?? '');
        if (initial !== '') img.setAttribute('src', initial);

        ctx.add(img);

        // visible / enable
        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(img, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(img, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(img, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(img, !!v));
            ctx.dataUnsubs.push(off);
        }

        // réactivité sur l'URL
        const offUrl = ctx.listener.listen(node.url as keyof T, (v) => {
            const s = String(v ?? '');
            const cur = img.getAttribute('src') ?? '';
            if (cur !== s) {
                if (s === '') img.removeAttribute('src');
                else img.setAttribute('src', s);
            }
        });
        ctx.dataUnsubs.push(offUrl);
    }

    /* ----------- Select ----------- */
    private buildSelect<T extends object>(node: SelectNode<T, any, any, any, any>, ctx: Ctx<T>) {
        const sel = document.createElement('select');
        applyIdAndClass(sel, node);
        sel.multiple = (node.mode ?? 'list') === 'list';
        applySize(sel, node.width, node.height);
        ctx.add(sel);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(sel, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(sel, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(sel, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(sel, !!v));
            ctx.dataUnsubs.push(off);
        }

        let displayFn = (ctx.obj as any)[node.displayMethod] as (a: any) => string;
        if (typeof displayFn === 'function') displayFn = displayFn.bind(ctx.obj);

        const rebuild = () => {
            const arr = ((ctx.obj as any)[node.list] ?? []) as any[];
            while (sel.firstChild) sel.removeChild(sel.firstChild);
            for (let i = 0; i < arr.length; i++) {
                const opt = document.createElement('option');
                opt.value = String(i);
                try { opt.text = String(displayFn(arr[i])); }
                catch { opt.text = String(arr[i] as unknown as string); }
                sel.appendChild(opt);
            }
        };

        const syncSelection = () => {
            const selectedIdx = (((ctx.obj as any)[node.selection] ?? []) as number[])
                .filter((n: any) => Number.isFinite(n)) as number[];

            if (sel.multiple) {
                const set = new Set(selectedIdx);
                for (const opt of Array.from(sel.options)) {
                    const idx = Number(opt.value);
                    opt.selected = set.has(idx);
                }
            } else {
                const first = selectedIdx.find((n) => n >= 0 && n < sel.options.length);
                if (first !== undefined) sel.value = String(first);
                else sel.selectedIndex = -1;
            }
        };

        rebuild();
        syncSelection();

        const offList = ctx.listener.listen(node.list as keyof T, () => { rebuild(); syncSelection(); });
        const offSel = ctx.listener.listen(node.selection as keyof T, () => { syncSelection(); });
        ctx.dataUnsubs.push(offList, offSel);

        const onChange = () => {
            let indices: number[];
            if (sel.multiple) {
                indices = Array.from(sel.selectedOptions).map(o => Number(o.value)).filter(n => Number.isFinite(n));
            } else {
                indices = (sel.selectedIndex >= 0) ? [Number(sel.value)] : [];
            }
            if (node.muted) {
                ctx.listener.setSilently(node.selection as keyof T, indices as any);
                (ctx.listener as any).withAllMuted
                    ? (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.update](); })
                    : (ctx.obj as any)[node.update]();
            } else {
                (ctx.obj as any)[node.selection] = indices as any;
                (ctx.obj as any)[node.update]();
            }
        };
        sel.addEventListener('change', onChange);
        ctx.domUnsubs.push(() => sel.removeEventListener('change', onChange));
    }

    /* ----------- Label ----------- */
    private buildLabel<T extends object>(node: LabelNode<T, any>, ctx: Ctx<T>) {
        const span = document.createElement('span');
        applyIdAndClass(span, node);
        applySize(span, node.width, node.height);
        span.textContent = String((ctx.obj as any)[node.name] ?? '');
        ctx.add(span);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(span, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(span, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            span.setAttribute('aria-disabled', String(!(ctx.obj as any)[k]));
            const off = ctx.listener.listen(k, (v: any) => span.setAttribute('aria-disabled', String(!v)));
            ctx.dataUnsubs.push(off);
        }

        const offData = ctx.listener.listen(node.name as keyof T, (v) => {
            const s = String(v ?? '');
            if (span.textContent !== s) span.textContent = s;
        });
        ctx.dataUnsubs.push(offData);
    }

    /* ----------- Flow ----------- */
    private buildFlow<T extends object>(node: FlowNode<T>, ctx: Ctx<T>) {
        const div = document.createElement('div');
        applyIdAndClass(div, node);
        div.style.display = 'flex';
        div.style.flexDirection = node.orientation === 'row' ? 'row' : 'column';
        applySize(div, node.width, node.height);

        if (node.gap !== undefined) (div.style as any).gap = typeof node.gap === 'number' ? `${node.gap}px` : String(node.gap);
        const mapJustify: Record<string, string> = {
            start: 'flex-start', end: 'flex-end', center: 'center',
            'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly'
        };
        const mapAlign: Record<string, string> = {
            start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch'
        };
        if (node.justify) div.style.justifyContent = mapJustify[node.justify];
        if (node.align) div.style.alignItems = mapAlign[node.align];
        if (node.wrap) div.style.flexWrap = 'wrap';
        if (node.style) for (const k of Object.keys(node.style) as Array<keyof CSSStyleDeclaration>) {
            const v = node.style[k]; if (v != null) (div.style as any)[k] = v as any;
        }
        if (node.panel) div.classList.add('panel');

        const childEls: HTMLElement[] = [];
        const childCtx: Ctx<T> = { ...ctx, add: (el) => childEls.push(el) };
        this.buildNodes(node.children, childCtx);
        for (const n of childEls) div.appendChild(n);

        ctx.add(div);
    }

    /* ----------- Single UI (champ objet) ----------- */
    private buildSingleUI<T extends object>(node: SingleUINode<T>, ctx: Ctx<T>) {
        const host = document.createElement('div');
        applyIdAndClass(host, node);
        applySize(host, node.width, node.height);
        ctx.add(host);

        let child: UIRuntime<any> | null = null;

        const clearHost = () => {
            if (child) { try { child.stop(); } catch { } child = null; }
            while (host.firstChild) host.removeChild(host.firstChild);
        };

        const mountFor = (value: any, duringBuild: boolean) => {
            clearHost();
            const ui = this.findUIFor(value);
            if (!ui) return;
            const inner = document.createElement('div');
            host.appendChild(inner);
            child = this.bootInto(ui as UI<any>, value, inner, duringBuild ? ctx.postInits : undefined);
        };

        // initial (defer init au parent)
        mountFor((ctx.obj as any)[node.name], true);

        // updates (exécuter inits immédiatement)
        const off = ctx.listener.listen(node.name as keyof T, (v) => mountFor(v, false));
        ctx.dataUnsubs.push(off);
        ctx.domUnsubs.push(() => clearHost());
    }

    /* ----------- List UI (liste d'objets) ----------- */
    private buildListUI<T extends object>(node: ListUINode<T>, ctx: Ctx<T>) {
        const div = document.createElement('div');
        applyIdAndClass(div, node);
        div.style.display = 'flex';
        div.style.flexDirection = (node.orientation ?? 'column') === 'row' ? 'row' : 'column';
        applySize(div, node.width, node.height);

        if (node.gap !== undefined) (div.style as any).gap = typeof node.gap === 'number' ? `${node.gap}px` : String(node.gap);
        const mapJustify: Record<string, string> = {
            start: 'flex-start', end: 'flex-end', center: 'center',
            'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly'
        };
        const mapAlign: Record<string, string> = {
            start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch'
        };
        if (node.justify) div.style.justifyContent = mapJustify[node.justify];
        if (node.align) div.style.alignItems = mapAlign[node.align];
        if (node.wrap) div.style.flexWrap = 'wrap';
        if (node.style) for (const k of Object.keys(node.style) as Array<keyof CSSStyleDeclaration>) {
            const v = node.style[k]; if (v != null) (div.style as any)[k] = v as any;
        }
        if (node.panel) div.classList.add('panel');

        const children: UIRuntime<any>[] = [];
        let initial = true;

        const clear = () => {
            for (const r of children) { try { r.stop(); } catch { } }
            children.length = 0;
            while (div.firstChild) div.removeChild(div.firstChild);
        };

        const render = () => {
            clear();
            const arr = ((ctx.obj as any)[node.list] ?? []) as any[];
            for (const item of arr) {
                const ui = this.findUIFor(item);
                if (!ui) continue;
                const host = document.createElement('div');
                div.appendChild(host);
                const runtime = this.bootInto(ui as UI<any>, item, host, initial ? ctx.postInits : undefined);
                children.push(runtime);
            }
            initial = false;
        };

        render();
        const off = ctx.listener.listen(node.list as keyof T, () => render());
        ctx.dataUnsubs.push(off);
        ctx.domUnsubs.push(() => clear());

        ctx.add(div);
    }

    /* ----------- Dialog ----------- */
    private buildDialog<T extends object>(node: DialogNode<T>, ctx: Ctx<T>) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = node.label;
        applySize(btn, node.buttonWidth, node.buttonHeight);
        ctx.add(btn);

        const dlg = document.createElement('dialog') as HTMLDialogElement;
        applyIdAndClass(dlg, node);
        applySize(dlg, node.width, node.height);
        const host = document.createElement('div');
        host.style.minWidth = '100%';
        dlg.appendChild(host);

        let child: UIRuntime<any> | null = null;
        const clearChild = () => {
            if (child) { try { child.stop(); } catch { } child = null; }
            while (host.firstChild) host.removeChild(host.firstChild);
        };

        const mountFor = (value: any) => {
            clearChild();
            const ui = this.findUIFor(value);
            if (!ui) return false;
            const wrap = document.createElement('div');
            host.appendChild(wrap);
            child = this.bootInto(ui as UI<any>, value, wrap);
            return true;
        };

        const open = () => {
            if (node.action) {
                try { (ctx.obj as any)[node.action](); } catch { }
            }
            const value = (ctx.obj as any)[node.name];
            if (value == null) {
                try { dlg.close(); } catch { }
                clearChild();
                return;
            }
            const ok = mountFor(value);
            if (!ok) return;
            const modal = node.modal ?? true;
            if (modal && 'showModal' in dlg) dlg.showModal(); else dlg.show();
        };

        const close = () => {
            try { dlg.close(); } catch { }
            clearChild();
        };

        const offField = ctx.listener.listen(node.name as keyof T, (v) => {
            if (v == null) close();
            else if (dlg.open) mountFor(v);
        });
        ctx.dataUnsubs.push(offField);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (vv: any) => setVisible(btn, !!vv));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (vv: any) => setEnabled(btn, !!vv));
            ctx.dataUnsubs.push(off);
        }

        if (node.closeOnBackdrop) {
            dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
        }
        if (!(node.closeOnEsc ?? false)) {
            dlg.addEventListener('cancel', (e) => e.preventDefault());
        }
        dlg.addEventListener('close', () => clearChild());

        btn.addEventListener('click', open);
        ctx.domUnsubs.push(() => btn.removeEventListener('click', open));

        ctx.add(dlg);
        ctx.domUnsubs.push(() => { try { dlg.close(); } catch { } });
    }
    /* ----------- Menu (modal <dialog> top-layer, placement précis, clics transmis aux items) ----------- */
    private buildMenu<T extends object>(node: MenuNode<T>, ctx: Ctx<T>) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = node.label;
        applySize(btn, node.buttonWidth, node.buttonHeight);
        ctx.add(btn);

        // <dialog> modal (top-layer) pour capturer focus/clavier et bloquer l’arrière-plan
        const pop = document.createElement('dialog') as HTMLDialogElement;
        pop.setAttribute('data-menu', '');
        if (!document.getElementById('menu-dialog-backdrop-style')) {
            const st = document.createElement('style');
            st.id = 'menu-dialog-backdrop-style';
            st.textContent = `dialog[data-menu]::backdrop{background:transparent !important}`;
            document.head.appendChild(st);
        }
        pop.style.position = 'fixed';
        pop.style.inset = 'auto';
        pop.style.margin = '0';
        pop.style.padding = '0';
        pop.style.border = 'none';
        pop.style.background = 'transparent';
        pop.style.overflow = 'visible';
        pop.style.zIndex = '2147483647';
        pop.style.display = 'none';
        pop.style.visibility = 'hidden';
        pop.tabIndex = -1;

        // Panneau visuel
        const panel = document.createElement('div');
        applyIdAndClass(panel, node);
        applySize(panel, node.width, node.height);
        panel.setAttribute('role', 'menu');
        panel.tabIndex = -1;
        panel.style.maxWidth = 'min(90vw, 640px)';
        panel.style.maxHeight = '80vh';
        panel.style.overflow = 'auto';
        panel.style.boxSizing = 'border-box';
        panel.style.background = 'var(--menu-bg, #fff)';
        panel.style.border = '1px solid var(--menu-border, rgba(0,0,0,.12))';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 8px 30px rgba(0,0,0,.2)';
        panel.style.padding = '0';

        const host = document.createElement('div');
        host.style.minWidth = '220px';
        panel.appendChild(host);
        pop.appendChild(panel);

        document.body.appendChild(pop);
        ctx.domUnsubs.push(() => { try { pop.close(); pop.remove(); } catch { } });

        let child: UIRuntime<any> | null = null;
        let openState = false;
        const cleanup: Array<() => void> = [];

        const clearChild = () => {
            if (child) { try { child.stop(); } catch { } child = null; }
            while (host.firstChild) host.removeChild(host.firstChild);
        };
        const mountFor = (value: any) => {
            clearChild();
            const ui = this.findUIFor(value);
            if (!ui) return false;
            const wrap = document.createElement('div');
            host.appendChild(wrap);
            child = this.bootInto(ui as UI<any>, value, wrap);
            return true;
        };

        const place = () => {
            pop.style.display = 'block';
            pop.style.visibility = 'hidden';
            if (!pop.open) { try { pop.showModal(); } catch { } } // top-layer actif

            const r = btn.getBoundingClientRect();
            const pw = panel.offsetWidth || 0;
            const ph = panel.offsetHeight || 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const gap = 8;

            let top = r.bottom + gap;
            let left = r.left;
            if (top + ph > vh) {
                const above = r.top - gap - ph;
                if (above >= 0) top = above;
            }
            left = clamp(left, gap, vw - pw - gap);
            top = clamp(top, gap, vh - ph - gap);

            pop.style.left = `${left}px`;
            pop.style.top = `${top}px`;
            pop.style.visibility = 'visible';
        };

        // Clic hors du panneau (sur le backdrop du dialog) => fermer
        pop.addEventListener('click', (e) => {
            if (e.target === pop) { e.preventDefault(); e.stopPropagation(); close(); }
        });

        // Gestion des clics **dans** le panel : on laisse passer aux cibles,
        // et on ferme automatiquement si l'item le demande.
        const onInsideClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t) return;
            const item = t.closest('[data-menu-close], [role="menuitem"], button, a');
            if (!item) return;
            // Laisser le handler de l’item s’exécuter, puis fermer juste après
            setTimeout(() => close(), 0);
        };
        panel.addEventListener('click', onInsideClick);

        // Capture clavier au niveau du dialog (le parent ne reçoit rien)
        const getFocusables = () =>
            Array.from(panel.querySelectorAll<HTMLElement>(
                '[role="menuitem"],button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
            )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault(); e.stopPropagation();
                close();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault(); e.stopPropagation();
                const list = getFocusables();
                if (!list.length) return;
                const idx = list.indexOf(document.activeElement as HTMLElement);
                const dir = (e.key === 'ArrowDown') ? 1 : -1;
                const next = list[(idx + dir + list.length) % list.length] || list[0];
                next.focus();
                return;
            }
            // Empêcher la fuite de tout le clavier vers l’arrière-plan
            e.stopPropagation();
        };

        const close = () => {
            if (!openState) return;
            for (const f of cleanup.splice(0)) { try { f(); } catch { } }
            try { pop.close(); } catch { }
            pop.style.display = 'none';
            pop.style.visibility = 'hidden';
            clearChild();
            openState = false;
        };

        const open = () => {
            if (openState) { close(); return; }
            if (node.action) { try { (ctx.obj as any)[node.action](); } catch { } }
            const value = (ctx.obj as any)[node.name];
            if (value == null) { close(); return; }
            if (!mountFor(value)) return;

            place();
            requestAnimationFrame(() => {
                place();
                // Focus initial : premier focusable sinon le panel
                const list = getFocusables();
                (list[0] ?? panel).focus({ preventScroll: true });
            });

            document.addEventListener('keydown', onKey, true);
            const onResize = () => place();
            const onScroll = () => place();
            window.addEventListener('resize', onResize);
            window.addEventListener('scroll', onScroll, true);

            cleanup.push(() => {
                document.removeEventListener('keydown', onKey, true);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('scroll', onScroll, true);
            });

            // Empêcher la fermeture par "cancel" si closeOnEsc === false
            if (!(node.closeOnEsc ?? true)) {
                const onCancel = (e: Event) => e.preventDefault();
                pop.addEventListener('cancel', onCancel);
                cleanup.push(() => pop.removeEventListener('cancel', onCancel));
            }

            openState = true;
        };

        // Réactivité si la source change pendant l’ouverture
        const offField = ctx.listener.listen(node.name as keyof T, (v) => {
            if (v == null) close();
            else if (openState) {
                const s = panel.scrollTop;
                mountFor(v);
                place();
                panel.scrollTop = s;
            }
        });
        ctx.dataUnsubs.push(offField);

        // visible / enable (bouton)
        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (vv: any) => setVisible(btn, !!vv));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(btn, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (vv: any) => setEnabled(btn, !!vv));
            ctx.dataUnsubs.push(off);
        }

        btn.addEventListener('click', open);
        ctx.domUnsubs.push(() => btn.removeEventListener('click', open));
        ctx.domUnsubs.push(() => close());
    }





    /* ----------- Custom ----------- */
    private buildCustom<T extends object>(node: CustomNode<T, any, any>, ctx: Ctx<T>) {
        let el: HTMLElement | null = null;
        try {
            el = (ctx.obj as any)[node.factory]();
        } catch (e) {
            console.warn('[custom] factory call failed:', e);
            return;
        }
        if (!(el instanceof HTMLElement)) {
            console.warn('[custom] factory did not return an HTMLElement');
            return;
        }

        applyIdAndClass(el, node);
        applySize(el, node.width, node.height);
        ctx.add(el);

        if (node.visible) {
            const k = node.visible as keyof T;
            setVisible(el, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setVisible(el!, !!v));
            ctx.dataUnsubs.push(off);
        }
        if (node.enable) {
            const k = node.enable as keyof T;
            setEnabled(el, !!(ctx.obj as any)[k]);
            const off = ctx.listener.listen(k, (v: any) => setEnabled(el!, !!v));
            ctx.dataUnsubs.push(off);
        }

        if (node.init) {
            ctx.postInits.push(() => {
                try { (ctx.obj as any)[node.init](); }
                catch (e) { console.warn('[custom.init] call failed:', e); }
            });
        }
    }
}
