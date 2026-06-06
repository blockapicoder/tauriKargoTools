# tauri-kargo-tools

`tauri-kargo-tools` is the TypeScript tools library used by [TauriKargo](https://github.com/blockapicoder/tauriKargo). It provides two main building blocks:

- a small declarative UI runtime for building TauriKargo interfaces from TypeScript classes;
- a typed HTTP client for the local TauriKargo API.

The library is intentionally lightweight. It does not depend on Vue, React, or another frontend framework. The "Vue" name used in the source refers to the library's own view model and builder API.

## What It Is For

Use this package when you build a web UI that runs inside TauriKargo or talks to a TauriKargo local server.

It helps you:

- declare UI screens from plain TypeScript models;
- bind inputs, labels, buttons, lists, dialogs, menus, images, and custom DOM nodes to model fields;
- rebuild nested views from model objects;
- react to field changes through a simple listener system;
- call TauriKargo endpoints for files, directories, processes, packaging, child servers, TypeScript tools, and explorer operations;
- write browser/worker tests that can report assertions and snapshots back to the TauriKargo test runner.

## Installation

```bash
npm install tauri-kargo-tools
```

The package exposes files through subpath exports:

```ts
import { boot, defineVue } from "tauri-kargo-tools/vue";
import { createClient } from "tauri-kargo-tools/api";
import { assertEquals, log, terminate } from "tauri-kargo-tools/test";
```

When developing this repository locally, the source lives in `src/` and TypeScript is checked with the repository `tsconfig.json`.

## UI Runtime

The UI runtime is centered around two functions:

- `defineVue(ModelClass, definition, init?)` registers how a class should be rendered.
- `boot(model, selector?)` mounts an instance into the page.

A UI can be declared either as a builder callback or as a raw node tree.

### Minimal Example

```ts
import { boot, defineVue } from "tauri-kargo-tools/vue";

class Counter {
  title = "Counter";
  value = 0;
  canDecrement = false;

  increment() {
    this.value++;
    this.canDecrement = this.value > 0;
  }

  decrement() {
    this.value--;
    this.canDecrement = this.value > 0;
  }
}

defineVue(Counter, (ui) => {
  ui.flow({ orientation: "column", gap: 10 }, () => {
    ui.label("title");
    ui.label("value");
    ui.flow({ orientation: "row", gap: 10 }, () => {
      ui.staticButton({ label: "-", action: "decrement", enable: "canDecrement" });
      ui.staticButton({ label: "+", action: "increment" });
    });
  });
});

boot(new Counter());
```

If no selector is passed, `boot(...)` creates a root container in `document.body` and loads the bundled dark-mode stylesheet. If a selector is passed, the runtime mounts into that existing element.

## Available UI Nodes

The builder API in `src/vue-model.ts` supports these node types:

- `input(...)` for text, number, and checkbox fields.
- `label(...)` and `staticLabel(...)` for dynamic or fixed text.
- `button(...)` and `staticButton(...)` for actions.
- `img(...)` for model-driven images.
- `select(...)` for dropdown, list, and multi-list selection.
- `flow(...)` for row or column layout.
- `space(...)` for fixed spacing.
- `vue(...)` for rendering one nested model object.
- `listOfVue(...)` for rendering arrays of model objects.
- `dialog(...)` for modal or non-modal dialogs.
- `menu(...)` for popover-style nested content.
- `bootVue(...)` and `staticBootVue(...)` for switching to another view created by a factory method.
- `custom(...)` for model methods that return an `HTMLElement`.

Most nodes support common options such as:

- `id`
- `class`
- `width`
- `height`
- `visible`
- `enable`
- `useVisibility`

`visible` and `enable` point to boolean fields on the model. The runtime listens to those fields and updates the DOM when they change.

## Model Binding

The runtime observes object fields through `Listener` from `src/listener.ts`. When a UI node binds to a field, the listener wraps that field with a getter/setter and notifies subscribed handlers.

Useful helpers are exported from `src/listener-factory.ts`:

```ts
import { on, setSilently, stopListener } from "tauri-kargo-tools/listener-factory";

const state = { value: 0 };

const off = on(state, "value", (value, oldValue) => {
  console.log("changed", oldValue, value);
});

state.value = 1;
setSilently(state, "value", 2);
off();
stopListener(state);
```

## TauriKargo API Client

`createClient()` creates a `TauriKargoClient` for the local API exposed by TauriKargo.

```ts
import { createClient } from "tauri-kargo-tools/api";

const client = createClient();

const config = await client.getConfig();

await client.useConfig({
  code: "C:/path/to/code",
  executable: "C:/path/to/executable"
});

const file = await client.readFileText("applications.json");
await client.writeFileText("out.txt", "hello");

const run = await client.run({
  executableName: "my-tool.exe",
  arguments: ["--help"]
});

const status = await client.runStatus({ id: run.id! });
```

By default, the client uses relative URLs. This is the right behavior when the UI is served by TauriKargo itself. You can also target a specific local server:

```ts
const client = createClient({ port: 5173 });
const other = createClient({ baseUrl: "http://127.0.0.1:5173" });
```

### Client Capabilities

The client wraps these TauriKargo API areas:

- packaging: `embed(...)`;
- configuration: `useConfig(...)`, `getConfig(...)`;
- files: `readFileText(...)`, `readFileBinary(...)`, `writeFileText(...)`, `writeFileBinary(...)`, `deleteFile(...)`;
- directories: `setCurrentDirectory(...)`, `getCurrentDirectory(...)`, `createDirectory(...)`;
- explorer: `explorer(...)`;
- processes: `run(...)`, `runStatus(...)`, `getAllRunStatus(...)`, `runStop(...)`, `runStopAll(...)`;
- child servers: `newServer(...)`, `stopServer(...)`;
- TypeScript tools: `typescriptTranspile(...)`, `typescriptAst(...)`.

The request and response types are defined in `src/types.ts`.

## Test Helpers

`src/test.ts` provides a small browser-friendly test helper set. It is used by the TauriKargo test runner, where test files are loaded as module workers.

```ts
import {
  assertEquals,
  assertEqualsSnapshot,
  log,
  terminate
} from "tauri-kargo-tools/test";

log("starting test");

assertEquals(1 + 1, 2, "math works");

await assertEqualsSnapshot(
  { name: "example", ok: true },
  "example-result"
);

terminate();
```

The helpers post structured messages such as:

- `log`
- `assert`
- `snapshot`
- `terminate`

TauriKargo consumes those messages to display test output, stop workers on failures, and update snapshot files under `test/snapshots`.

## CSS

The UI runtime ships with two stylesheets:

```text
src/css/vue-darkmode.css
src/css/vue-lightmode.css
```

When `boot(model)` is called without a selector, the runtime currently injects the dark-mode stylesheet automatically. You can also reference the styles directly from your own HTML if needed.

## Repository Layout

```text
src/
|-- api.ts                 # typed TauriKargo HTTP client
|-- types.ts               # API and test message types
|-- vue.ts                 # public UI entry points: boot and defineVue
|-- vue-builder.ts         # DOM builder/runtime
|-- vue-model.ts           # declarative UI model and builder API
|-- listener.ts            # field listener implementation
|-- listener-factory.ts    # listener cache and helpers
|-- builder/               # DOM builders per UI node
|-- model/                 # node type definitions
|-- css/                   # bundled UI styles
|-- schema/                # data-model client/server helpers
`-- test/                  # examples, fixtures, and test assets
```

## Development

Install dependencies:

```bash
npm install
```

Run TypeScript checking:

```bash
npx tsc --noEmit
```

The package is published from source files under `src/`; there is no build step configured in `package.json` at the moment.

## Relationship With TauriKargo

TauriKargo uses this package for its built-in desktop interface:

- the explorer is defined with `defineVue(...)`;
- the launcher uses `createClient()` to register apps, run child servers, and call `/api/embed`;
- the test runner uses the test message types and helpers;
- the UI screens are composed from the declarative builder nodes in this library.

In short: TauriKargo is the desktop host and local API server; `tauri-kargo-tools` is the TypeScript toolkit used to build UIs and talk to that host.

## License

See `LICENSE` and `package.json`.
