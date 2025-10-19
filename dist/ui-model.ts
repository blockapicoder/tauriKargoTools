/* ui.ts
 * - Décrit une UI sous forme de structure JSON (AST).
 * - Aucune manipulation du DOM ici.
 */

/* ===================== Types utils et exports ===================== */
export type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
export type ElementOf<A> =
  A extends ReadonlyArray<infer U> ? U :
  A extends (infer U)[] ? U : never;

export type InputType = 'auto' | 'text' | 'number' | 'checkbox';
export type MethodNames0<T> = { [K in keyof T]-?: T[K] extends (() => any) ? K : never }[keyof T];
export type Objectish = object;

/* ===================== Noeuds de l'AST ===================== */
export interface InputNode<T extends object> {
  kind: 'input';
  name: keyof T;
  update: MethodNames0<T>;
  label?: string;
  inputType?: InputType;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

export interface ButtonNode<T extends object> {
  kind: 'button';
  label: string;
  action: MethodNames0<T>;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

export interface SelectNode<T extends object> {
  kind: 'select';
  list: keyof T;
  displayMethod: keyof T;  // (elem) => string
  selection: keyof T;      // number[]
  update: MethodNames0<T>;
  muted?: boolean;
  mode?: 'dropdown' | 'list';
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

export interface LabelNode<T extends object> {
  kind: 'label';
  name: keyof T; // string
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

export interface FlowNode<T extends object> {
  kind: 'flow';
  orientation: 'column' | 'row';
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: Partial<CSSStyleDeclaration>;
  panel?: boolean;
  width?: number | string;
  height?: number | string;
  children: UINode<T>[];
}

export interface SingleUINode<T extends object> {
  kind: 'singleUI';
  name: keyof T;                  // champ objet
  listUI: Array<UI<any>>;         // dispatch par instanceof
  width?: number | string;
  height?: number | string;
}

export interface ListUINode<T extends object> {
  kind: 'listUI';
  list: keyof T;                  // champ array d'objets
  listUI: Array<UI<any>>;         // dispatch par instanceof
  orientation?: 'row' | 'column';
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: Partial<CSSStyleDeclaration>;
  panel?: boolean;
  width?: number | string;
  height?: number | string;
}

export interface DialogNode<T extends object> {
  kind: 'dialog';
  name: keyof T;                  // champ objet à éditer/visualiser
  listUI: Array<UI<any>>;
  label: string;                  // texte du bouton
  buttonWidth?: number | string;
  buttonHeight?: number | string;
  width?: number | string;        // taille du <dialog>
  height?: number | string;
  closeOnBackdrop?: boolean;      // défaut false
  closeOnEsc?: boolean;           // défaut false
  modal?: boolean;                // défaut true
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
  action?: KeysOfType<T, () => void>; // exécutée avant ouverture
}

export type UINode<T extends object> =
  | InputNode<T>
  | ButtonNode<T>
  | SelectNode<T>
  | LabelNode<T>
  | FlowNode<T>
  | SingleUINode<T>
  | ListUINode<T>
  | DialogNode<T>;

/* ===================== UI (déclaratif uniquement) ===================== */
export class UI<T extends object> {
  private readonly targetClass: new (...args: any[]) => T;
  private readonly root: UINode<T>[] = [];
  private cursor: UINode<T>[] = this.root;            // pointeur de conteneur courant
  private stack: UINode<T>[][] = [];                  // pile de conteneurs (pour flow)

  constructor(targetClass: new (...args: any[]) => T) {
    this.targetClass = targetClass;
  }

  getTargetClass(): new (...args: any[]) => T { return this.targetClass; }
  /** Renvoie l’AST (lecture seule) */
  getTree(): ReadonlyArray<UINode<T>> { return this.root; }

