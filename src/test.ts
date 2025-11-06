// test.ts — mini runner front sans dépendances.
// Usage:
//   import { test } from "./test.ts";
//   test("grammar compiles", () => { assertEquals(typeof parser.parse, "function"); });
//   test("examples parse to expected AST", async (t) => {
//     for (let i = 0; i < tests.length; i++) {
//       const tc = tests[i];
//       await t.step(`case #${i + 1}`, () => {
//         const got = parser.parse(tc.source);
//         assertEquals(got, tc.prog);
//       });
//     }
//   });

type StepFn = () => void | Promise<void>;
type TestFn = (t: { step: (name: string, fn: StepFn) => Promise<void> }) => void | Promise<void>;

function ensureRoot(): HTMLElement {
  const id = "test-root";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText = "font-family: ui-sans-serif, system-ui, Arial; line-height:1.4; padding:16px;";
    document.body.appendChild(el);
  }
  return el;
}

function createTestBlock(name: string): { block: HTMLElement; header: HTMLElement; list: HTMLUListElement } {
  const root = ensureRoot();

  const block = document.createElement("section");
  block.style.cssText = "margin: 12px 0; padding: 12px; border: 1px solid #ddd; border-radius: 8px;";

  const header = document.createElement("h3");
  header.textContent = `Test: ${name}`;
  header.style.cssText = "margin: 0 0 8px 0; font-size: 16px;";

  const list = document.createElement("ul");
  list.style.cssText = "margin: 8px 0 0 16px; padding: 0;";

  block.appendChild(header);
  block.appendChild(list);
  root.appendChild(block);

  return { block, header, list };
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.stack || `${e.name}: ${e.message}`;
  try { return JSON.stringify(e); } catch { return String(e); }
}

export function test(name: string, fn: TestFn): void {
  const { block, header, list } = createTestBlock(name);

  // status badge
  const status = document.createElement("span");
  status.textContent = "⏳ running…";
  status.style.cssText = "margin-left: 8px; font-size: 12px; color: #555;";
  header.appendChild(status);

  // Collect step results
  let failed = false;

  const t = {
    step: async (stepName: string, stepFn: StepFn): Promise<void> => {
      const li = document.createElement("li");
      li.style.cssText = "margin: 4px 0;";
      li.textContent = `• ${stepName}: `;
      const badge = document.createElement("span");
      badge.style.marginLeft = "4px";
      li.appendChild(badge);
      list.appendChild(li);

      try {
        await stepFn();
        badge.textContent = "✅ ok";
        badge.style.color = "#1a7f37";
      } catch (e) {
        failed = true;
        badge.textContent = "❌ fail";
        badge.style.color = "#c62828";
        const pre = document.createElement("pre");
        pre.style.cssText = "white-space: pre-wrap; background:#fff5f5; border:1px solid #f0caca; padding:8px; border-radius:6px; margin:6px 0 0 0;";
        pre.textContent = formatError(e);
        li.appendChild(pre);
      }
    },
  };

  // Run test (and implicit single-step if user didn’t use t.step)
  (async () => {
    let usedStep = false;

    // Proxy t.step to detect usage
    const proxiedT = {
      step: async (n: string, f: StepFn) => {
        usedStep = true;
        return t.step(n, f);
      },
    };

    try {
      const r = fn(proxiedT);
      if (r instanceof Promise) await r;

      if (!usedStep) {
        // Wrap whole test as one step
        await t.step("default", async () => {
          // re-run nothing; the body has already executed
          // but we still need to mark success
        });
      }
    } catch (e) {
      failed = true;
      // show top-level failure as a step
      await t.step("default", () => { throw e; }).catch(() => void 0);
    } finally {
      if (failed) {
        status.textContent = "❌ failed";
        status.style.color = "#c62828";
        block.style.borderColor = "#f19999";
      } else {
        status.textContent = "✅ passed";
        status.style.color = "#1a7f37";
        block.style.borderColor = "#9fd3a7";
      }
    }
  })();
}


// assert.ts
// Usage (Deno):
//   import { assertEquals } from "./assert.ts";
//   Deno.test("ex", () => assertEquals(parse("..."), expected));

