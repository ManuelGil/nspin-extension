# nspin-extension

[![NPM Version](https://img.shields.io/npm/v/nspin-extension?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/nspin-extension)
[![NPM Downloads](https://img.shields.io/npm/dt/nspin-extension?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/nspin-extension)

## Overview

Lightweight async workflow utilities for [`nspin`](https://www.npmjs.com/package/nspin).

`nspin-extension` adds small workflow helpers on top of `nspin` for promise-based execution, explicit lifecycle handling, and predictable async behavior.

Built for developers who want lightweight async workflow ergonomics without introducing orchestration complexity.

## Requirements

- **Node.js v22+**
  (Uses modern APIs like `styleText` and `performance.now()`)

## Features

- **Promise-based workflow execution**
- **Explicit lifecycle helpers**
- **Lightweight state inspection**
- **Pause and resume support**
- **Runtime-safe cleanup behavior**
- **TypeScript support**
- **ESM + CommonJS compatibility**
- **Modern Node.js runtime support**

## Installation

Install via npm:

```bash
npm install nspin-extension
```

## Quick Usage

Here's a simple example to get started:

```ts
import { Spinner } from "nspin";
import { ExtendedSpinner } from "nspin-extension";

const spinner = new Spinner({
  text: "Loading data...",
});

const workflow = new ExtendedSpinner(spinner);

await workflow.run(async () => {
  await fetchData();
});
```

The workflow lifecycle remains explicit and predictable during async execution.

## Promise-Based Workflows

`nspin-extension` focuses on lightweight async workflow ergonomics.

```ts
await workflow.run(async () => {
  await performAsyncOperation();
});
```

The runtime behavior remains transparent:

- spinner lifecycle stays explicit
- errors are never hidden
- cleanup behavior remains predictable
- workflow ownership stays local

## Lifecycle Helpers

Inspect workflow state explicitly during runtime:

```ts
workflow.isRunning();
workflow.isPaused();
workflow.isStopped();
workflow.isDestroyed();
workflow.isIdle();
```

You can also inspect the current lifecycle state directly:

```ts
workflow.getLifecycleState();
```

These helpers are intentionally lightweight and runtime-focused.

## Pause and Resume

```ts
workflow.start();

workflow.pause();

workflow.resume();

workflow.stop("Completed");
```

The package prioritizes predictable lifecycle transitions over hidden automation.

## Philosophy

`nspin-extension` is intentionally small.

The package improves async workflow ergonomics without introducing:

- task orchestration
- queues
- workflow engines
- plugin systems
- centralized execution systems
- hidden runtime coordination

The goal is to preserve the simplicity and transparency of `nspin`.

## Ecosystem

### Core Runtime

- GitHub: <https://github.com/ManuelGil/nspin>
- npm: <https://www.npmjs.com/package/nspin>

### Extension Package

- GitHub: <https://github.com/ManuelGil/nspin-extension>
- npm: <https://www.npmjs.com/package/nspin-extension>

---

For more detailed information and comprehensive documentation, please visit the [GitHub repository](https://github.com/ManuelGil/nspin-extension).

*Note: This is a simplified overview. For complete documentation, usage examples, and API details, consult the full README on GitHub.*
