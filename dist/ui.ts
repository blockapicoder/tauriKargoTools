import { Listener, Unlisten } from "./listener";
import { getListener } from "./listener-factory";

/* ===================== Types utils ===================== */
type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
type ElementOf<A> = A extends (infer U)[] ? U : never;
type InputType = 'auto' | 'text' | 'number' | 'checkbox';
type MethodNames0<T> = { [K in keyof T]-?: T[K] extends (() => any) ? K : never }[keyof T];

/* Petite utilitaire de taille */
function applySize(el: HTMLElement, width?: number | string, height?: number | string) {
  if (width  !== undefined) el.style.width  = typeof width  === 'number' ? `${width}px`  : width;
  if (height !== undefined) el.style.height = typeof height === 'number' ? `${height}px` : height;
}

/* ===================== Runtime result ===================== */
export type UIRuntime<T extends object> = {
  listener: Listener<T>;
  elements: HTMLElement[];
  stop(): void;
};

/* ===================== Internal builder context ===================== */
type Ctx<T extends object> = {
  obj: T;
  listener: Listener<T>;
  add: (el: HTMLElement) => void;
  domUnsubs: Array<() => void>;
  dataUnsubs: Array<Unlisten>;
};
type Builder<T extends object> = (ctx: Ctx<T>) => void;

/* ===================== UI (description only) ===================== */
export class UI<T extends object> {
  private ops: Builder<T>[] = [];
  /** Classe cible de cette UI (sert au dispatch dans ui()/listUI()) */
  private readonly targetClass: new (...args: any[]) => T;

  constructor(targetClass: new (...args: any[]) => T) {
    this.targetClass = targetClass;
  }

  getTargetClass(): new (...args: any[]) => T { return this.targetClass; }

  /* ------------ Input lié à obj[name] ------------ */
  input<K extends keyof T, M extends MethodNames0<T>>(opts: {
    name: K;
    update: M;
    label?: string;
    inputType?: InputType;
    muted?: boolean;
    width?: number | string;   // <---
    height?: number | string;  // <---
  }): this {
    const { name, update } = opts;
    const muted = !!opts.muted;

    this.ops.push((ctx) => {
      const label = document.createElement('label');
      label.style.display = 'block';
      if (opts.label) label.append(document.createTextNode(opts.label + ' '));

      const input = document.createElement('input');
      applySize(input, opts.width, opts.height); // taille de l’input

      const current = (ctx.obj as any)[name];
      const typeGuess: InputType =
        opts.inputType ??
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

      label.appendChild(input);
      ctx.add(label);

      const off = ctx.listener.listen(name, (v) => {
        if (typeGuess === 'checkbox') {
          const nv = Boolean(v);
          if ((input as HTMLInputElement).checked !== nv) {
            (input as HTMLInputElement).checked = nv;
          }
        } else if (typeGuess === 'number') {
          const nv = Number(v ?? 0);
          if ((input as HTMLInputElement).valueAsNumber !== nv) {
            (input as HTMLInputElement).valueAsNumber = nv;
          }
        } else {
          const s = (v as any as string) ?? '';
          if ((input as HTMLInputElement).value !== s) {
            (input as HTMLInputElement).value = s;
          }
        }
      });

      const onUserChange = () => {
        const el = input as HTMLInputElement;
        let next: any;
        if (typeGuess === 'checkbox') next = el.checked;
        else if (typeGuess === 'number') next = Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : Number(el.value);
        else next = el.value;

        if (muted) {
          ctx.listener.setSilently(name, next);
          if ((ctx.listener as any).withAllMuted) {
            (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[update](); });
          } else {
            (ctx.obj as any)[update]();
          }
        } else {
          (ctx.obj as any)[name] = next;
          (ctx.obj as any)[update]();
        }
      };

      const evt = typeGuess === 'checkbox' ? 'change' : 'input';
      input.addEventListener(evt, onUserChange);

      ctx.domUnsubs.push(() => input.removeEventListener(evt, onUserChange));
      ctx.dataUnsubs.push(off);
    });

