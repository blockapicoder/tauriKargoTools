export type Unlisten = () => void;
export type Handler<T, K extends keyof T> = (value: T[K], old: T[K]) => void;
export class Listener<T extends object> {
  protected obj: T;
  protected fields = new Map<PropertyKey, {
    desc?: PropertyDescriptor;
    handlers: Set<(v: any, o: any) => void>;
    prevGetter?: PropertyDescriptor['get'];
    prevSetter?: PropertyDescriptor['set'];
    enumerable: boolean;
    useInternal: boolean;
    internal: any;
    muted: number; // compteur de mute (réentrant)
  }>();

  constructor(obj: T) { this.obj = obj; }

  listen<K extends keyof T>(key: K, handler: Handler<T, K>): Unlisten {
    const prop = key as PropertyKey;
    let st = this.fields.get(prop);

    if (!st) {
      const own = Object.getOwnPropertyDescriptor(this.obj, prop as any);
      const proto = own ? undefined :
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this.obj) ?? {}, prop as any);
      const desc = own ?? proto;

      if (desc && desc.configurable === false) {
        throw new Error(`Le champ "${String(prop)}" est non configurable.`);
      }

      const hasAccessor = !!(desc && (desc.get || desc.set));
      const prevGetter = desc?.get;
      const prevSetter = desc?.set;

      const useInternal = !hasAccessor;
      let internal: any = useInternal ? (this.obj as any)[prop] : undefined;
      if (!useInternal && !prevSetter) {
        throw new Error(`Le champ "${String(prop)}" est en lecture seule (accessor sans setter).`);
      }

      const enumerable = desc?.enumerable ?? true;
      // Crée le descriptor *sur l'instance*
      Object.defineProperty(this.obj, prop, {
        configurable: true,
        enumerable,
        get() {
          return useInternal ? internal : prevGetter!.call(this);
        },
        set(newVal: any) {
          const holder = (this as any); // l'instance réelle
          const state: typeof st = holder === (this as any) ? st! : st!; // même ref
          const oldVal = useInternal ? internal : prevGetter!.call(this);
          if (useInternal) internal = newVal; else prevSetter!.call(this, newVal);
          const curr = useInternal ? internal : prevGetter!.call(this);

          // Pas de notification si muet ou inchangé
          if (state.muted > 0 || curr === oldVal) return;

          for (const h of state.handlers) {
            try { h(curr, oldVal); } catch { /* ignore */ }
          }
        }
      });

      st = {
        desc, handlers: new Set(), prevGetter, prevSetter,
        enumerable, useInternal, internal, muted: 0
      };
      this.fields.set(prop, st);
    }

    st.handlers.add(handler as any);
    return () => this.unlisten(key, handler);
  }

  unlisten<K extends keyof T>(key: K, handler: Handler<T, K>): boolean {
    const prop = key as PropertyKey;
    const st = this.fields.get(prop);
    if (!st) return false;

    const ok = st.handlers.delete(handler as any);
    if (st.handlers.size === 0) {
      this.restore(prop, st);
      this.fields.delete(prop);
    }
    return ok;
  }

  stop(): void {
    for (const [prop, st] of this.fields) this.restore(prop, st);
    this.fields.clear();
  }

  /** Modifie une propriété sans déclencher les écouteurs */
  setSilently<K extends keyof T>(key: K, value: T[K]) {
    this.withMuted(key, () => { (this.obj as any)[key] = value; });
  }

  /** Exécute fn en désactivant les notifications sur *une* propriété */
  protected withMuted<K extends keyof T>(key: K, fn: () => void) {
    const st = this.fields.get(key as PropertyKey);
    if (!st) { fn(); return; } // pas instrumenté -> pas besoin
    try { st.muted++; fn(); } finally { st.muted--; }
  }

  /** Exécute fn en désactivant les notifications sur *toutes* les propriétés instrumentées */
  protected withAllMuted(fn: () => void) {
    try {
      for (const st of this.fields.values()) st.muted++;
      fn();
    } finally {
      for (const st of this.fields.values()) st.muted--;
    }
  }

  private restore(prop: PropertyKey, st: NonNullable<ReturnType<typeof this.fields.get>>) {
    if (st.desc) {
      Object.defineProperty(this.obj, prop, st.desc);
    } else {
      const curr = st.useInternal ? st.internal : st.prevGetter!.call(this.obj);
      delete (this.obj as any)[prop];
      (this.obj as any)[prop] = curr;
    }
  }
}
