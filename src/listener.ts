export type Unlisten = () => void;
export type Handler<T, K extends keyof T> = (value: T[K], old: T[K]) => void;

export class Listener<T extends object> {
  protected obj: T;

  /** État par propriété instrumentée. La valeur courante est toujours `value`. */
  protected fields = new Map<PropertyKey, {
    prevDesc?: PropertyDescriptor;              // descripteur propre d'origine (si existait sur l'instance)
    handlers: Set<(v: any, o: any) => void>;    // callbacks
    enumerable: boolean;                        // pour restaurer proprement
    value: any;                                 // valeur source-de-vérité tant que c'est instrumenté
    muted: number;                              // compteur de mute (réentrant)
  }>();

  constructor(obj: T) { this.obj = obj; }

  listen<K extends keyof T>(key: K, handler: Handler<T, K>): Unlisten {
    const prop = key as PropertyKey;
    let st = this.fields.get(prop);

    if (!st) {
      // Descripteur propre s'il existe (sur l'instance)
      const own = Object.getOwnPropertyDescriptor(this.obj, prop as any);

      if (own && own.configurable === false) {
        throw new Error(`Le champ "${String(prop)}" est non configurable.`);
      }

      const enumerable = own?.enumerable ?? true;

      // Valeur initiale à capturer AVANT de remplacer par notre accessor
      let current: any;
      if (own) {
        // data property
        if ("value" in own) current = own.value;
        // accessor property
        else current = own.get ? own.get.call(this.obj) : undefined;
      } else {
        // rien sur l'instance → on lit (prototype/valeur courante)
        current = (this.obj as any)[prop];
      }

      st = {
        prevDesc: own,
        handlers: new Set<(v: any, o: any) => void>(),
        enumerable,
        value: current,
        muted: 0,
      };

      // On pose NOTRE accessor sur l'instance : get/set utilisent toujours st.value
      Object.defineProperty(this.obj, prop, {
        configurable: true,
        enumerable,
        get: () => st!.value,
        set: (newVal: any) => {
          const oldVal = st!.value;
          st!.value = newVal;
          if (st!.muted > 0 || Object.is(oldVal, newVal)) return;
          for (const h of st!.handlers) {
            try { h(newVal, oldVal); } catch { /* ignore handler errors */ }
          }
        }
      });

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

  /** Écrit sans notifier */
  setSilently<K extends keyof T>(key: K, value: T[K]) {
    this.withMuted(key, () => { (this.obj as any)[key] = value; });
  }

  /** Mute une propriété (si instrumentée) pendant l'exécution de `fn` */
  protected withMuted<K extends keyof T>(key: K, fn: () => void) {
    const st = this.fields.get(key as PropertyKey);
    if (!st) { fn(); return; } // pas instrumentée → exécuter sans mute
    try { st.muted++; fn(); } finally { st.muted--; }
  }

  /** Mute toutes les propriétés instrumentées pendant l'exécution de `fn` */
  protected withAllMuted(fn: () => void) {
    try {
      for (const st of this.fields.values()) st.muted++;
      fn();
    } finally {
      for (const st of this.fields.values()) st.muted--;
    }
  }

  /** Restaure la propriété sur l'instance et tente de conserver la dernière valeur */
  private restore(prop: PropertyKey, st: NonNullable<ReturnType<typeof this.fields.get>>) {
    const last = st.value;

    if (st.prevDesc) {
      // Remet le descripteur d’origine sur l'instance
      Object.defineProperty(this.obj, prop, st.prevDesc);
      // Essaye d’y réinjecter la dernière valeur (si setter/data writable)
      try { (this.obj as any)[prop] = last; } catch { /* readonly d'origine, on ignore */ }
    } else {
      // Aucune prop propre avant : on remet une data property standard avec la dernière valeur
      delete (this.obj as any)[prop];
      Object.defineProperty(this.obj, prop, {
        configurable: true,
        enumerable: st.enumerable,
        writable: true,
        value: last
      });
    }
  }
}
