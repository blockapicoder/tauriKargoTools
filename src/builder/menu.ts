import { MenuNode } from "../model/menu";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, clamp, Ctx, VueRuntime } from "../vue-builder";
import {  Vue } from "../vue-model";
/* ----------- Menu (modal <dialog> top-layer, placement précis, clics transmis aux items) ----------- */

export function buildMenu<T extends object>(builder: Builder, node: MenuNode<T>, ctx: Ctx<T>) {
    const btn = document.createElement('button');
    btn.type = 'button';
    applySize(btn, node.buttonWidth, node.buttonHeight);
    // Rendu du trigger (texte/html/img) – source = `label`
    builder.renderTrigger(btn, node.label, (node as any).type as ('html' | 'img' | undefined));
    ctx.add(btn);

    // <dialog> modal (top-layer) pour capturer focus/clavier et bloquer l’arrière-plan
    const pop = document.createElement('dialog') as HTMLDialogElement;
    pop.setAttribute('data-menu', '');
    if (!document.getElementById('menu-dialog-backdrop-style')) {
        const st = document.createElement('style');
        st.id = 'menu-dialog-backdrop-style';
        st.textContent = `dialog[data-menu]::backdrop{background:transparent !important}`;
        document.head.appendChild(st);
    }
    pop.style.position = 'fixed';
    pop.style.inset = 'auto';
    pop.style.margin = '0';
    pop.style.padding = '0';
    pop.style.border = 'none';
    pop.style.background = 'transparent';
    pop.style.overflow = 'visible';
    pop.style.zIndex = '2147483647';
    pop.style.display = 'none';
    pop.style.visibility = 'hidden';
    pop.tabIndex = -1;

    // Panneau visuel
    const panel = document.createElement('div');
    applyIdAndClass(panel, node);
    applySize(panel, node.width, node.height);
    panel.setAttribute('role', 'menu');
    panel.setAttribute('class', 'app');
    panel.tabIndex = -1;
    panel.style.maxWidth = 'min(90vw, 640px)';
    panel.style.maxHeight = '80vh';
    panel.style.overflow = 'auto';
    panel.style.boxSizing = 'border-box';
    panel.style.background = 'var(--menu-bg, #fff)';
    panel.style.border = '1px solid var(--menu-border, rgba(0,0,0,.12))';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 8px 30px rgba(0,0,0,.2)';
    panel.style.padding = '0';

    const host = document.createElement('div');
    host.style.minWidth = '220px';
    panel.appendChild(host);
    pop.appendChild(panel);

    document.body.appendChild(pop);
    ctx.domUnsubs.push(() => { try { pop.close(); pop.remove(); } catch { } });

    let child: VueRuntime<any> | null = null;
    let openState = false;
    const cleanup: Array<() => void> = [];

    const clearChild = () => {
        if (child) { try { child.stop(); } catch { } child = null; }
        while (host.firstChild) host.removeChild(host.firstChild);
    };
    const mountFor = (value: any) => {
        clearChild();
        const ui = builder.findVueFor(value);
        if (!ui) return false;
        const wrap = document.createElement('div');
        host.appendChild(wrap);
        child = builder.bootInto(ui as Vue<any>, value, wrap);
        return true;
    };

    const place = () => {
        pop.style.display = 'block';
        pop.style.visibility = 'hidden';
        if (!pop.open) { try { pop.showModal(); } catch { } } // top-layer actif

        const r = btn.getBoundingClientRect();
        const pw = panel.offsetWidth || 0;
        const ph = panel.offsetHeight || 0;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const gap = 8;

        let top = r.bottom + gap;
        let left = r.left;
        if (top + ph > vh) {
            const above = r.top - gap - ph;
            if (above >= 0) top = above;
        }
        left = clamp(left, gap, vw - pw - gap);
        top = clamp(top, gap, vh - ph - gap);

        pop.style.left = `${left}px`;
        pop.style.top = `${top}px`;
        pop.style.visibility = 'visible';
    };

    // Clic hors du panneau (sur le backdrop du dialog) => fermer
    pop.addEventListener('click', (e) => {
        if (e.target === pop) { e.preventDefault(); e.stopPropagation(); close(); }
    });

    // Gestion des clics **dans** le panel : laisser passer aux cibles, puis fermer
    const onInsideClick = (e: MouseEvent) => {
        const t = e.target as HTMLElement | null;
        if (!t) return;
        const item = t.closest('[data-menu-close], [role="menuitem"], button, a');
        if (!item) return;
        setTimeout(() => close(), 0);
    };
    panel.addEventListener('click', onInsideClick);

    // Capture clavier au niveau du dialog (le parent ne reçoit rien)
    const getFocusables = () =>
        Array.from(panel.querySelectorAll<HTMLElement>(
            '[role="menuitem"],button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault(); e.stopPropagation();
            close();
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); e.stopPropagation();
            const list = getFocusables();
            if (!list.length) return;
            const idx = list.indexOf(document.activeElement as HTMLElement);
            const dir = (e.key === 'ArrowDown') ? 1 : -1;
            const next = list[(idx + dir + list.length) % list.length] || list[0];
            next.focus();
            return;
        }
        e.stopPropagation();
    };

    const close = () => {
        if (!openState) return;
        for (const f of cleanup.splice(0)) { try { f(); } catch { } }
        try { pop.close(); } catch { }
        pop.style.display = 'none';
        pop.style.visibility = 'hidden';
        clearChild();
        openState = false;
    };

    const open = () => {
        if (openState) { close(); return; }
        if (node.action) { try { (ctx.obj as any)[node.action]!(); } catch { } }
        const value = (ctx.obj as any)[node.name];
        if (value == null) { close(); return; }
        if (!mountFor(value)) return;

        place();
        requestAnimationFrame(() => {
            place();
            const list = getFocusables();
            (list[0] ?? panel).focus({ preventScroll: true });
        });

        document.addEventListener('keydown', onKey, true);
        const onResize = () => place();
        const onScroll = () => place();
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);

        cleanup.push(() => {
            document.removeEventListener('keydown', onKey, true);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onScroll, true);
        });

        if (!(node.closeOnEsc ?? true)) {
            const onCancel = (e: Event) => e.preventDefault();
            pop.addEventListener('cancel', onCancel);
            cleanup.push(() => pop.removeEventListener('cancel', onCancel));
        }

        openState = true;
    };

    // Réactivité si la source change pendant l’ouverture
    const offField = ctx.listener.listen(node.name as keyof T, (v) => {
        if (v == null) close();
        else if (openState) {
            const s = panel.scrollTop;
            mountFor(v);
            place();
            panel.scrollTop = s;
        }
    });
    ctx.dataUnsubs.push(offField);

    // visible / enable (bouton)
    bindVisibleEnabled(node, btn, ctx);

    btn.addEventListener('click', open);
    ctx.domUnsubs.push(() => btn.removeEventListener('click', open));
    ctx.domUnsubs.push(() => close());
}