    return this;
  }

  /* ------------ Bouton ------------ */
  button<M extends MethodNames0<T>>(
    { label, action, muted, width, height }: {
      label: string; action: M; muted?: boolean; width?: number | string; height?: number | string;
    }
  ): this {
    const isMuted = !!muted;

    this.ops.push((ctx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      applySize(btn, width, height);

      const onClick = () => {
        if (isMuted && (ctx.listener as any).withAllMuted) {
          (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[action](); });
        } else {
          (ctx.obj as any)[action]();
        }
      };

      btn.addEventListener('click', onClick);
      ctx.domUnsubs.push(() => btn.removeEventListener('click', onClick));
      ctx.add(btn);
    });

    return this;
  }

  /* ------------ Select (liste ou dropdown) ------------ */
  select<
    LK extends KeysOfType<T, any[]>,
    DM extends KeysOfType<T, (a: ElementOf<T[LK]>) => string>,
    SK extends KeysOfType<T, number[]>,
    UM extends MethodNames0<T>
  >(opts: {
    list: LK;
    displayMethod: DM;
    selection: SK;
    update: UM;
    muted?: boolean;
    mode?: "dropdown" | "list";
    width?: number | string;   // <---
    height?: number | string;  // <---
  }): this {
    const muted = !!opts.muted;
    const mode = opts.mode ?? "list";

    this.ops.push((ctx) => {
      const { list, displayMethod, selection, update } = opts;
      const sel = document.createElement('select');
      sel.multiple = (mode === "list");
      applySize(sel, opts.width, opts.height);

      let displayFn = (ctx.obj as any)[displayMethod] as (a: ElementOf<T[typeof list]>) => string;
      displayFn = displayFn.bind(ctx.obj);

      const rebuildOptions = () => {
        const arr = ((ctx.obj as any)[list] ?? []) as ElementOf<T[typeof list]>[];
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        for (let i = 0; i < arr.length; i++) {
          const opt = document.createElement('option');
          opt.value = String(i);
          try { opt.text = String(displayFn(arr[i])); }
          catch { opt.text = String(arr[i] as unknown as string); }
          sel.appendChild(opt);
        }
      };

      const syncSelectionFromModel = () => {
        const selectedIdx = (((ctx.obj as any)[selection] ?? []) as number[])
          .filter((n: any) => Number.isFinite(n)) as number[];

        if (mode === "list") {
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

      rebuildOptions();
      syncSelectionFromModel();

      const offList = ctx.listener.listen(list, () => { rebuildOptions(); syncSelectionFromModel(); });
      const offSelection = ctx.listener.listen(selection, () => { syncSelectionFromModel(); });

      const onChange = () => {
        let indices: number[];
        if (mode === "list") {
          indices = Array.from(sel.selectedOptions)
            .map(o => Number(o.value))
            .filter(n => Number.isFinite(n));
        } else {
          indices = (sel.selectedIndex >= 0) ? [ Number(sel.value) ] : [];
        }

        if (muted) {
          ctx.listener.setSilently(selection, indices as any);
          if ((ctx.listener as any).withAllMuted) {
            (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[update](); });
          } else {
            (ctx.obj as any)[update]();
          }
        } else {
          (ctx.obj as any)[selection] = indices as any;
          (ctx.obj as any)[update]();
        }
      };

      sel.addEventListener('change', onChange);

      ctx.domUnsubs.push(() => sel.removeEventListener('change', onChange));
      ctx.dataUnsubs.push(offList, offSelection);
      ctx.add(sel);
    });

    return this;
  }

  /* ------------ Label ------------ */
  label<LK extends KeysOfType<T, string>>(
    name: LK,
    opt?: { width?: number | string; height?: number | string } // <---
  ): this {
    this.ops.push((ctx) => {
      const span = document.createElement('span');
      applySize(span, opt?.width, opt?.height);
      span.textContent = String((ctx.obj as any)[name] ?? '');

      const off = ctx.listener.listen(name, (v) => {
        const s = String(v ?? '');
        if (span.textContent !== s) span.textContent = s;
      });

      ctx.dataUnsubs.push(off);
      ctx.add(span);
    });

    return this;
  }

  /* ------------ Flow (row|column) ------------ */
  flow(
    opt: {
      orientation: "column" | "row";
      gap?: number | string;
      align?: "start" | "center" | "end" | "stretch";
      justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
      wrap?: boolean;
      style?: Partial<CSSStyleDeclaration>;
      panel?: boolean;
      width?: number | string;   // <---
      height?: number | string;  // <---
    },
    f: () => void
  ): this {
    const prevOps = this.ops;
    const childOps: Builder<T>[] = [];
    this.ops = childOps;
    try { f(); } finally { this.ops = prevOps; }

    this.ops.push((ctx) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = opt.orientation === 'row' ? 'row' : 'column';
      applySize(div, opt.width, opt.height);

      if (opt.gap !== undefined) {
        (div.style as any).gap = typeof opt.gap === 'number' ? `${opt.gap}px` : String(opt.gap);
      }

      const mapJustify: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center',
        'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly'
      };
      const mapAlign: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch'
      };

      if (opt.justify) div.style.justifyContent = mapJustify[opt.justify];
      if (opt.align)   div.style.alignItems     = mapAlign[opt.align];
      if (opt.wrap)    div.style.flexWrap       = 'wrap';

      if (opt.style) {
        for (const k of Object.keys(opt.style) as Array<keyof CSSStyleDeclaration>) {
          const v = opt.style[k];
          if (v != null) (div.style as any)[k] = v as any;
        }
      }
      if ((opt as any).panel) div.classList.add('panel');

      const childEls: HTMLElement[] = [];
      const childCtx: Ctx<T> = { ...ctx, add: (el) => childEls.push(el) };
      for (const op of childOps) op(childCtx);
      for (const n of childEls) div.appendChild(n);

      ctx.add(div);
    });

    return this;
  }

  /* ------------ ui : sous-UI selon la classe de obj[name] ------------ */
  ui<NK extends KeysOfType<T, object | null | undefined>>(opt: {
    name: NK;
    listUI: Array<UI<any>>;
    width?: number | string;   // <---
    height?: number | string;  // <---
  }): this {
    this.ops.push((ctx) => {
      const { name, listUI } = opt;
      const host = document.createElement('div');
      applySize(host, opt.width, opt.height);
      ctx.add(host);

      let child: UIRuntime<any> | null = null;

      const clearHost = () => {
        if (child) { try { child.stop(); } catch {} child = null; }
        while (host.firstChild) host.removeChild(host.firstChild);
      };

      const mountFor = (value: any) => {
        clearHost();
        if (!value || typeof value !== 'object') return;

        const ui = listUI.find(u => value instanceof u.getTargetClass());
        if (!ui) return;

        child = ui.bootInto(value, host);
      };

      mountFor((ctx.obj as any)[name]);

      const off = ctx.listener.listen(name, (v) => mountFor(v));
      ctx.dataUnsubs.push(off);
      ctx.domUnsubs.push(() => clearHost());
    });

    return this;
  }

  /* ------------ listUI : liste de sous-UI pour un tableau d’objets ------------ */
  listUI<
    LK extends KeysOfType<T, object[]>
  >(opts: {
    list: LK;
    listUI: Array<UI<any>>;
    orientation?: "row" | "column";
    gap?: number | string;
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
    wrap?: boolean;
    style?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string;   // <---
    height?: number | string;  // <---
  }): this {
    const orientation = opts.orientation ?? "column";

    this.ops.push((ctx) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = orientation === 'row' ? 'row' : 'column';
      applySize(div, opts.width, opts.height);

      if (opts.gap !== undefined) {
        (div.style as any).gap = typeof opts.gap === 'number' ? `${opts.gap}px` : String(opts.gap);
      }
      const mapJustify: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center',
        'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly'
      };
      const mapAlign: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch'
      };
      if (opts.justify) div.style.justifyContent = mapJustify[opts.justify];
      if (opts.align)   div.style.alignItems     = mapAlign[opts.align];
      if (opts.wrap)    div.style.flexWrap       = 'wrap';
      if (opts.style) {
        for (const k of Object.keys(opts.style) as Array<keyof CSSStyleDeclaration>) {
          const v = opts.style[k];
          if (v != null) (div.style as any)[k] = v as any;
        }
      }
      if ((opts as any).panel) div.classList.add('panel');

      const children: UIRuntime<any>[] = [];

      const clear = () => {
        for (const r of children) { try { r.stop(); } catch {} }
        children.length = 0;
        while (div.firstChild) div.removeChild(div.firstChild);
      };

      const render = () => {
        clear();
        const arr = ((ctx.obj as any)[opts.list] ?? []) as object[];
        for (const item of arr) {
          const ui = opts.listUI.find(u => item instanceof u.getTargetClass());
          if (!ui) continue;
          const host = document.createElement('div');
          div.appendChild(host);
          const runtime = ui.bootInto(item, host);
          children.push(runtime);
        }
      };

      render();
      const off = ctx.listener.listen(opts.list, () => render());
      ctx.dataUnsubs.push(off);
      ctx.domUnsubs.push(() => clear());

      ctx.add(div);
    });

    return this;
  }

  /* ------------ BOOT publics ------------ */
  boot(a: T, idDiv: string): UIRuntime<T> {
    const container = document.querySelector(idDiv) as HTMLElement | null;
    if (!container) throw new Error('Conteneur introuvable : ' + String(idDiv));
    return this.bootInto(a, container);
  }

  bootInto(a: T, container: HTMLElement): UIRuntime<T> {
    const listener = getListener(a);
    const elements: HTMLElement[] = [];
    const domUnsubs: Array<() => void> = [];
    const dataUnsubs: Array<Unlisten> = [];

    const ctx: Ctx<T> = {
      obj: a,
      listener,
      add: (el) => elements.push(el),
      domUnsubs,
      dataUnsubs,
    };

    for (const op of this.ops) op(ctx);
    for (const el of elements) container.appendChild(el);

    return {
      listener,
      elements,
      stop: () => {
        try {
          // listener.stop(); // laissé commenté comme dans ton code
        } catch {}
        for (const u of domUnsubs) { try { u(); } catch {} }
      }
    };
  }
}
