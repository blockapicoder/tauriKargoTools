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

/** Nom d'une méthode 0-arg de T qui retourne un HTMLElement */
export type HTMLElementFactoryName<T extends object> = KeysOfType<T, () => HTMLElement>;
/** Nom d'une méthode 0-arg de T qui retourne void (pour init) */
export type VoidMethodName<T extends object> = KeysOfType<T, () => void>;

/* ===================== Noeuds de l'AST ===================== */
/** Input: clé limitée à string | number | boolean */
export interface InputNode<
    T extends object,
    NK extends KeysOfType<T, string | number | boolean> = KeysOfType<T, string | number | boolean>
> {
    kind: 'input';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

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
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    label: string;
    action: MethodNames0<T>;
    muted?: boolean;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
}

/** Nouveau: ButtonLabel — label typé comme une clé string de T */
export interface ButtonLabelNode<
  T extends object,
  NK extends KeysOfType<T, string> = KeysOfType<T, string>
> {
  kind: 'buttonLabel';
  /** Identifiants CSS/DOM */
  id?: string;
  class?: string | string[];

  /** Clé d'un champ string de T utilisé comme libellé */
  label: NK;
  action: MethodNames0<T>;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;
}

/** Nouveau: Img — URL typée comme une clé string de T */
export interface ImgNode<
  T extends object,
  NK extends KeysOfType<T, string> = KeysOfType<T, string>
> {
  kind: 'img';
  /** Identifiants CSS/DOM */
  id?: string;
  class?: string | string[];

  /** Clé d'un champ string de T contenant l'URL de l'image */
  url: NK;
  alt?: string;
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
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

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
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    name: NK;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
}

export interface FlowNode<T extends object> {
    kind: 'flow';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

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
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    name: KeysOfType<T, Objectish | null | undefined>;
    width?: number | string;
    height?: number | string;
}

/** LIST UI — plus de listUI */
export interface ListUINode<T extends object> {
    kind: 'listUI';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

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
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

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

/** CUSTOM — créé via une méthode de T (sans argument) qui retourne un HTMLElement
 *  + une méthode d'init optionnelle (() => void) exécutée par le builder.
 */
export interface CustomNode<
  T extends object,
  FK extends HTMLElementFactoryName<T> = HTMLElementFactoryName<T>,
  IK extends VoidMethodName<T> = VoidMethodName<T>
> {
  kind: 'custom';
  /** Identifiants CSS/DOM */
  id?: string;
  class?: string | string[];

  width?: number | string;
  height?: number | string;
  visible?: KeysOfType<T, boolean>;
  enable?: KeysOfType<T, boolean>;

  /** Nom de la méthode sur T: () => HTMLElement */
  factory: FK;

  /** Nom d'une méthode sur T: () => void (appelée après création/insert du DOM) */
  init?: IK;
}

export type UINode<T extends object> =
    | InputNode<T, any>
    | ButtonNode<T>
    | ButtonLabelNode<T, any>
    | ImgNode<T, any>
    | SelectNode<T, any, any, any, any>
    | LabelNode<T, any>
    | FlowNode<T>
    | SingleUINode<T>
    | ListUINode<T>
    | DialogNode<T>
    | CustomNode<T>;

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
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        name: NK; update: M; label?: string; inputType?: InputType; muted?: boolean;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: InputNode<T, NK> = {
            kind: 'input',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Button ------------ */
    button<MN extends MethodNames0<T>>(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        label: string; action: MN; muted?: boolean;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: ButtonNode<T> = {
            kind: 'button',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ ButtonLabel (label lié à une clé string de T) ------------ */
    buttonLabel<
      NK extends KeysOfType<T, string>,
      MN extends MethodNames0<T>
    >(opts: {
      /** Identifiants CSS/DOM */
      id?: string; class?: string | string[];
      label: NK; action: MN; muted?: boolean;
      width?: number | string; height?: number | string;
      visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
      const node: ButtonLabelNode<T, NK> = {
        kind: 'buttonLabel',
        ...opts
      };
      this.cursor.push(node as unknown as UINode<T>);
      return this;
    }

    /* ------------ Img (url liée à une clé string de T) ------------ */
    img<NK extends KeysOfType<T, string>>(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        url: NK; alt?: string;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: ImgNode<T, NK> = {
            kind: 'img',
            ...opts
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
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        list: LK; displayMethod: DM; selection: SK; update: UM;
        muted?: boolean; mode?: 'dropdown' | 'list';
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: SelectNode<T, LK, DM, SK, UM> = {
            kind: 'select',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Label ------------ */
    label<NK extends KeysOfType<T, string>>(name: NK, opt?: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: LabelNode<T, NK> = {
            kind: 'label',
            name,
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Flow (row|column) ------------ */
    flow(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
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
            ...opt,
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
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        name: NK;
        width?: number | string; height?: number | string;
    }): this {
        const node: SingleUINode<T> = {
            kind: 'singleUI',
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ List UI (liste d’objets) — plus de listUI ------------ */
    listUI<LK extends ArrayKeys<T>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
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
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Dialog — plus de listUI ------------ */
    dialog<NK extends KeysOfType<T, Objectish | null | undefined>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
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
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Custom (HTMLElement via méthode de T) ------------ */
    custom<FK extends HTMLElementFactoryName<T>, IK extends VoidMethodName<T>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        /** Nom de la méthode de T: () => HTMLElement */
        factory: FK;
        /** Nom de la méthode d'init: () => void (optionnelle) */
        init?: IK;
    }): this {
        const node: CustomNode<T, FK, IK> = {
            kind: 'custom',
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }
}
