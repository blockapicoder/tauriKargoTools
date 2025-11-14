import { ButtonContentType, KeysOfType, KeysOfTypeFunction, MethodNames0, Objectish, VoidMethodName1 } from "../vue-model";

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
    useVisibility?: boolean;
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