// ————— Deep equality —————
function isTypedArray(x: unknown): x is
  | Int8Array | Uint8Array | Uint8ClampedArray
  | Int16Array | Uint16Array
  | Int32Array | Uint32Array
  | Float32Array | Float64Array
  | BigInt64Array | BigUint64Array {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function sameValueZero(a: unknown, b: unknown): boolean {
  // SameValueZero: like === but NaN equals NaN, and +0/-0 considered equal
  return (a === b) || (Number.isNaN(a as number) && Number.isNaN(b as number));
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  if (x === null || typeof x !== "object") return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

export function deepEqual(a: unknown, b: unknown, seen = new Map<any, any>()): boolean {
  if (sameValueZero(a, b)) return true;

  // Handle null vs objects/types quickly
  if (a === null || b === null) return false;

  const ta = typeof a;
  const tb = typeof b;
  if (ta !== "object" && tb !== "object") return false; // two different primitives
  if (ta !== tb) return false;

  // Cycle handling
  if (typeof a === "object" && typeof b === "object") {
    const prev = seen.get(a);
    if (prev && prev === b) return true;
    seen.set(a, b);
  }

  // Dates
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }

  // RegExp
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp &&
           a.source === b.source && a.flags === b.flags;
  }

  // Typed arrays
  if (isTypedArray(a) || isTypedArray(b)) {
    if (!isTypedArray(a) || !isTypedArray(b)) return false;
    if (Object.getPrototypeOf(a).constructor !== Object.getPrototypeOf(b).constructor) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!sameValueZero(a[i], b[i])) return false;
    }
    return true;
  }

  // Array
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  // Set
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set)) return false;
    if (a.size !== b.size) return false;
    // Compare as multisets with deep equality
    const used = new Array<boolean>(b.size).fill(false);
    const bArr = Array.from(b);
    outer: for (const av of a) {
      for (let i = 0; i < bArr.length; i++) {
        if (!used[i] && deepEqual(av, bArr[i], seen)) {
          used[i] = true;
          continue outer;
        }
      }
      return false;
    }
    return true;
  }

  // Map
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map)) return false;
    if (a.size !== b.size) return false;
    // For each entry in a, find deep-equal key in b, then compare values
    const bEntries = Array.from(b.entries());
    const used = new Array<boolean>(bEntries.length).fill(false);
    outerMap: for (const [ak, av] of a.entries()) {
      for (let i = 0; i < bEntries.length; i++) {
        if (used[i]) continue;
        const [bk, bv] = bEntries[i];
        if (deepEqual(ak, bk, seen) && deepEqual(av, bv, seen)) {
          used[i] = true;
          continue outerMap;
        }
      }
      return false;
    }
    return true;
  }

  // Plain objects
  if (isPlainObject(a) || isPlainObject(b)) {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const ka = Object.keys(a as Record<string, unknown>);
    const kb = Object.keys(b as Record<string, unknown>);
    if (ka.length !== kb.length) return false;
    // keys order-insensitive
    ka.sort(); kb.sort();
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
    }
    for (const k of ka) {
      if (!deepEqual((a as any)[k], (b as any)[k], seen)) return false;
    }
    return true;
  }

  // Fallback for objects with prototypes/functions/etc.
  // Compare own enumerable props + constructor
  if (typeof a === "object" && typeof b === "object") {
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    const ka = Object.keys(a as any);
    const kb = Object.keys(b as any);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if (!(k in (b as any))) return false;
      if (!deepEqual((a as any)[k], (b as any)[k], seen)) return false;
    }
    return true;
  }

  return false;
}

// ————— Pretty printers —————
function safeStringify(v: unknown, maxDepth = 10): string {
  const seen = new WeakSet<object>();
  function helper(x: unknown, depth: number): unknown {
    if (depth <= 0) return "[Object]";
    if (x && typeof x === "object") {
      if (seen.has(x as object)) return "[Circular]";
      seen.add(x as object);
      if (Array.isArray(x)) return (x as unknown[]).map((e) => helper(e, depth - 1));
      if (x instanceof Map) return { __map__: Array.from(x.entries()).map(([k, val]) => [helper(k, depth - 1), helper(val, depth - 1)]) };
      if (x instanceof Set) return { __set__: Array.from(x.values()).map((e) => helper(e, depth - 1)) };
      if (x instanceof Date) return { __date__: (x as Date).toISOString() };
      if (x instanceof RegExp) return { __regexp__: x.toString() };
      if (ArrayBuffer.isView(x)) return { __typedarray__: Object.getPrototypeOf(x).constructor.name, values: Array.from(x as any) };
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(x as Record<string, unknown>)) {
        out[k] = helper((x as any)[k], depth - 1);
      }
      return out;
    }
    if (typeof x === "number" && Number.isNaN(x)) return "NaN";
    if (Object.is(x, -0)) return "-0";
    return x as any;
  }
  try {
    return JSON.stringify(helper(v, maxDepth), null, 2);
  } catch {
    return String(v);
  }
}

// ————— Public assert —————
export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (deepEqual(actual, expected)) return;
  const aStr = safeStringify(actual);
  const eStr = safeStringify(expected);
  const defaultMsg = `assertEquals failed:\nExpected:\n${eStr}\nActual:\n${aStr}`;
  throw new Error(msg ? `${msg}\n${defaultMsg}` : defaultMsg);
}

