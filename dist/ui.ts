import { Builder, UIRuntime } from "./ui-builder";
import { UI } from "./ui-model";

const builder: Builder = new Builder()
export function boot<T extends object>(
    model: T,
    id: string
): UIRuntime<T> {

    return builder.boot(model, id);
}
export function defineUI<T extends object>(targetClass: new (...args: any[]) => T, f: (ui: UI<T>) => void) {
    const ui: UI<T> = new UI(targetClass)
    builder.addUI(ui)
    f(ui)
}
