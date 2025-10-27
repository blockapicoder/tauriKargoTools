import { Builder, VueRuntime } from "./ui-builder";
import { Vue } from "./ui-model";

const builder: Builder = new Builder()
export function boot<T extends object>(
    model: T,
    id: string
): VueRuntime<T> {

    return builder.boot(model, id);
}
export function defineVue<T extends object>(targetClass: new (...args: any[]) => T, f: (ui: Vue<T>) => void) {
    const ui: Vue<T> = new Vue(targetClass)
    builder.addUI(ui)
    f(ui)
}
