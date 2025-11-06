interface Holder<T> {
    target?: T
}


function createProxy<T extends object>(holder: Holder<T>) {
    const proxy = new Proxy({} as T, {

        get(_targetObject: T, property: string | symbol, receiver) {

            const value = Reflect.get(holder.target!, property, receiver);

            if (typeof value === "function") {
                return function <U>(...args: U[]) {

                    return value.apply(holder.target, args);
                };
            }
            return value;
        },
        set(_targetObject: T, property: string | symbol, value, receiver) {
            // Redirige les écritures vers la cible actuelle
            console.log(`Setting property: ${String(property)} to ${value}`);
            return Reflect.set(holder.target!, property, value, receiver);
        }
    });
    return proxy


}


class Container {
    map!: Map<unknown, unknown>
    mapProxy: Map<unknown, boolean>
    constructor() {
        this.map = new Map()
        this.mapProxy = new Map()
    }
    getInstance<Type extends object>(typeConstructor: new () => Type): Type {
        let c = this.map.get(typeConstructor) as Type
        if (!c) {
            const holder: Holder<Type> = {}
            const proxy = createProxy<Type>(holder)
            this.map.set(typeConstructor, proxy)
            this.mapProxy.set(proxy, false)
            c = new typeConstructor()
            const proxyUsed = this.mapProxy.get(proxy)!
            if (!proxyUsed) {
                this.map.set(typeConstructor, c)
                this.mapProxy.delete(proxy)
            } else {
                holder.target = c
            }
            return c
        }
        if (this.mapProxy.has(c)) {
            this.mapProxy.set(c, true)
        }
        return c


    }
    setInstance<Type extends object>(value: Type) {
        this.map.set(value.constructor, value)
    }

}
const container: Container = new Container()
export function get<Type extends object>(typeConstructor: new () => Type): Type {
    return container.getInstance(typeConstructor)
}
export function set<Type extends object>(value: Type) {
    container.setInstance(value)
}