import { DialogNode } from "../model/dialog";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx, VueRuntime } from "../vue-builder";
import {  Vue } from "../vue-model";

 /* ----------- Dialog ----------- */
    export function buildDialog<T extends object>(builder:Builder,node: DialogNode<T>, ctx: Ctx<T>) {
        const btn = document.createElement('button');
        btn.type = 'button';
        applySize(btn, node.buttonWidth, node.buttonHeight);
        // Rendu du trigger (texte/html/img) – source = `label`
        builder.renderTrigger(btn, node.label, (node as any).type as ('html' | 'img' | undefined));
        ctx.add(btn);

        const dlg = document.createElement('dialog') as HTMLDialogElement;
        applyIdAndClass(dlg, node);
        applySize(dlg, node.width, node.height);
        const host = document.createElement('div');
        host.style.minWidth = '100%';
        dlg.appendChild(host);

        let child: VueRuntime<any> | null = null;
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

        const open = () => {
            if (node.action) {
                try { (ctx.obj as any)[node.action]!(); } catch { }
            }
            const value = (ctx.obj as any)[node.name];
            if (value == null) {
                try { dlg.close(); } catch { }
                clearChild();
                return;
            }
            const ok = mountFor(value);
            if (!ok) return;
            const modal = node.modal ?? true;
            if (modal && 'showModal' in dlg) dlg.showModal(); else dlg.show();
        };

        const close = () => {
            try { dlg.close(); } catch { }
            clearChild();
        };

        const offField = ctx.listener.listen(node.name as keyof T, (v) => {
            if (v == null) close();
            else if (dlg.open) mountFor(v);
        });
        ctx.dataUnsubs.push(offField);

        bindVisibleEnabled(node, btn, ctx);

        if (node.closeOnBackdrop) {
            dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
        }
        if (!(node.closeOnEsc ?? false)) {
            dlg.addEventListener('cancel', (e) => e.preventDefault());
        }
        dlg.addEventListener('close', () => clearChild());

        btn.addEventListener('click', open);
        ctx.domUnsubs.push(() => btn.removeEventListener('click', open));

        ctx.add(dlg);
        ctx.domUnsubs.push(() => { try { dlg.close(); } catch { } });
    }