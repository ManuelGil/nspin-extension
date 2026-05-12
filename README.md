# nspin-extension

[![NPM Version](https://img.shields.io/npm/v/nspin-extension?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/nspin-extension)
[![NPM Downloads](https://img.shields.io/npm/dt/nspin-extension?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/nspin-extension)
[![GitHub Repo Stars](https://img.shields.io/github/stars/ManuelGil/nspin-extension?style=for-the-badge&logo=github)](https://github.com/ManuelGil/nspin-extension)
[![GitHub License](https://img.shields.io/github/license/ManuelGil/nspin-extension?style=for-the-badge&logo=github)](https://github.com/ManuelGil/nspin-extension/blob/main/LICENSE)

## Overview

Lightweight async workflow utilities for [`nspin`](https://www.npmjs.com/package/nspin).

`nspin-extension` adds small workflow helpers on top of `nspin` for promise-based execution, explicit lifecycle handling, and predictable async behavior.

![nspin](https://raw.githubusercontent.com/ManuelGil/nspin/main/assets/nspin.gif)

## Index

- [nspin-extension](#nspin-extension)
  - [Overview](#overview)
  - [Index](#index)
  - [Philosophy](#philosophy)
    - [nspin](#nspin)
    - [nspin-extension](#nspin-extension-1)
  - [Features](#features)
  - [What This Package Is NOT](#what-this-package-is-not)
  - [Installation](#installation)
    - [pnpm](#pnpm)
    - [npm](#npm)
  - [Quick Start](#quick-start)
  - [Lifecycle Helpers](#lifecycle-helpers)
  - [Pause and Resume](#pause-and-resume)
  - [Explicit Workflow Ownership](#explicit-workflow-ownership)
  - [Promise-Oriented Workflows](#promise-oriented-workflows)
  - [Runtime-Safe Error Handling](#runtime-safe-error-handling)
  - [Cleanup Safety](#cleanup-safety)
  - [Development](#development)
    - [Install dependencies](#install-dependencies)
    - [Run tests](#run-tests)
    - [Validate package](#validate-package)
    - [Build package](#build-package)
  - [Validation Pipeline](#validation-pipeline)
  - [Runtime Compatibility](#runtime-compatibility)
  - [Ecosystem](#ecosystem)
    - [Core Runtime](#core-runtime)
    - [Extension Package](#extension-package)
  - [Support](#support)
  - [Feedback](#feedback)
  - [Contributing](#contributing)
  - [Code of Conduct](#code-of-conduct)
  - [Changelog](#changelog)
  - [License](#license)

## Philosophy

The ecosystem is intentionally split into two layers:

### nspin

The runtime core.

Responsible for:

- terminal rendering
- spinner lifecycle
- low-level runtime behavior
- lightweight terminal interaction

### nspin-extension

A lightweight workflow layer.

Focused on:

- promise-based workflows
- explicit lifecycle helpers
- async execution ergonomics
- runtime-safe cleanup behavior
- lightweight state inspection

The goal is to improve async workflows without introducing orchestration complexity.

## Features

- Promise-based workflow execution
- Explicit lifecycle helpers
- Lightweight state inspection
- Pause and resume support
- Runtime-safe async cleanup
- TypeScript support
- ESM + CommonJS support

## What This Package Is NOT

`nspin-extension` intentionally avoids:

- task orchestration
- queues
- workflow engines
- plugin systems
- hidden runtime automation
- centralized execution systems

Workflows remain:

- local
- explicit
- predictable
- debuggable

## Installation

### pnpm

```bash
pnpm add nspin nspin-extension
```

### npm

```bash
npm install nspin nspin-extension
```

## Quick Start

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

## Lifecycle Helpers

`nspin-extension` exposes lightweight lifecycle inspection helpers for runtime-safe workflows and debugging.

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

These helpers are intentionally small and explicit to avoid exposing internal implementation details.

## Pause and Resume

Workflows can be paused and resumed explicitly without introducing hidden coordination.

```ts
workflow.start();

workflow.pause();

workflow.resume();

workflow.stop("Completed");
```

The runtime remains predictable during async lifecycle transitions.

## Explicit Workflow Ownership

Each workflow instance manages its own lifecycle independently.

```ts
const uploadWorkflow = new ExtendedSpinner(uploadSpinner);

const downloadWorkflow = new ExtendedSpinner(downloadSpinner);
```

The package intentionally avoids:

- shared execution state
- centralized orchestration
- global workflow registries
- hidden lifecycle automation

The goal is to keep workflows easy to reason about and debug.

## Promise-Oriented Workflows

The primary abstraction provided by `nspin-extension` is `run()`.

```ts
await workflow.run(async () => {
  await performAsyncOperation();
});
```

This keeps lifecycle ownership explicit while simplifying async execution flows.

## Runtime-Safe Error Handling

Errors are never hidden or swallowed.

```ts
try {
  await workflow.run(async () => {
    await riskyOperation();
  });
} catch (error) {
  console.error(error);
}
```

The package prioritizes transparent runtime behavior over implicit automation.

## Cleanup Safety

The runtime is designed to behave safely during edge-case lifecycle transitions, including:

- stopping multiple times
- destroying inactive workflows
- destroying during execution
- restarting workflows
- async cleanup after failures

The goal is predictable lifecycle behavior with minimal abstraction overhead.

## Development

### Install dependencies

```bash
pnpm install
```

### Run tests

```bash
pnpm run test
```

### Validate package

```bash
pnpm run validate
```

### Build package

```bash
pnpm run build
```

## Validation Pipeline

Every release is validated using:

```bash
pnpm run check
pnpm run ts-check
pnpm run test
pnpm run build
pnpm run check-exports
```

This ensures:

- type correctness
- runtime stability
- ESM/CJS compatibility
- clean package exports
- ATTW validation compliance

## Runtime Compatibility

Supported environments:

- Node.js >= 22
- ESM runtimes
- CommonJS runtimes
- modern bundlers

## Ecosystem

### Core Runtime

- GitHub: <https://github.com/ManuelGil/nspin>
- npm: <https://www.npmjs.com/package/nspin>

### Extension Package

- GitHub: <https://github.com/ManuelGil/nspin-extension>
- npm: <https://www.npmjs.com/package/nspin-extension>

## Support

If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/ManuelGil/nspin-extension/issues) on GitHub.

## Feedback

If you enjoy using **nspin-extension**, please consider leaving a review on [GitHub](https://github.com/ManuelGil/nspin-extension) or sharing your feedback.

## Contributing

Contributions are welcome! To contribute:

1. Fork the [repository](https://github.com/ManuelGil/nspin-extension).
2. Create your feature branch (`git checkout -b feature/my-new-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/my-new-feature`).
5. Open a pull request.

See our [Contributing Guidelines](./docs/CONTRIBUTING.md) for more details.

## Code of Conduct

We strive to create a welcoming, inclusive, and respectful community. Please review our [Code of Conduct](./docs/CODE_OF_CONDUCT.md) before contributing.

## Changelog

For a complete list of changes, see the [CHANGELOG.md](./CHANGELOG.md).

## License

This package is licensed under the [MIT License](https://opensource.org/licenses/MIT).
