import { CustomNode } from "../model/custom";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";


 /* ----------- Custom ----------- */
    export function buildCustom<T extends object>(builder:Builder,node: CustomNode<T, any, any>, ctx: Ctx<T>) {
        let el: HTMLElement | null = null;
        try {
            el = (ctx.obj as any)[node.factory]!();
        } catch (e) {
            console.warn('[custom] factory call failed:', e);
            return;
        }
        if (!(el instanceof HTMLElement)) {
            console.warn('[custom] factory did not return an HTMLElement');
            return;
        }

        applyIdAndClass(el, node);
        applySize(el, node.width, node.height);
        ctx.add(el);

        bindVisibleEnabled(node, el, ctx);

        if (node.init) {
            ctx.postInits.push(() => {
                try { (ctx.obj as any)[node.init]!(); }
                catch (e) { console.warn('[custom.init] call failed:', e); }
            });
        }
    }