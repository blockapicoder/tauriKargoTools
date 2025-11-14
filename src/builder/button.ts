import { ButtonNode, StaticButtonNode } from "../model/button";
import { applyIdAndClass, applySize, bindEnabled, bindVisible, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";


/* ----------- Button ----------- */
export function buildStaticButton<T extends object>(builder: Builder, node: StaticButtonNode<T>, ctx: Ctx<T>) {
    const btn = document.createElement('button');
    applyIdAndClass(btn, node);
    btn.type = 'button';
    applySize(btn, node.width, node.height);
    ctx.add(btn);

    // --- rendu du contenu (texte / html / img) ---
    const ctype = (node as any).type as ('img' | 'html' | undefined);
    const nameKey = (node as any).name as (keyof T | undefined);

    const renderContent = (valFromModel?: any) => {
        const fallback = node.label ?? '';
        const value = (valFromModel !== undefined) ? String(valFromModel ?? '') :
            (nameKey ? String((ctx.obj as any)[nameKey] ?? '') : String(fallback));

        if (!ctype) {
            if (btn.innerHTML !== '') btn.innerHTML = '';
            if (btn.textContent !== fallback) btn.textContent = fallback;
            return;
        }

        if (ctype === 'html') {
            if (btn.innerHTML !== value) btn.innerHTML = value;
            return;
        }

        // ctype === 'img'
        btn.innerHTML = '';
        const img = document.createElement('img');
        if (value) img.setAttribute('src', value);
        img.alt = typeof node.label === 'string' ? node.label : '';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.pointerEvents = 'none';
        btn.appendChild(img);
    };

    renderContent();

    if (ctype && nameKey) {
        const off = ctx.listener.listen(nameKey, (v) => renderContent(v));
        ctx.dataUnsubs.push(off);
    }

    bindVisibleEnabled(node, btn, ctx);

    const onClick = () => {
        if (node.muted && (ctx.listener as any).withAllMuted) {
            (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.action]!(); });
        } else {
            (ctx.obj as any)[node.action]!();
        }
    };
    btn.addEventListener('click', onClick);
    ctx.domUnsubs.push(() => btn.removeEventListener('click', onClick));
}

/* ----------- ButtonLabel ----------- */
export function buildButton<T extends object>(builder: Builder, node: ButtonNode<T, any>, ctx: Ctx<T>) {
    const btn = document.createElement('button');
    applyIdAndClass(btn, node);
    btn.type = 'button';
    applySize(btn, node.width, node.height);
    ctx.add(btn);

    const ctype = (node as any).type as ('img' | 'html' | undefined);
    const sourceKey = ((node as any).name as (keyof T | undefined)) ?? (node.label as keyof T);

    const renderFrom = (val: any) => {
        const value = String(val ?? '');
        if (!ctype) {
            if (btn.innerHTML !== '') btn.innerHTML = '';
            if (btn.textContent !== value) btn.textContent = value;
            return;
        }
        if (ctype === 'html') {
            if (btn.innerHTML !== value) btn.innerHTML = value;
            return;
        }
        // ctype === 'img'
        btn.innerHTML = '';
        const img = document.createElement('img');
        if (value) img.setAttribute('src', value);
        const altText = String((ctx.obj as any)[node.label] ?? '');
        img.alt = altText;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.pointerEvents = 'none';
        btn.appendChild(img);
    };

    renderFrom((ctx.obj as any)[sourceKey]);

    const offSource = ctx.listener.listen(sourceKey, (v) => renderFrom(v));
    ctx.dataUnsubs.push(offSource);

    if (ctype === 'img' && sourceKey !== (node.label as keyof T)) {
        const offAlt = ctx.listener.listen(node.label as keyof T, () => {
            const img = btn.querySelector('img');
            if (img) img.alt = String((ctx.obj as any)[node.label] ?? '');
        });
        ctx.dataUnsubs.push(offAlt);
    }
    bindVisibleEnabled(node, btn, ctx);

    const onClick = () => {
        if (node.muted && (ctx.listener as any).withAllMuted) {
            (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.action]!(); });
        } else {
            (ctx.obj as any)[node.action]!();
        }
    };
    btn.addEventListener('click', onClick);
    ctx.domUnsubs.push(() => btn.removeEventListener('click', onClick));
}