import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";
import { LabelNode, StaticLabelNode } from "../vue-model";

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

      /* ----------- Static Label ----------- */
    export function buildStaticLabel<T extends object>(builder:Builder,node: StaticLabelNode<T>, ctx: Ctx<T>) {
        const span = document.createElement('span');
        applyIdAndClass(span, node);
        applySize(span, node.width, node.height);
        span.textContent = node.label;
        ctx.add(span);

        bindVisibleEnabled(node, span, ctx);

    }