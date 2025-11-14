/* ===================== Noeuds de l'AST ===================== */

import { InputType, KeysOfType, MethodNames0 } from "../vue-model";

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

    inputType?: InputType;
    muted?: boolean;
    width?: number | string;
    height?: number | string;
    visible?: KeysOfType<T, boolean>;
    enable?: KeysOfType<T, boolean>;
      useVisibility?: boolean;
}
