import { SelectNode } from "../model/select";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";


/* ----------- Select ----------- */
export function buildSelect<T extends object>(builder: Builder, node: SelectNode<T, any, any, any, any>, ctx: Ctx<T>) {
    const sel = document.createElement('select');
    applyIdAndClass(sel, node);

    // NEW: mode handling
    const mode = (node.mode ?? 'list');               // 'dropdown' | 'list' | 'multi-list'
    sel.multiple = mode === 'multi-list';             // multi seulement en 'multi-list'

    applySize(sel, node.width, node.height);
    ctx.add(sel);

    bindVisibleEnabled(node, sel, ctx);

    let displayFn = (ctx.obj as any)[node.displayMethod] as (a: any) => string;
    if (typeof displayFn === 'function') displayFn = displayFn.bind(ctx.obj);

    // NEW: helper pour calculer la hauteur visible (nombre de lignes)
    const computeListSize = (count: number) => {
        if (mode === 'dropdown') return 1;
        // Par défaut on montre entre 2 et 10 lignes (sans dépasser la taille)
        return Math.max(Math.min(count, 10), 2);
    };

    const rebuild = () => {
        const arr = ((ctx.obj as any)[node.list] ?? []) as any[];
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        for (let i = 0; i < arr.length; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            try { opt.text = String(displayFn(arr[i])); }
            catch { opt.text = String(arr[i] as unknown as string); }
            sel.appendChild(opt);
        }

        // NEW: forcer l’apparence "liste" quand mode != dropdown
        sel.size = computeListSize(arr.length);
    };

    const syncSelection = () => {
        const selectedIdx = (((ctx.obj as any)[node.selection] ?? []) as number[])
            .filter((n: any) => Number.isFinite(n)) as number[];

        if (sel.multiple) {
            const set = new Set(selectedIdx);
            for (const opt of Array.from(sel.options)) {
                const idx = Number(opt.value);
                opt.selected = set.has(idx);
            }
        } else {
            const first = selectedIdx.find((n) => n >= 0 && n < sel.options.length);
            if (first !== undefined) sel.value = String(first);
            else sel.selectedIndex = -1;
        }
    };

    rebuild();
    syncSelection();

    const offList = ctx.listener.listen(node.list as keyof T, () => { rebuild(); syncSelection(); });
    const offSel = ctx.listener.listen(node.selection as keyof T, () => { syncSelection(); });
    ctx.dataUnsubs.push(offList, offSel);

    const onChange = () => {
        let indices: number[];
        if (sel.multiple) {
            indices = Array.from(sel.selectedOptions)
                .map(o => Number(o.value))
                .filter(n => Number.isFinite(n));
        } else {
            indices = (sel.selectedIndex >= 0) ? [Number(sel.value)] : [];
        }
        if (node.muted) {
            ctx.listener.setSilently(node.selection as keyof T, indices as any);
            (ctx.listener as any).withAllMuted
                ? (ctx.listener as any).withAllMuted(() => { (ctx.obj as any)[node.update]!(); })
                : (ctx.obj as any)[node.update]!();
        } else {
            (ctx.obj as any)[node.selection] = indices as any;
            (ctx.obj as any)[node.update]!();
        }
    };
    sel.addEventListener('change', onChange);
    ctx.domUnsubs.push(() => sel.removeEventListener('change', onChange));
}
