import { ButtonContentType, KeysOfType, Objectish } from "../vue-model";

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
      useVisibility?: boolean;
}