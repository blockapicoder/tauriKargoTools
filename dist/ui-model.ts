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

/** Clés dont la valeur est un tableau (mutable ou readonly) */
export type ArrayKeys<T> = {
  [K in keyof T]-?: T[K] extends ReadonlyArray<any> | any[] ? K : never
}[keyof T];

/* ===================== Noeuds de l'AST ===================== */
/** Input: clé limitée à string | number | boolean */
export interface InputNode<
  T extends object,
  NK extends KeysOfType<T, string | number | boolean> = KeysOfType<T, string | number | boolean>
> {
  kind: 'input';
  name: NK;
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

/** Select: typé par list (clé de tableau), displayMethod et selection */
export interface SelectNode<
  T extends object,
  LK extends ArrayKeys<T> = ArrayKeys<T>,
  DM extends KeysOfType<T, (a: ElementOf<T[LK]>) => string> = KeysOfType<T, (a: ElementOf<T[LK]>) => string>,
  SK extends KeysOfType<T, number[]> = KeysOfType<T, number[]>,
  UM extends MethodNames0<T> = MethodNames0<T>
> {
  kind: 'select';
  list: LK;
  displayMethod: DM;   // (elem) => string
  selection: SK;       // number[]
  update: UM;
  muted?: boolean;
  mode?: 'dropdown' | 'list';
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

/** Label: clé limitée à string */
export interface LabelNode<
  T extends object,
  NK extends KeysOfType<T, string> = KeysOfType<T, string>
> {
  kind: 'label';
  name: NK;
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

/** SINGLE UI — plus de listUI */
export interface SingleUINode<T extends object> {
  kind: 'singleUI';
  name: KeysOfType<T, Objectish | null | undefined>;
  width?: number | string;
  height?: number | string;
}

/** LIST UI — plus de listUI */
export interface ListUINode<T extends object> {
  kind: 'listUI';
  list: ArrayKeys<T>;
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

/** DIALOG — plus de listUI */
export interface DialogNode<T extends object> {
  kind: 'dialog';
  name: KeysOfType<T, Objectish | null | undefined>;
  label: string;
  buttonWidth?: number | string;
  buttonHeight?: number | string;
  width?: number | string;
  height?: number | string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  modal?: boolean;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
  action?: KeysOfType<T, () => void>;
}

export type UINode<T extends object> =
  | InputNode<T, any>
  | ButtonNode<T>
  | SelectNode<T, any, any, any, any>
  | LabelNode<T, any>
  | FlowNode<T>
  | SingleUINode<T>
  | ListUINode<T>
  | DialogNode<T>;

/* ===================== UI (déclaratif uniquement) ===================== */
export class UI<T extends object> {
  private readonly targetClass: new (...args: any[]) => T;
  private readonly root: UINode<T>[] = [];
  private cursor: UINode<T>[] = this.root;   // conteneur courant
  private stack: UINode<T>[][] = [];         // pile pour flow

  constructor(targetClass: new (...args: any[]) => T) {
    this.targetClass = targetClass;
  }

  getTargetClass(): new (...args: any[]) => T { return this.targetClass; }
  getTree(): ReadonlyArray<UINode<T>> { return this.root; }

  /* ------------ Input ------------ */
  input<
    NK extends KeysOfType<T, string | number | boolean>,
    M extends MethodNames0<T>
  >(opts: {
    name: NK; update: M; label?: string; inputType?: InputType; muted?: boolean;
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    const node: InputNode<T, NK> = {
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
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }

  /* ------------ Button ------------ */
  button<MN extends MethodNames0<T>>(opts: {
    label: string; action: MN; muted?: boolean;
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    const node: ButtonNode<T> = {
      kind: 'button',
      label: opts.label,
      action: opts.action,
      muted: opts.muted,
      width: opts.width,
      height: opts.height,
      visible: opts.visible,
      enable: opts.enable
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }

  /* ------------ Select ------------ */
  select<
    LK extends ArrayKeys<T>,
    DM extends KeysOfType<T, (a: ElementOf<T[LK]>) => string>,
    SK extends KeysOfType<T, number[]>,
    UM extends MethodNames0<T>
  >(opts: {
    list: LK; displayMethod: DM; selection: SK; update: UM;
    muted?: boolean; mode?: 'dropdown' | 'list';
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    const node: SelectNode<T, LK, DM, SK, UM> = {
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
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }

  /* ------------ Label ------------ */
  label<NK extends KeysOfType<T, string>>(name: NK, opt?: {
    width?: number | string; height?: number | string;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
  }): this {
    const node: LabelNode<T, NK> = {
      kind: 'label',
      name,
      width: opt?.width,
      height: opt?.height,
      visible: opt?.visible,
      enable: opt?.enable
    };
    this.cursor.push(node as unknown as UINode<T>);
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

  /* ------------ Single UI (champ objet) — plus de listUI ------------ */
  ui<NK extends KeysOfType<T, Objectish | null | undefined>>(opt: {
    name: NK;
    width?: number | string; height?: number | string;
  }): this {
    const node: SingleUINode<T> = {
      kind: 'singleUI',
      name: opt.name as KeysOfType<T, Objectish | null | undefined>,
      width: opt.width,
      height: opt.height
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }

  /* ------------ List UI (liste d’objets) — plus de listUI ------------ */
  listUI<LK extends ArrayKeys<T>>(opt: {
    list: LK;
    orientation?: 'row' | 'column';
    gap?: number | string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: boolean;
    style?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string; height?: number | string;
  }): this {
    const node: ListUINode<T> = {
      kind: 'listUI',
      list: opt.list as ArrayKeys<T>,
      orientation: opt.orientation,
      gap: opt.gap,
      align: opt.align,
      justify: opt.justify,
      wrap: opt.wrap,
      style: opt.style,
      panel: opt.panel,
      width: opt.width,
      height: opt.height
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }

  /* ------------ Dialog — plus de listUI ------------ */
  dialog<NK extends KeysOfType<T, Objectish | null | undefined>>(opt: {
    name: NK;
    label: string;
    buttonWidth?: number | string; buttonHeight?: number | string;
    width?: number | string; height?: number | string;
    closeOnBackdrop?: boolean; closeOnEsc?: boolean; modal?: boolean;
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    action?: KeysOfType<T, () => void>;
  }): this {
    const node: DialogNode<T> = {
      kind: 'dialog',
      name: opt.name as KeysOfType<T, Objectish | null | undefined>,
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
    };
    this.cursor.push(node as unknown as UINode<T>);
    return this;
  }
}

/* Optionnel : classe de base commune si besoin */
export class UIBase {}
