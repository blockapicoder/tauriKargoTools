import { Builder, VueRuntime } from "./vue-builder";
import { Vue } from "./vue-model";

const builder: Builder = new Builder()
export function boot<T extends object>(
    model: T,
    id: string
): VueRuntime<T> {

    return builder.boot(model, id);
}
export function defineVue<T extends object>(targetClass: new (...args: any[]) => T, f: (ui: Vue<T>) => void) {
    const vue: Vue<T> = new Vue(targetClass)
    builder.addUI(vue)
    f(vue)
}
