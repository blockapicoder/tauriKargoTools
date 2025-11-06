import { ImgNode } from "../model/img";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";



    /* ----------- Img ----------- */
export function buildImg<T extends object>(builder:Builder,node: ImgNode<T, any>, ctx: Ctx<T>) {
        const img = document.createElement('img');
        applyIdAndClass(img, node);
        applySize(img, node.width, node.height);
        if (node.alt != null) img.alt = node.alt;
        const initial = String((ctx.obj as any)[node.url] ?? '');
        if (initial !== '') img.setAttribute('src', initial);

        ctx.add(img);

        bindVisibleEnabled(node, img, ctx);

        const offUrl = ctx.listener.listen(node.url as keyof T, (v) => {
            const s = String(v ?? '');
            const cur = img.getAttribute('src') ?? '';
            if (cur !== s) {
                if (s === '') img.removeAttribute('src');
                else img.setAttribute('src', s);
            }
        });
        ctx.dataUnsubs.push(offUrl);
    }