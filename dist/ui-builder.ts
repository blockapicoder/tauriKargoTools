/* builder.ts
 * - Construit le DOM à partir de l'UI déclarative (ui.ts).
 * - Gère listeners, visible/enable, sous-UI, listes et dialogs.
 */

import { Listener, Unlisten } from "./listener";
import { getListener } from "./listener-factory";
import {
  UI, UINode,
  InputNode, ButtonNode, SelectNode, LabelNode, FlowNode,
  SingleUINode, ListUINode, DialogNode,
} from "./ui-model";

/* ===================== Runtime result ===================== */
export type UIRuntime<T extends object> = {
  listener: Listener<T>;
  elements: HTMLElement[];
  stop(): void;
};

/* ===================== Helpers DOM ===================== */
function applySize(el: HTMLElement, width?: number | string, height?: number | string) {
  if (width  !== undefined) el.style.width  = typeof width  === 'number' ? `${width}px`  : width;
  if (height !== undefined) el.style.height = typeof height === 'number' ? `${height}px` : height;
}
function setVisible(el: HTMLElement, v: boolean) {
  el.style.display = v ? "" : "none";
}
function setEnabled(el: HTMLElement, enabled: boolean) {
  if ("disabled" in el) (el as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled = !enabled;
  else el.setAttribute("aria-disabled", String(!enabled));
}

/* ===================== Contexte de build ===================== */
type Ctx<T extends object> = {
  obj: T;
  listener: Listener<T>;
  add: (el: HTMLElement) => void;
  domUnsubs: Array<() => void>;
  dataUnsubs: Array<Unlisten>;
};

/* ===================== Builder principal ===================== */
/** Le Builder détient un *registry* d’UIs disponibles pour le dispatch dynamique. */
export class Builder {
  constructor(private readonly registry: ReadonlyArray<UI<any>>) {}

  /** Monte `ui` dans `selector`. */
  boot<T extends object>(a: T, selector: string): UIRuntime<T> {
    const container = document.querySelector(selector) as HTMLElement | null;
    if (!container) throw new Error('Conteneur introuvable : ' + selector);
    return this.bootInto(this.findUIFor(a)!, a, container);
  }

  /** Monte `ui` dans un conteneur DOM donné. */
  bootInto<T extends object>(ui: UI<T>, a: T, container: HTMLElement): UIRuntime<T> {
    const listener = getListener(a);
    const elements: HTMLElement[] = [];
    const domUnsubs: Array<() => void> = [];
    const dataUnsubs: Array<Unlisten> = [];

    const ctx: Ctx<T> = {
      obj: a,
      listener,
      add: (el) => elements.push(el),
      domUnsubs,
      dataUnsubs
    };

    this.buildNodes(ui.getTree(), ctx);
    for (const el of elements) container.appendChild(el);

    return {
      listener,
      elements,
      stop: () => {
        try { /* listener.stop(); // à activer si besoin */ } catch {}
        for (const u of domUnsubs)  { try { u(); } catch {} }
        for (const u of dataUnsubs) { try { u(); } catch {} }
      }
    };
  }

  /* ----------- Dispatch des nœuds ----------- */
  private buildNodes<T extends object>(nodes: ReadonlyArray<UINode<T>>, ctx: Ctx<T>) {
    for (const node of nodes) {
      switch (node.kind) {
        case 'input':     this.buildInput(node as InputNode<T, any>, ctx); break;
        case 'button':    this.buildButton(node as ButtonNode<T>, ctx); break;
        case 'select':    this.buildSelect(node as SelectNode<T, any, any, any, any>, ctx); break;
        case 'label':     this.buildLabel(node as LabelNode<T, any>, ctx); break;
        case 'flow':      this.buildFlow(node as FlowNode<T>, ctx); break;
        case 'singleUI':  this.buildSingleUI(node as SingleUINode<T>, ctx); break;
        case 'listUI':    this.buildListUI(node as ListUINode<T>, ctx); break;
        case 'dialog':    this.buildDialog(node as DialogNode<T>, ctx); break;
      }
    }
  }

  /* ===================== Sous-UI lookup via registry ===================== */
  /** Trouve l'UI du registry dont la targetClass correspond à la valeur donnée. */
  private findUIFor<T extends object>(value: any): UI<T> | undefined {
    if (!value || typeof value !== "object") return undefined;
    return this.registry.find((u: UI<any>) => value instanceof u.getTargetClass());
  }

  /* ----------- Input ----------- */
  private buildInput<T extends object>(node: InputNode<T, any>, ctx: Ctx<T>) {
    const wrapper = document.createElement('label');
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
               : typeGuess === 'number'   ? 'number'
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
        (ctx.listener as any).withAllMuted
          ? (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.update](); })
          : (ctx.obj as any)[node.update]();
      } else {
        (ctx.obj as any)[node.name] = next;
        (ctx.obj as any)[node.update]();
      }
    };
    const evt = typeGuess === 'checkbox' ? 'change' : 'input';
    input.addEventListener(evt, onUser);
    ctx.domUnsubs.push(() => input.removeEventListener(evt, onUser));
  }

  /* ----------- Button ----------- */
  private buildButton<T extends object>(node: ButtonNode<T>, ctx: Ctx<T>) {
    const btn = document.createElement('button');
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

  /* ----------- Select ----------- */
  private buildSelect<T extends object>(node: SelectNode<T, any, any, any, any>, ctx: Ctx<T>) {
    const sel = document.createElement('select');
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
    const offSel  = ctx.listener.listen(node.selection as keyof T, () => { syncSelection(); });
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
    if (node.align)   div.style.alignItems     = mapAlign[node.align];
    if (node.wrap)    div.style.flexWrap       = 'wrap';
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
    applySize(host, node.width, node.height);
    ctx.add(host);

    let child: UIRuntime<any> | null = null;

    const clearHost = () => {
      if (child) { try { child.stop(); } catch {} child = null; }
      while (host.firstChild) host.removeChild(host.firstChild);
    };

    const mountFor = (value: any) => {
      clearHost();
      const ui = this.findUIFor(value);
      if (!ui) return;
      const inner = document.createElement('div');
      host.appendChild(inner);
      child = this.bootInto(ui as UI<any>, value, inner);
    };

    mountFor((ctx.obj as any)[node.name]);
    const off = ctx.listener.listen(node.name as keyof T, (v) => mountFor(v));
    ctx.dataUnsubs.push(off);
    ctx.domUnsubs.push(() => clearHost());
  }

  /* ----------- List UI (liste d'objets) ----------- */
  private buildListUI<T extends object>(node: ListUINode<T>, ctx: Ctx<T>) {
    const div = document.createElement('div');
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
    if (node.align)   div.style.alignItems     = mapAlign[node.align];
    if (node.wrap)    div.style.flexWrap       = 'wrap';
    if (node.style) for (const k of Object.keys(node.style) as Array<keyof CSSStyleDeclaration>) {
      const v = node.style[k]; if (v != null) (div.style as any)[k] = v as any;
    }
    if (node.panel) div.classList.add('panel');

    const children: UIRuntime<any>[] = [];

    const clear = () => {
      for (const r of children) { try { r.stop(); } catch {} }
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
        const runtime = this.bootInto(ui as UI<any>, item, host);
        children.push(runtime);
      }
    };

    render();
    const off = ctx.listener.listen(node.list as keyof T, () => render());
    ctx.dataUnsubs.push(off);
    ctx.domUnsubs.push(() => clear());

    ctx.add(div);
  }

  /* ----------- Dialog ----------- */
  private buildDialog<T extends object>(node: DialogNode<T>, ctx: Ctx<T>) {
    // Bouton
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = node.label;
    applySize(btn, node.buttonWidth, node.buttonHeight);
    ctx.add(btn);

    // Dialog + host
    const dlg = document.createElement('dialog') as HTMLDialogElement;
    applySize(dlg, node.width, node.height);
    const host = document.createElement('div');
    host.style.minWidth = '100%';
    dlg.appendChild(host);

    let child: UIRuntime<any> | null = null;
    const clearChild = () => {
      if (child) { try { child.stop(); } catch {} child = null; }
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
      // action préalable éventuelle
      if (node.action) {
        try { (ctx.obj as any)[node.action](); } catch {}
      }

      // si champ nul → fermer et ne pas ouvrir
      const value = (ctx.obj as any)[node.name];
      if (value == null) {
        try { dlg.close(); } catch {}
        clearChild();
        return;
      }

      // monter et ouvrir
      const ok = mountFor(value);
      if (!ok) return;
      const modal = node.modal ?? true;
      if (modal && 'showModal' in dlg) dlg.showModal(); else dlg.show();
    };

    const close = () => {
      try { dlg.close(); } catch {}
      clearChild();
    };

    // Fermer si name devient null/undefined, remonter sinon
    const offField = ctx.listener.listen(node.name as keyof T, (v) => {
      if (v == null) close();
      else if (dlg.open) mountFor(v);
    });
    ctx.dataUnsubs.push(offField);

    // visible / enable (bouton)
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

    // Backdrop / ESC
    if (node.closeOnBackdrop) {
      dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    }
    if (!(node.closeOnEsc ?? false)) {
      dlg.addEventListener('cancel', (e) => e.preventDefault());
    }
    dlg.addEventListener('close', () => clearChild());

    // Click bouton → ouvrir
    btn.addEventListener('click', open);
    ctx.domUnsubs.push(() => btn.removeEventListener('click', open));

    // Monter le dialog à côté du bouton
    ctx.add(dlg);
    ctx.domUnsubs.push(() => { try { dlg.close(); } catch {} });
  }
}

/** Helper: démarre `ui` sur `model` dans `id`, avec un *registry* optionnel.
 *  Par défaut, le registry est simplement `[ui]`.
 */
export function boot<T extends object>(
  listUI: UI<any>[],
  model: T,
  id: string
): UIRuntime<T> {
  const builder = new Builder(listUI);
  return builder.boot(model, id);
}
