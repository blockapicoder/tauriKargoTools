import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../ui-builder";
import { LabelNode } from "../ui-model";

  /* ----------- Label ----------- */
    export function buildLabel<T extends object>(builder:Builder,node: LabelNode<T, any>, ctx: Ctx<T>) {
        const span = document.createElement('span');
        applyIdAndClass(span, node);
        applySize(span, node.width, node.height);
        span.textContent = String((ctx.obj as any)[node.name] ?? '');
        ctx.add(span);

        bindVisibleEnabled(node, span, ctx);

        const offData = ctx.listener.listen(node.name as keyof T, (v) => {
            const s = String(v ?? '');
            if (span.textContent !== s) span.textContent = s;
        });
        ctx.dataUnsubs.push(offData);
    }