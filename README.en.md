# TensorV 3D Live Preview

[中文](README.md) | **English**

Write Python in VS Code and inspect **3D vector arrows, tensor cubes, and PyTorch snapshots** beside your editor. After a pause of about 650 ms, the inspector reruns the latest code, including unsaved changes.

This is an independently maintained fork of [Livia-Tassel/TensorV](https://github.com/Livia-Tassel/TensorV), with 3D visualization added by [l1ber0](https://github.com/l1ber0). **Special thanks to Livia-Tassel**, whose execution engine, snapshot inspector, source synchronization, and VS Code integration made this enhancement possible.

> License status: upstream provides no LICENSE file and marks its extension `UNLICENSED`. This fork preserves that status. Public source availability does not grant an MIT, Apache, or other open-source license. See [license and attribution status](LICENSE_STATUS.md). This fork is independent of upstream hosting and publishing.

## Features

- **Vector arrows:** `[3]`, `[N, 3]`, and `[3, N]`; `[3, 3]` means one vector per row.
- **Tensor cubes:** tensors with at least three dimensions; fix leading indices to inspect higher-dimensional batches.
- **Interactive view:** rotate, zoom, pan, and hover to inspect original coordinates and values.
- **Source synchronization:** edit your Python file directly in VS Code; automatic execution reruns the full file without requiring a save.
- **Existing inspector:** statement snapshots, before/after comparison, 2D slices, storage mapping, statistics, and CSV / JSON exports.

## Install

1. Download `tensorv-3d-0.4.2.vsix` from [Releases](https://github.com/l1ber0/TensorV-3D/releases).
2. In VS Code, open Extensions → `…` → **Install from VSIX**, and select the file.
3. Reload if prompted. If you installed upstream `livia-tassel.tensorv`, uninstall or disable it first to avoid command conflicts.

Alternatively:

```sh
code --install-extension tensorv-3d-0.4.2.vsix
```

**The installed extension is standalone:** you do not need this repository, an HTTP server, or Node.js for everyday use. The VSIX bundles the frontend and TensorV engine, but not Python or PyTorch. It has not been published to the Marketplace.

### Requirements

- VS Code **1.90+**.
- Python **3.10+**, on a platform and Python version supported by PyTorch.
- Install dependencies in the interpreter used by the extension:

```sh
python -m pip install torch numpy
```

For multiple interpreters, open the Command Palette (`Ctrl+Shift+P`, or `Cmd+Shift+P` on macOS) and run **TensorV: 选择 Python 解释器** (“Select Python interpreter”). Choose an environment that has the dependencies, or configure your workspace:

```json
{
  "tensorv.pythonPath": "${workspaceFolder}/.venv/Scripts/python.exe"
}
```

On macOS / Linux, a virtual environment usually uses `${workspaceFolder}/.venv/bin/python`. Resolution order: explicit setting → workspace `.venv` → Microsoft Python extension's selected interpreter → `python` on PATH.

## Tutorial

1. Open and trust your Python workspace. Try the included [example](demo-3d/vectors_and_tensor.py).
2. Open a `.py` file. Run **TensorV: 三维实时预览（自动运行）** (“3D live preview, automatic execution”) from the Command Palette, or click the 3D preview button in the editor title bar. Command IDs remain `tensorv.*`; the current UI and command titles are Chinese.
3. The inspector opens beside the editor with automatic execution enabled. Choose a variable in **张量** (“Tensor”) on the **三维视图** (“3D view”) tab.
4. Edit coordinates or shapes and pause typing for about 650 ms. Disable **自动运行** (“Automatic execution”) and click **运行** (“Run”) for manual execution instead.

Example:

```python
import torch

vectors = torch.tensor([
    [3.0, 1.0, 2.0],
    [-2.0, 3.0, 1.0],
    [1.0, -2.0, 3.0],
])
cube = torch.arange(64, dtype=torch.float32).reshape(4, 4, 4)
transposed = cube.transpose(0, 2)
```

### Switching between arrows and cubes

Execution steps and tensor selection are separate controls. **A variable appears in the tensor dropdown only after it exists in the selected step.** The selected variable is retained when you switch steps.

| View | First select a step | Then select a tensor | View mode |
| --- | --- | --- | --- |
| Three arrows | `vectors` or later | `vectors [3, 3]` | 自动 (Auto) / 向量箭头 (Vector arrows) |
| 64 cubes | `cube` or later | `cube [4, 4, 4]` | 自动 (Auto) / 立体张量 (Tensor volume) |
| Transposed cubes | `transposed` | `transposed [4, 4, 4]` | 自动 (Auto) / 立体张量 (Tensor volume) |

**If you see arrows but no cubes:** select the `cube` or `transposed` execution step first, then choose that variable in the tensor dropdown. At the first `vectors` step, `cube` has not been created yet.

## Controls and display limits

| Action | Result |
| --- | --- |
| Left drag / mouse wheel / right drag | Rotate / zoom / pan |
| Hover over an endpoint or cube | Inspect coordinates / original indices and values |
| 重置视角 (Reset view) | Fit the camera to the data |
| Arrow keys / `R` with canvas focused | Rotate / reset |

Vectors show at most **24 per page**; change the start index to inspect later vectors. A shared scale fits vectors in the scene without changing the original values in the readout. Zero vectors appear as a point at the origin.

Tensor volumes show a window of at most **12×12×12 cubes**. The last three tensor dimensions map to **Z, Y, X**. Earlier dimensions use fixed indices; the visible dimensions use window start indices. Blue to red represents smaller to larger values. Non-contiguous tensors retain logical coordinates.

NaN, Inf, complex numbers, and integers that cannot be represented exactly in JavaScript are excluded from 3D rendering; a skipped count is displayed. Rendering requires WebGL / hardware acceleration. Metadata remains available when numeric snapshots cannot be shown.

## Execution model and limits

- Automatic execution **reruns the entire file**. Use short, trusted tensor experiments. Python runs with your account's file and network permissions.
- Snapshots capture top-level statements. This is not a debugger: it does not inspect a running debugger's variables or trace every function statement / loop iteration.
- Limits: 20,000 code characters, 128 steps, 32 tensors per step, 100,000 elements per tensor, 64 MiB history budget, and an 8-second default timeout.
- The extension uses a local Python subprocess and does not submit source to the upstream public instance. Python code you run can still perform its own network operations.
- Shared experiments keep the upstream format and 2D observation settings, not the 3D camera or selection. Sharing from the 3D tab opens the tensor canvas for the recipient.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `No module named torch` | Install dependencies in the selected interpreter or choose another environment |
| Edits do not update | Check source binding and automatic execution; run 3D preview again when changing files |
| No cubes | Select a step where `cube` exists, select the `cube` tensor, and use a tensor of rank 3 or higher |
| Cannot create the 3D canvas | Enable hardware acceleration / check graphics support; use the 2D tensor canvas meanwhile |
| Source becomes unavailable | Reopen the file and run 3D preview to restore its binding |
| Duplicate commands | Disable or uninstall upstream TensorV and keep only `l1ber0.tensorv-3d` enabled |

## Build from source

Building requires Git and Node.js **20.19+ or 22.12+**; Node.js 22 is recommended. Everyday extension use does not require Node.js.

```sh
git clone https://github.com/l1ber0/TensorV-3D.git
cd TensorV-3D
npm ci
npm ci --prefix extensions/vscode
npm run package:vscode
```

Output: `extensions/vscode/tensorv-3d-0.4.2.vsix`.

Validation: `npm test`, `npm run test:vscode`, and `npm run test:ui`. Set `TENSORV_PYTHON` to choose a test interpreter. On Windows, `scripts/test-vscode-host.ps1 -PythonPath <interpreter-path>` tests the real VS Code extension host. See [CONTRIBUTING.md](CONTRIBUTING.md) for more development details.

## Acknowledgements and provenance

- [Livia-Tassel / TensorV](https://github.com/Livia-Tassel/TensorV): original author and contributors responsible for the execution engine, 2D inspector, source synchronization, and original extension. Git history is preserved. This fork began from upstream commit [`19aa185`](https://github.com/Livia-Tassel/TensorV/commit/19aa185).
- [Three.js](https://threejs.org/): rendering and OrbitControls; see [THIRD_PARTY_NOTICES.txt](extensions/vscode/THIRD_PARTY_NOTICES.txt).
- [PyTorch](https://pytorch.org/) and [CodeMirror](https://codemirror.net/): tensor computation and the editor.

Thank you to **Livia-Tassel** for making TensorV publicly available and providing the foundation for this 3D enhancement. This fork is maintained by l1ber0, does not represent upstream, and does not modify its public deployment. The original introduction is preserved in [README.upstream.md](README.upstream.md); upstream documentation remains in [docs/](docs/).
