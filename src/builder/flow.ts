import { FlowNode } from "../model/flow";
import { applyIdAndClass, applySize, Builder, Ctx } from "../vue-builder";


/* ----------- Flow ----------- */
    export function buildFlow<T extends object>(builder:Builder,node: FlowNode<T>, ctx: Ctx<T>) {
        const div = document.createElement('div');
        applyIdAndClass(div, node);
        div.style.display = 'flex';
        div.style.flexDirection = node.orientation === 'row' ? 'row' : 'column';
        applySize(div, node.width, node.height);

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

        const childEls: HTMLElement[] = [];
        const childCtx: Ctx<T> = { ...ctx, add: (el) => childEls.push(el) };
        builder.buildNodes(node.children, childCtx);
        for (const n of childEls) div.appendChild(n);

        ctx.add(div);
    }