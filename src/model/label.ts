import { KeysOfType } from "../vue-model";

/** Label: clé limitée à string */
export interface LabelNode<
    T extends object,
    NK extends KeysOfType<T, string|number> = KeysOfType<T, string|number>
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
      useVisibility?: boolean;
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
      useVisibility?: boolean;
}
