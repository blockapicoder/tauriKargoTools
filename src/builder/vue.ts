import { SingleVueNode } from "../model/vue";
import { applyIdAndClass, applySize, Builder, Ctx, VueRuntime } from "../vue-builder";
import {  Vue } from "../vue-model";

/* ----------- Single UI (champ objet) ----------- */
    export function buildSingleVue<T extends object>(builder:Builder,node: SingleVueNode<T>, ctx: Ctx<T>) {
        const host = document.createElement('div');
        applyIdAndClass(host, node);
        applySize(host, node.width, node.height);
        ctx.add(host);

        let child: VueRuntime<any> | null = null;

        const clearHost = () => {
            if (child) { try { child.stop(); } catch { } child = null; }
            while (host.firstChild) host.removeChild(host.firstChild);
        };

        const mountFor = (value: any, duringBuild: boolean) => {
            clearHost();
            const ui = builder.findVueFor(value);
            if (!ui) return;
            const inner = document.createElement('div');
            host.appendChild(inner);
            child = builder.bootInto(ui as Vue<any>, value, inner, duringBuild ? ctx.postInits : undefined);
        };

        // initial (defer init au parent)
        mountFor((ctx.obj as any)[node.name], true);

        // updates (exécuter inits immédiatement)
        const off = ctx.listener.listen(node.name as keyof T, (v) => mountFor(v, false));
        ctx.dataUnsubs.push(off);
        ctx.domUnsubs.push(() => clearHost());

    
    }