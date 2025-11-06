import { UINode } from "../vue-model";

export interface FlowNode<T extends object> {
    kind: 'flow';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];

    orientation: 'column' | 'row';
    gap?: number | string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: boolean;
    style?: Partial<CSSStyleDeclaration>;
    panel?: boolean;
    width?: number | string;
    height?: number | string;
    children: UINode<T>[];
}