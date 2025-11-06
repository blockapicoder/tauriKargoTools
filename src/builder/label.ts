import { LabelNode, StaticLabelNode } from "../model/label";
import { applyIdAndClass, applySize, bindVisibleEnabled, Builder, Ctx } from "../vue-builder";

/* ----------- Label ----------- */
export function buildLabel<T extends object>(builder: Builder, node: LabelNode<T, any>, ctx: Ctx<T>) {
  const span = document.createElement('span');
  applyIdAndClass(span, node);
  applySize(span, node.width, node.height);

  // Multi-ligne + espace intérieur sans changer la taille totale
  span.style.whiteSpace = 'pre-line';
  span.style.display = 'inline-block';
  span.style.boxSizing = 'border-box';
  span.style.padding = '4px 6px';        // ← espace texte/bord

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
export function buildStaticLabel<T extends object>(builder: Builder, node: StaticLabelNode<T>, ctx: Ctx<T>) {
  const span = document.createElement('span');
  applyIdAndClass(span, node);
  applySize(span, node.width, node.height);

  span.style.whiteSpace = 'pre-line';
  span.style.display = 'inline-block';
  span.style.boxSizing = 'border-box';
  span.style.padding = '4px 6px';

  span.textContent = node.label;
  ctx.add(span);

  bindVisibleEnabled(node, span, ctx);
}
