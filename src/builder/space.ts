import { Space } from "../model/space";
import { applySize, Builder, Ctx } from "../vue-builder";

/* ----------- Flow ----------- */
    export function buildSpace<T extends object>(builder:Builder,node: Space, ctx: Ctx<T>) {
        const div = document.createElement('div');
 
        div.style.visibility ="hidden"
        applySize(div, node.width, node.height);
        ctx.add(div);

    }

