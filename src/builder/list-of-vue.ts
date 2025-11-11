import { ListVueNode } from "../model/list-of-vue";
import { applyIdAndClass, applySize, bindEnabled, bindVisible, Builder, Ctx, VueRuntime } from "../vue-builder";
import { Vue } from "../vue-model";

/* ----------- List UI (liste d'objets) ----------- */
export function buildListOfVue<T extends object>(builder: Builder, node: ListVueNode<T>, ctx: Ctx<T>) {
    const div = document.createElement('div');
    applyIdAndClass(div, node);
    div.style.display = 'flex';
    div.style.flexDirection = (node.orientation ?? 'column') === 'row' ? 'row' : 'column';
    applySize(div, node.width, node.height);
    // bindVisible(node, div, ctx);
    bindEnabled(node, div, ctx);
    if (node.gap !== undefined) (div.style as any).gap = typeof node.gap === 'number' ? `${node.gap}px` : String(node.gap);
    const mapJustify: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center',
        'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly'
    };
    const mapAlign: Record<string, string> = {
        start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch'
    };
    if (node.justify) div.style.justifyContent = mapJustify[node.justify];
    if (node.align) div.style.alignItems = mapAlign[node.align];
    if (node.wrap) div.style.flexWrap = 'wrap';
    if (node.style) for (const k of Object.keys(node.style) as Array<keyof CSSStyleDeclaration>) {
        const v = node.style[k]; if (v != null) (div.style as any)[k] = v as any;
    }
    if (node.panel) div.classList.add('panel');

    const children: VueRuntime<any>[] = [];
    let initial = true;

    const clear = () => {
        for (const r of children) { try { r.stop(); } catch { } }
        children.length = 0;
        while (div.firstChild) div.removeChild(div.firstChild);
    };

    const render = () => {
        clear();
        let visible = true
        if (node.visible) {
            visible = !!(ctx.obj as any)[node.visible]
        }
        let arr: any = [];
        if (visible) {
            arr = ((ctx.obj as any)[node.list] ?? []) as any[];
        }
        for (const item of arr) {
            const ui = builder.findVueFor(item);
            if (!ui) continue;
            const host = document.createElement('div');
            if (node.wrap) {
                host.style.boxSizing = "border-box";
                host.style.flex = "1 1 12rem";
            }
            if (node.elementStyle) for (const k of Object.keys(node.elementStyle) as Array<keyof CSSStyleDeclaration>) {
                const v = node.elementStyle[k]; if (v != null) (host.style as any)[k] = v as any;
            }
            applySize(host, node.elementWidth, node.elementHeight);
            div.appendChild(host);
            const runtime = builder.bootInto(ui as Vue<any>, item, host, initial ? ctx.postInits : undefined);
            children.push(runtime);
        }
        initial = false;
    };

    render();
    const off = ctx.listener.listen(node.list as keyof T, () => render());
    ctx.dataUnsubs.push(off);
    if (node.visible) {
        const offVisible = ctx.listener.listen(node.visible as keyof T, () => render());
        ctx.dataUnsubs.push(offVisible);
    }

    ctx.domUnsubs.push(() => clear());

    ctx.add(div);

}