// listener-factory.ts
import { Listener, Handler, Unlisten } from "./listener";

/** Cache: 1 Listener par objet */
const LISTENER_CACHE: WeakMap<object, Listener<any>> = new WeakMap();

/** Récupère (ou crée) le Listener associé à obj */
export function getListener<T extends object>(obj: T): Listener<T> {
  let l = LISTENER_CACHE.get(obj) as Listener<T> | undefined;
  if (!l) {
    l = new Listener(obj);
    LISTENER_CACHE.set(obj, l);
  }
  return l;
}

/** Optionnel: helpers pratiques */
export function on<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  cb: Handler<T, K>
): Unlisten {
  return getListener(obj).listen(key, cb);
}

export function setSilently<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
) {
  getListener(obj).setSilently(key, value);
}

export function stopListener(obj: object) {
  const l = LISTENER_CACHE.get(obj);
  if (l) { l.stop(); LISTENER_CACHE.delete(obj); }
}

export function hasListener(obj: object): boolean {
  return LISTENER_CACHE.has(obj);
}
