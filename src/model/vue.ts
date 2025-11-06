import { KeysOfType, Objectish, VoidMethodName1 } from "../vue-model";

/** SINGLE UI — plus de listUI */
export interface SingleVueNode<T extends object> {
    kind: 'singleVue';
    /** Identifiants CSS/DOM */
    id?: string;
    class?: string | string[];


    name: KeysOfType<T, Objectish | null | undefined>;
    width?: number | string;
    height?: number | string;
}