  /* ------------ Input ------------ */
  input<K extends keyof T, M extends MethodNames0<T>>(opts: {
    name: K; update: M; label?: string; inputType?: InputType; muted?: boolean;
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    this.cursor.push({
      kind: 'input',
      name: opts.name,
      update: opts.update,
      label: opts.label,
      inputType: opts.inputType,
      muted: opts.muted,
      width: opts.width,
      height: opts.height,
      visible: opts.visible,
      enable: opts.enable
    } as InputNode<T>);
    return this;
  }

  /* ------------ Button ------------ */
  button<M extends MethodNames0<T>>(opts: {
    label: string; action: M; muted?: boolean;
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    this.cursor.push({
      kind: 'button',
      label: opts.label,
      action: opts.action,
      muted: opts.muted,
      width: opts.width,
      height: opts.height,
      visible: opts.visible,
      enable: opts.enable
    } as ButtonNode<T>);
    return this;
  }

  /* ------------ Select ------------ */
  select<LK extends keyof T, UM extends MethodNames0<T>>(opts: {
    list: LK; displayMethod: keyof T; selection: keyof T; update: UM;
    muted?: boolean; mode?: 'dropdown' | 'list';
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    this.cursor.push({
      kind: 'select',
      list: opts.list,
      displayMethod: opts.displayMethod,
      selection: opts.selection,
      update: opts.update,
      muted: opts.muted,
      mode: opts.mode,
      width: opts.width,
      height: opts.height,
      visible: opts.visible,
      enable: opts.enable
    } as SelectNode<T>);
    return this;
  }

  /* ------------ Label ------------ */
  label<K extends keyof T>(name: K, opt?: {
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    this.cursor.push({
      kind: 'label',
      name,
      width: opt?.width,
      height: opt?.height,
      visible: opt?.visible,
      enable: opt?.enable
    } as LabelNode<T>);
    return this;
  }

  /* ------------ Flow (row|column) ------------ */
  flow(opt: {
    orientation: 'column' | 'row';
    gap?: number | string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: boolean;
    style?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string; height?: number | string;
  }, f: () => void): this {
    const node: FlowNode<T> = {
      kind: 'flow',
      orientation: opt.orientation,
      gap: opt.gap,
      align: opt.align,
      justify: opt.justify,
      wrap: opt.wrap,
      style: opt.style,
      panel: opt.panel,
      width: opt.width,
      height: opt.height,
      children: []
    };
    this.cursor.push(node);
    this.stack.push(this.cursor);
    this.cursor = node.children;
    try { f(); } finally {
      this.cursor = this.stack.pop() ?? this.root;
    }
    return this;
  }

  /* ------------ Single UI (champ objet) ------------ */
  ui(opt: {
    name: keyof T;
    listUI: Array<UI<any>>;
    width?: number | string; height?: number | string;
  }): this {
    this.cursor.push({
      kind: 'singleUI',
      name: opt.name,
      listUI: opt.listUI,
      width: opt.width,
      height: opt.height
    } as SingleUINode<T>);
    return this;
  }

  /* ------------ List UI (liste d’objets) ------------ */
  listUI(opt: {
    list: keyof T;
    listUI: Array<UI<any>>;
    orientation?: 'row' | 'column';
    gap?: number | string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: boolean;
    style?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string; height?: number | string;
  }): this {
    this.cursor.push({
      kind: 'listUI',
      list: opt.list,
      listUI: opt.listUI,
      orientation: opt.orientation,
      gap: opt.gap,
      align: opt.align,
      justify: opt.justify,
      wrap: opt.wrap,
      style: opt.style,
      panel: opt.panel,
      width: opt.width,
      height: opt.height
    } as ListUINode<T>);
    return this;
  }

  /* ------------ Dialog ------------ */
  dialog(opt: {
    name: keyof T;
    listUI: Array<UI<any>>;
    label: string;
    buttonWidth?: number | string; buttonHeight?: number | string;
    width?: number | string; height?: number | string;
    closeOnBackdrop?: boolean; closeOnEsc?: boolean; modal?: boolean;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    action?: KeysOfType<T, () => void>;
  }): this {
    this.cursor.push({
      kind: 'dialog',
      name: opt.name,
      listUI: opt.listUI,
      label: opt.label,
      buttonWidth: opt.buttonWidth,
      buttonHeight: opt.buttonHeight,
      width: opt.width,
      height: opt.height,
      closeOnBackdrop: opt.closeOnBackdrop,
      closeOnEsc: opt.closeOnEsc,
      modal: opt.modal,
      visible: opt.visible,
      enable: opt.enable,
      action: opt.action
    } as DialogNode<T>);
    return this;
  }
}
