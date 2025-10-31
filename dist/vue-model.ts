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

/** Type de contenu pour Button / ButtonLabel / (Dialog/Menu trigger) */
export type ButtonContentType = 'img' | 'html';

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
    update?: MethodNames0<T>;
    label?: string;
    inputType?: InputType;
    muted?: boolean;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
}

export interface StaticButtonNode<T extends object, NK extends KeysOfType<T, string> = KeysOfType<T, string>> {
    kind: 'staticButton';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Libellé texte par défaut */
    label: string;
    action: MethodNames0<T>;
    muted?: boolean;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;

    /** Rendu optionnel : 'img' = URL d'image, 'html' = markup HTML (depuis `name` si fourni, sinon `label`). */
    type?: ButtonContentType;
    /** Source du contenu si `type` défini (URL/HTML) ; sinon le rendu retombe sur `label`. */
    name?: NK;
}

/** ButtonLabel — label typé comme une clé string de T */
export interface ButtonNode<
    T extends object,
    LK extends KeysOfType<T, string> = KeysOfType<T, string>
> {
    kind: 'button';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Clé d'un champ string de T utilisé comme libellé (texte par défaut) */
    label: LK;
    action: MethodNames0<T>;
    muted?: boolean;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;

    /** Rendu optionnel : 'img' = URL d'image, 'html' = markup HTML (depuis `name` si fourni, sinon `label`). */
    type?: ButtonContentType;
    /** Clé string du modèle à utiliser pour le contenu quand `type` est défini. */
    name?: KeysOfType<T, string>;
}

/** Img — URL typée comme une clé string de T */
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
    mode?: 'dropdown' | 'list' | 'multi-list';
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
/** Label: clé limitée à string */
export interface StaticLabelNode<
    T extends object
> {
    kind: 'staticLabel';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    label: string;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
}

/** BootVue — bouton qui "boot" une Vue (label dynamique depuis T) */
export interface BootVueNode<
    T extends object,
    NK extends KeysOfType<T, Objectish | null | undefined> = KeysOfType<T, Objectish | null | undefined>,
    LK extends KeysOfType<T, string> = KeysOfType<T, string>,
    MN extends MethodNames0<T> = MethodNames0<T>
> {
    kind: 'bootVue';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Objet dont l'UI sera montée quand on clique */
    factory: KeysOfType<T, () => object>;

    /** Clé string de T utilisée comme libellé du bouton */
    label: LK;



    /** Rendu optionnel du bouton */
    type?: ButtonContentType;

    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
}

/** StaticBootVue — bouton qui "boot" une Vue (label fixe) */
export interface StaticBootVueNode<
    T extends object,
    NK extends KeysOfType<T, Objectish | null | undefined> = KeysOfType<T, Objectish | null | undefined>,
    MN extends MethodNames0<T> = MethodNames0<T>
