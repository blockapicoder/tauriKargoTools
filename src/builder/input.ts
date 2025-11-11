import { InputNode } from "../model/input";
import { applyIdAndClass, applySize, bindEnabled, bindVisible, Builder, Ctx } from "../vue-builder";


/* ----------- Input ----------- */
export function buildInput<T extends object>(builder: Builder, node: InputNode<T, any>, ctx: Ctx<T>) {

  


    const input = document.createElement('input');
    applySize(input, node.width, node.height);
  applyIdAndClass(input, node);
    const current = (ctx.obj as any)[node.name];
    const typeGuess =
        node.inputType ??
        (typeof current === 'boolean' ? 'checkbox'
            : typeof current === 'number' ? 'number'
                : 'text');

    input.type = typeGuess === 'checkbox' ? 'checkbox'
        : typeGuess === 'number' ? 'number'
            : 'text';

    if (typeGuess === 'checkbox') {
        (input as HTMLInputElement).checked = Boolean(current);
    } else if (typeGuess === 'number') {
        (input as HTMLInputElement).valueAsNumber =
            Number.isFinite(Number(current)) ? Number(current) : 0;
    } else {
        (input as HTMLInputElement).value = (current ?? '') as any as string;
    }


    ctx.add(input);

    // visible / enable factorisés
    bindVisible(node, input, ctx);
    bindEnabled(node, input, ctx);

    // modèle -> UI
    const offData = ctx.listener.listen(node.name as keyof T, (v) => {
        if (typeGuess === 'checkbox') {
            const nv = Boolean(v);
            if ((input as HTMLInputElement).checked !== nv) (input as HTMLInputElement).checked = nv;
        } else if (typeGuess === 'number') {
            const nv = Number(v ?? 0);
            if ((input as HTMLInputElement).valueAsNumber !== nv) (input as HTMLInputElement).valueAsNumber = nv;
        } else {
            const s = (v as any as string) ?? '';
            if ((input as HTMLInputElement).value !== s) (input as HTMLInputElement).value = s;
        }
    });
    ctx.dataUnsubs.push(offData);

    // UI -> modèle + update
    const onUser = () => {
        const el = input as HTMLInputElement;
        let next: any;
        if (typeGuess === 'checkbox') next = el.checked;
        else if (typeGuess === 'number') next = Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : Number(el.value);
        else next = el.value;

        if (node.muted) {
            ctx.listener.setSilently(node.name as keyof T, next);
            if (node.update) {
                (ctx.listener as any).withAllMuted
                    ? (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.update]!(); })
                    : (ctx.obj as any)[node.update]!();

            }
        } else {
            (ctx.obj as any)[node.name] = next;
            if (node.update) { (ctx.obj as any)[node.update]!(); }
        }
    };
    const evt = typeGuess === 'checkbox' ? 'change' : 'input';
    input.addEventListener(evt, onUser);
    ctx.domUnsubs.push(() => input.removeEventListener(evt, onUser));
}
