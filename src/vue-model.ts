/* ui.ts
 * - Décrit une UI sous forme de structure JSON (AST).
 * - Aucune manipulation du DOM ici.
 */

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

/* ===================== Types utils et exports ===================== */
export type KeysOfType<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T];
export type KeysOfTypeFunction<T, V> = { [K in keyof T]-?: T[K] extends (v: V) => void ? K : never }[keyof T];
export type ElementOf<A> =
    A extends ReadonlyArray<infer U> ? U :
    A extends (infer U)[] ? U : never;

export type InputType = 'auto' | 'text' | 'number' | 'checkbox';
export type MethodNames0<T> = { [K in keyof T]-?: T[K] extends (() => any) ? K : never }[keyof T];
export type Objectish = object;
// Utilitaires génériques
// Clés des méthodes *exactement* (e: E) => void


export type HandlerKeys<C, E> = {
    [K in keyof C]-?:
    C[K] extends (t: infer M) => void
    ? M extends E ? K : never
    : never
}[keyof C];





/** Type de contenu pour Button / ButtonLabel / (Dialog/Menu trigger) */
export type ButtonContentType = 'img' | 'html';

/** Clés dont la valeur est un tableau (mutable ou readonly) */
export type ArrayKeys<T> = {
    [K in keyof T]-?: T[K] extends ReadonlyArray<any> | Array<any> ? K : never
}[keyof T];

/** Nom d'une méthode 0-arg de T qui retourne un HTMLElement */
export type HTMLElementFactoryName<T extends object> = KeysOfType<T, () => HTMLElement>;
/** Nom d'une méthode 0-arg de T qui retourne void (pour init) */
export type VoidMethodName<T extends object> = KeysOfType<T, () => void>;
export type VoidMethodName1<T extends object, M> = KeysOfType<T, (m: M) => void>;














export type UINode<T extends object> =
    | InputNode<T>
    | StaticButtonNode<T>
    | ButtonNode<T>
    | ImgNode<T>
    | SelectNode<T>
    | LabelNode<T>
    | FlowNode<T>
    | SingleVueNode<T>
    | ListVueNode<T>
    | DialogNode<T>
    | MenuNode<T>
    | CustomNode<T>
    | StaticLabelNode<T>
    | BootVueNode<T>
    | Space
    | StaticBootVueNode<T>;

/* ===================== UI (déclaratif uniquement) ===================== */
export class Vue<T extends object> {
    private readonly targetClass: new (...args: any[]) => T;
    private readonly root: UINode<T>[] = [];
    private cursor: UINode<T>[] = this.root;   // conteneur courant
    private stack: UINode<T>[][] = [];         // pile pour flow
    init?: HandlerKeys<T, HTMLDivElement>
    constructor(targetClass: new (...args: any[]) => T) {
        this.targetClass = targetClass;
    }

    getTargetClass(): new (...args: any[]) => T { return this.targetClass; }
    getTree(): ReadonlyArray<UINode<T>> { return this.root; }
    setTree(root: UINode<T>) {
        this.root.push(root)
    }

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
        useVisibility?: boolean;
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
        useVisibility?: boolean;
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
        useVisibility?: boolean;
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
    space(width: string, height: string) {
        const space: Space = { kind: "space", width: width, height: height }
        this.cursor.push(space);
        return this;

    }

    /* ------------ Img ------------ */
    img<NK extends KeysOfType<T, string>>(opts: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        url: NK; alt?: string;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        useVisibility?: boolean;
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
        useVisibility?: boolean;
    }): this {
        const node: SelectNode<T, LK, DM, SK, UM> = {
            kind: 'select',
            ...opts
        };
        this.cursor.push(node as unknown as UINode<T>);
        return this;
    }

    /* ------------ Label ------------ */
    label<NK extends KeysOfType<T, string | number>>(name: NK, opt?: {
        /** Identifiants CSS/DOM */
        id?: string; class?: string | string[];
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        useVisibility?: boolean;
    }): this {
        const node: LabelNode<T, NK> = {
            kind: 'label',
            name,
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
        init?: KeysOfType<T, (m: HTMLDivElement) => void>;
        /** Optionnel : rendu du bouton */
        type?: ButtonContentType;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        useVisibility?: boolean;
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
        init?: KeysOfType<T, (m: HTMLDivElement) => void>;
        /** Optionnel : rendu du bouton */
        type?: ButtonContentType;
        width?: number | string; height?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        useVisibility?: boolean;
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
        init?: VoidMethodName1<T, HTMLDivElement>
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
        init?: VoidMethodName1<T, HTMLDivElement>
        width?: number | string; height?: number | string;
        elementWidth?: number | string;
        elementHeight?: number | string;
        visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
        useVisibility?: boolean;
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
        useVisibility?: boolean;
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
        useVisibility?: boolean;
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
        useVisibility?: boolean;
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
