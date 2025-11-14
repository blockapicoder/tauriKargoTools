import { HTMLElementFactoryName, KeysOfType, VoidMethodName } from "../vue-model";

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
    useVisibility?: boolean;
}