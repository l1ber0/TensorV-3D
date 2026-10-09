# TensorV 3D Live Preview

**中文** | [English](https://github.com/l1ber0/TensorV-3D/blob/main/README.en.md)

在 VS Code 中一边写 Python，一边查看 **三维向量箭头、立体张量格子和 PyTorch 张量快照**。停止输入约 650 ms 后，右侧检查器会用最新代码更新结果，包括尚未保存的修改。

这是基于 [Livia-Tassel/TensorV](https://github.com/Livia-Tassel/TensorV) 的独立维护 Fork，由 [l1ber0](https://github.com/l1ber0) 增加三维视图。**特别感谢原作者 Livia-Tassel**：原项目提供了张量执行引擎、快照检查、源码联动和 VS Code 集成，为本项目奠定了基础。

> 许可状态：上游没有提供 LICENSE，原插件标为 `UNLICENSED`。本仓库保留该状态，公开源码不代表获得 MIT、Apache 等开源许可。请阅读 [许可与署名说明](https://github.com/l1ber0/TensorV-3D/blob/main/LICENSE_STATUS.md)。本项目与上游的在线服务及发布相互独立。

## 功能

- **向量箭头**：支持 `[3]`、`[N, 3]`、`[3, N]`；`[3, 3]` 默认每行一个向量。
- **立体张量**：至少三维的张量显示为数值着色的格子；高维张量可固定前面的维度索引。
- **交互查看**：拖动旋转、滚轮缩放、右键拖动平移，悬停查看坐标与原始数值。
- **源码联动**：在 VS Code 原编辑器修改代码，检查器自动重新执行全文；无需保存。
- **原有检查功能**：语句快照、前后对照、二维切片、存储映射、数值统计、CSV / JSON 导出。

## 安装

1. 从 [Releases](https://github.com/l1ber0/TensorV-3D/releases) 下载 `tensorv-3d-0.4.2.vsix`。
2. 在 VS Code 扩展页面点击 `…` → **从 VSIX 安装**，选择下载的文件。
3. 按提示重新加载窗口。若之前安装了上游 `livia-tassel.tensorv`，先卸载或禁用它，避免同名命令冲突。

也可以在终端安装：

```sh
code --install-extension tensorv-3d-0.4.2.vsix
```

**安装后是独立插件**：不需要保留源码仓库，不用启动 HTTP 服务，也不用日常运行 Node.js。VSIX 包含前端和 TensorV 执行引擎，但不包含 Python 和 PyTorch。目前未发布到 Marketplace。

### 环境要求

- VS Code **1.90+**。
- Python **3.10+**，且所选版本与系统能安装 PyTorch。
- 在插件使用的解释器中安装依赖：

```sh
python -m pip install torch numpy
```

如果电脑里有多个 Python，按 `Ctrl+Shift+P`（macOS 为 `Cmd+Shift+P`），运行 **TensorV: 选择 Python 解释器**，选择已安装依赖的环境。也可配置工作区：

```json
{
  "tensorv.pythonPath": "${workspaceFolder}/.venv/Scripts/python.exe"
}
```

macOS / Linux 的虚拟环境通常使用 `${workspaceFolder}/.venv/bin/python`。解释器选择顺序：显式配置 → 工作区 `.venv` → Microsoft Python 扩展选择的解释器 → PATH 中的 `python`。

## 使用教程

1. 打开并信任你的 Python 项目，可以用仓库中的 [示例文件](https://github.com/l1ber0/TensorV-3D/blob/main/demo-3d/vectors_and_tensor.py)。
2. 打开 `.py` 文件，按 `Ctrl+Shift+P`，运行 **TensorV: 三维实时预览（自动运行）**，或点击编辑器标题栏中的三维预览按钮。
3. 检查器在右侧打开，自动运行开启。在「三维视图」的「张量」下拉框里选择变量。
4. 修改左侧坐标或 shape，停止输入约 650 ms 后查看更新。也可关闭「自动运行」，手动点击「运行」。

将下面的代码复制到自己的文件即可试用：

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

### 箭头和方块怎么切换

执行步骤与张量选择是两个独立控件。**只有在当前步骤已经创建的变量，才会出现在「张量」列表中。** 已选择的变量会保留，点击其他步骤不会强制切换变量。

| 想查看 | 先选择执行步骤 | 再选择「张量」 | 「视图」设置 |
| --- | --- | --- | --- |
| 三个箭头 | `vectors` 或其后的步骤 | `vectors [3, 3]` | 自动 / 向量箭头 |
| 64 个方块 | `cube` 或其后的步骤 | `cube [4, 4, 4]` | 自动 / 立体张量 |
| 转置后的方块 | `transposed` 步骤 | `transposed [4, 4, 4]` | 自动 / 立体张量 |

**只有箭头没有方块时**：先点上方 `cube` 或 `transposed` 步骤，再从下方「张量」列表选同名变量。在 `vectors` 创建后的第一步，`cube` 还不存在。

## 三维操作与显示范围

| 操作 | 效果 |
| --- | --- |
| 左键拖动 / 滚轮 / 右键拖动 | 旋转 / 缩放 / 平移 |
| 悬停箭头端点或方块 | 查看向量坐标 / 元素索引和数值 |
| 「重置视角」 | 重新适配视图 |
| 聚焦画布后按方向键 / `R` | 旋转 / 重置 |

向量每页最多 **24 个**，用起点查看后续向量。向量按统一比例适配视图，列表保留原始值；零向量显示为原点圆点。

立体张量每个窗口最多 **12×12×12 个格子**。最后三个维度对应 **Z、Y、X**；前面的维度使用固定索引，各三维维度使用窗口起点。蓝色到红色表示数值从小到大。非连续张量按逻辑坐标读取。

NaN、Inf、复数和无法精确表示的大整数不参与三维绘制，并显示跳过数量。三维绘制需要 WebGL / 硬件加速；数值不可用时仍可查看元数据。

## 运行边界

- 自动运行会**执行整个文件**，适合独立的张量实验代码。Python 具有当前用户的文件和网络权限，请只运行信任的代码。
- 这是顶层语句执行后的快照检查器，不读取调试器变量，也不逐次跟踪函数内部或循环的每次迭代。
- 引擎限制：最多 20,000 字符、128 个步骤、每步 32 个张量、单张量 100,000 个元素、历史数值预算 64 MiB；单次执行默认 8 秒。
- 插件通过本机 Python 子进程通信，不把源码提交到上游公共实例；用户代码自身仍可访问网络。
- 分享实验沿用原版格式，保存二维查看位置，不保存三维相机或三维选择；在三维标签分享时，接收方从张量画布打开。

## 常见问题

| 问题 | 处理 |
| --- | --- |
| `No module named torch` | 给插件实际选择的 Python 安装依赖，或重新选择解释器 |
| 编辑后不更新 | 检查「源码联动」和「自动运行」；切换文件后需在新文件运行三维预览 |
| 方块不出现 | 先选已创建 `cube` 的执行步骤，再选 `cube` 张量，确认形状至少三维 |
| 三维画布无法创建 | 启用 VS Code 硬件加速 / 检查显卡支持，暂用「张量画布」 |
| 源文件关闭后无法运行 | 重新打开文件并执行三维预览，恢复联动 |
| 命令重复或冲突 | 卸载 / 禁用上游 TensorV，只启用 `l1ber0.tensorv-3d` |

## 从源码构建

构建需要 Git 和 Node.js **20.19+ 或 22.12+**，推荐 Node.js 22；日常使用插件无需 Node.js。

```sh
git clone https://github.com/l1ber0/TensorV-3D.git
cd TensorV-3D
npm ci
npm ci --prefix extensions/vscode
npm run package:vscode
```

产物：`extensions/vscode/tensorv-3d-0.4.2.vsix`。

验证命令：`npm test`、`npm run test:vscode`、`npm run test:ui`。多 Python 环境可设置 `TENSORV_PYTHON` 指向测试解释器。Windows 可用 `scripts/test-vscode-host.ps1 -PythonPath <解释器路径>` 验证真实扩展宿主。详见 [开发指南](https://github.com/l1ber0/TensorV-3D/blob/main/CONTRIBUTING.md)。

## 致谢与来源

- [Livia-Tassel / TensorV](https://github.com/Livia-Tassel/TensorV)：感谢原作者及上游贡献者提供执行引擎、二维检查器、源码同步和 VS Code 插件。本 Fork 保留原有 Git 历史，开始修改时的上游提交为 [`19aa185`](https://github.com/Livia-Tassel/TensorV/commit/19aa185)。
- [Three.js](https://threejs.org/)：三维绘制与 OrbitControls，许可声明见 [THIRD_PARTY_NOTICES.txt](https://github.com/l1ber0/TensorV-3D/blob/main/extensions/vscode/THIRD_PARTY_NOTICES.txt)。
- [PyTorch](https://pytorch.org/) 和 [CodeMirror](https://codemirror.net/)：张量计算和编辑器。

感谢 **Livia-Tassel** 公开分享 TensorV，让这项三维增强有了基础。本仓库由 l1ber0 维护，不代表原作者，不修改原作者的在线实例。原版介绍保留在 [README.upstream.md](https://github.com/l1ber0/TensorV-3D/blob/main/README.upstream.md)，其他原版文档位于 [docs/](https://github.com/l1ber0/TensorV-3D/blob/main/docs/)。

---

# TensorV 3D Live Preview

[中文](https://github.com/l1ber0/TensorV-3D/blob/main/README.md) | **English**

Write Python in VS Code and inspect **3D vector arrows, tensor cubes, and PyTorch snapshots** beside your editor. After a pause of about 650 ms, the inspector reruns the latest code, including unsaved changes.

This is an independently maintained fork of [Livia-Tassel/TensorV](https://github.com/Livia-Tassel/TensorV), with 3D visualization added by [l1ber0](https://github.com/l1ber0). **Special thanks to Livia-Tassel**, whose execution engine, snapshot inspector, source synchronization, and VS Code integration made this enhancement possible.

> License status: upstream provides no LICENSE file and marks its extension `UNLICENSED`. This fork preserves that status. Public source availability does not grant an MIT, Apache, or other open-source license. See [license and attribution status](https://github.com/l1ber0/TensorV-3D/blob/main/LICENSE_STATUS.md). This fork is independent of upstream hosting and publishing.

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

1. Open and trust your Python workspace. Try the included [example](https://github.com/l1ber0/TensorV-3D/blob/main/demo-3d/vectors_and_tensor.py).
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

Validation: `npm test`, `npm run test:vscode`, and `npm run test:ui`. Set `TENSORV_PYTHON` to choose a test interpreter. On Windows, `scripts/test-vscode-host.ps1 -PythonPath <interpreter-path>` tests the real VS Code extension host. See [CONTRIBUTING.md](https://github.com/l1ber0/TensorV-3D/blob/main/CONTRIBUTING.md) for more development details.

## Acknowledgements and provenance

- [Livia-Tassel / TensorV](https://github.com/Livia-Tassel/TensorV): original author and contributors responsible for the execution engine, 2D inspector, source synchronization, and original extension. Git history is preserved. This fork began from upstream commit [`19aa185`](https://github.com/Livia-Tassel/TensorV/commit/19aa185).
- [Three.js](https://threejs.org/): rendering and OrbitControls; see [THIRD_PARTY_NOTICES.txt](https://github.com/l1ber0/TensorV-3D/blob/main/extensions/vscode/THIRD_PARTY_NOTICES.txt).
- [PyTorch](https://pytorch.org/) and [CodeMirror](https://codemirror.net/): tensor computation and the editor.

Thank you to **Livia-Tassel** for making TensorV publicly available and providing the foundation for this 3D enhancement. This fork is maintained by l1ber0, does not represent upstream, and does not modify its public deployment. The original introduction is preserved in [README.upstream.md](https://github.com/l1ber0/TensorV-3D/blob/main/README.upstream.md); upstream documentation remains in [docs/](https://github.com/l1ber0/TensorV-3D/blob/main/docs/).
