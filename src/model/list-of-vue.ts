import { ArrayKeys, KeysOfType, VoidMethodName1 } from "../vue-model";

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
    visible?: KeysOfType<T, boolean>; enable?: KeysOfType<T, boolean>;
    useVisibility?: boolean;

}