> {
    kind: 'staticBootVue';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Objet dont l'UI sera montée quand on clique */
    factory: KeysOfType<T, () => object>;

    /** Libellé texte non dynamique */
    label: string;



    /** Rendu optionnel du bouton */
    type?: ButtonContentType;

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
export interface SingleVueNode<T extends object> {
    kind: 'singleVue';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    name: KeysOfType<T, Objectish | null | undefined>;
    width?: number | string;
    height?: number | string;
}

/** LIST UI — plus de listUI */
export interface ListVueNode<T extends object> {
    kind: 'listOfVue';
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
    elementStyle?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string;
    height?: number | string;
    elementWidth?: number | string;
    elementHeight?: number | string;
}

/** DIALOG — plus de listUI */
export interface DialogNode<T extends object> {
    kind: 'dialog';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Objet dont l'UI sera montée dans le dialog */
    name: KeysOfType<T, Objectish | null | undefined>;
    /** Libellé du bouton qui ouvre le dialog (ou source si `type` est défini) */
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

    /** Rendu du bouton trigger : 'img' = URL (dans `label`), 'html' = markup (dans `label`). */
    type?: ButtonContentType;
}

/** MENU — mêmes paramètres que dialog, rendu différent côté renderer */
export interface MenuNode<T extends object> {
    kind: 'menu';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    /** Objet dont l'UI sera montée dans le menu */
    name: KeysOfType<T, Objectish | null | undefined>;
    /** Libellé du bouton qui ouvre le menu (ou source si `type` est défini) */
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

    /** Rendu du bouton trigger : 'img' = URL (dans `label`), 'html' = markup (dans `label`). */
    type?: ButtonContentType;
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
    | StaticButtonNode<T, any>
    | ButtonNode<T, any>
    | ImgNode<T, any>
    | SelectNode<T, any, any, any, any>
    | LabelNode<T, any>
    | FlowNode<T>
    | SingleVueNode<T>
    | ListVueNode<T>
    | DialogNode<T>
    | MenuNode<T>
    | CustomNode<T>
    | StaticLabelNode<T>
    | BootVueNode<T, any, any, any>
    | StaticBootVueNode<T, any, any>;

/* ===================== UI (déclaratif uniquement) ===================== */
export class Vue<T extends object> {
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
        name: NK; update?: M; label?: string; inputType?: InputType; muted?: boolean;
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
    staticButton<
        MN extends MethodNames0<T>,
        NK extends KeysOfType<T, string>
    >(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        label: string; action: MN; muted?: boolean;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        /** Nouveaux champs */
        type?: ButtonContentType;
        name?: NK;
    }): this {
        const node: StaticButtonNode<T, NK> = {
            kind: 'staticButton',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ ButtonLabel ------------ */
    button<
        LK extends KeysOfType<T, string>,
        MN extends MethodNames0<T>
    >(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        label: LK; action: MN; muted?: boolean;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        /** Nouveaux champs */
        type?: ButtonContentType;
        name?: KeysOfType<T, string>;
    }): this {
        const node: ButtonNode<T, LK> = {
            kind: 'button',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Img ------------ */
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
        muted?: boolean; mode?: 'dropdown' | 'list' | "multi-list";
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

    /* ------------Static Label ------------ */
    staticLabel(label: string, opt?: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: StaticLabelNode<T> = {
            kind: 'staticLabel',
            label,
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ BootVue (label dynamique) ------------ */
    bootVue<
        NK extends KeysOfType<T, Objectish | null | undefined>,
        LK extends KeysOfType<T, string>,
        MN extends MethodNames0<T>
    >(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        /** Objet dont on veut monter la Vue au clic */
        factory: KeysOfType<T, () => object>;
        /** Clé string de T pour le libellé du bouton */
        label: LK;
        /** Méthode 0-arg à appeler au clic */
   
        /** Optionnel : rendu du bouton */
        type?: ButtonContentType;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: BootVueNode<T, NK, LK, MN> = {
            kind: 'bootVue',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ StaticBootVue (label fixe) ------------ */
    staticBootVue<
        NK extends KeysOfType<T, Objectish | null | undefined>,
        MN extends MethodNames0<T>
    >(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
   
        /** Libellé texte fixe */
        label: string;
        /** Méthode 0-arg à appeler au clic */
        factory: KeysOfType<T, () => object>;
        /** Optionnel : rendu du bouton */
        type?: ButtonContentType;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    }): this {
        const node: StaticBootVueNode<T, NK, MN> = {
            kind: 'staticBootVue',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Flow ------------ */
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

    /* ------------ Single UI ------------ */
    vue<NK extends KeysOfType<T, Objectish | null | undefined>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        name: NK;
        width?: number | string; height?: number | string;
    }): this {
        const node: SingleVueNode<T> = {
            kind: 'singleVue',
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ List UI ------------ */
    listOfVue<LK extends ArrayKeys<T>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        list: LK;
        orientation?: 'row' | 'column';
        gap?: number | string;
        align?: 'start' | 'center' | 'end' | 'stretch';
        justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
        wrap?: boolean;
        style?: Partial<CSSStyleDeclaration>;
        elementStyle?: Partial<CSSStyleDeclaration>;
        panel?: boolean;
        width?: number | string; height?: number | string;
        elementWidth?: number | string;
        elementHeight?: number | string;
    }): this {
        const node: ListVueNode<T> = {
            kind: 'listOfVue',
            ...opt
        };
        if (node.wrap === undefined) {
            node.wrap = true;
        }
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Dialog ------------ */
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
        /** Nouveau : rendu du bouton trigger */
        type?: ButtonContentType;
    }): this {
        const node: DialogNode<T> = {
            kind: 'dialog',
            ...opt
        };

        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Menu ------------ */
    menu<NK extends KeysOfType<T, Objectish | null | undefined>>(opt: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        name: NK;
        label: string;
        buttonWidth?: number | string; buttonHeight?: number | string;
        width?: number | string; height?: number | string;
        closeOnBackdrop?: boolean; closeOnEsc?: boolean; modal?: boolean;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        action?: KeysOfType<T, () => void>;
        /** Nouveau : rendu du bouton trigger */
        type?: ButtonContentType;
    }): this {
        const node: MenuNode<T> = {
            kind: 'menu',
            ...opt
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Custom ------------ */
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
