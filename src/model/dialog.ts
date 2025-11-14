import { ButtonContentType, KeysOfType, Objectish } from "../vue-model";

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
      useVisibility?: boolean;
}