import { ButtonContentType, KeysOfType, MethodNames0 } from "../vue-model";

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
     useVisibility?: boolean;

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