import { ArrayKeys, ElementOf, KeysOfType, MethodNames0 } from "../vue-model";

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
      useVisibility?: boolean;
}
