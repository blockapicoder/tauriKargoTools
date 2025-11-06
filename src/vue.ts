import { Builder, VueRuntime } from "./vue-builder";
import { HandlerKeys, Vue } from "./vue-model";

const builder: Builder = new Builder()
export function boot<T extends object>(
    model: T,
    id: string
): VueRuntime<T> {

    return builder.boot(model, id);
}
export interface Init<T> {
    init?: HandlerKeys<T, HTMLDivElement>
}
export function defineVue<T extends object>(targetClass: new (...args: any[]) => T, f: (ui: Vue<T>) => void, init?: Init<T>) {
    const vue: Vue<T> = new Vue(targetClass)
    if (init && init.init) {
        vue.init = init.init
    }
    builder.addUI(vue)
    f(vue)
}
