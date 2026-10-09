import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { spatialMode, spatialData } from './spatial-data.js';
import './spatial.css';

export function createSpatialView(root, request) {
  root.innerHTML = `<div class="spatial-tools"><label>张量 <select id="spatial-tensor" aria-label="三维张量"></select></label><label>视图 <select id="spatial-mode" aria-label="三维视图"><option value="auto">自动</option><option value="vectors">向量箭头</option><option value="volume">立体张量</option></select></label><button id="spatial-reset" class="secondary-button">重置视角</button></div><div id="spatial-indices" class="spatial-tools"></div><p id="spatial-summary" role="status">运行代码后选择张量。</p><div class="spatial-stage"><canvas tabindex="0" aria-label="三维张量，拖动旋转，滚轮缩放，方向键旋转，按 R 重置视角"></canvas><div class="spatial-labels" aria-hidden="true"></div></div><p id="spatial-readout" role="status">拖动旋转 · 滚轮缩放 · 右键拖动平移 · 悬停查看坐标与数值</p><div id="spatial-values" class="spatial-values"></div>`;
  const $ = selector => root.querySelector(selector);
  const tensorSelect = $('#spatial-tensor'), modeSelect = $('#spatial-mode');
  const canvas = $('canvas'), stage = $('.spatial-stage'), summary = $('#spatial-summary');
  const readout = $('#spatial-readout'), list = $('#spatial-values');
  let tensors = [], tensorName = null, snapshotKey = '', generation = 0, starts = [], isStale = false;
  let renderer, scene, camera, controls, group, pickables = [], labelPoints = [], initialized = false, data;
  const raycaster = new THREE.Raycaster();
  const colors = [0x73b9ff, 0xa293ff, 0xffbb70, 0x64ddb0, 0xff83a8];

  function draw() {
    if (!renderer || root.hidden || !stage.clientWidth) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    for (const { node, point } of labelPoints) {
      const p = point.clone().project(camera);
      node.style.left = `${(p.x + 1) * w / 2}px`; node.style.top = `${(1 - p.y) * h / 2}px`;
      node.hidden = p.z < -1 || p.z > 1;
    }
  }
  function initialize() {
    if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
      controls = new OrbitControls(camera, canvas); controls.addEventListener('change', draw);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x7384a0, 2.4));
      const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(4, 8, 6); scene.add(light);
      return true;
    } catch {
      summary.textContent = '无法创建三维画布，请在 VS Code 中启用硬件加速。数值仍可在张量画布中查看。';
      return false;
    }
  }
  function clearScene() {
    if (!group) return;
    scene.remove(group);
    group.traverse(object => {
      object.geometry?.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material?.dispose();
      if (object.isInstancedMesh) object.dispose();
    });
    pickables = []; labelPoints = []; $('.spatial-labels').replaceChildren();
  }
  function label(text, point, color) {
    const node = document.createElement('span'); node.textContent = text;
    node.style.color = color; $('.spatial-labels').append(node); labelPoints.push({ node, point });
  }
  function reset() {
    if (!camera || !group) return;
    const box = new THREE.Box3().expandByPoint(new THREE.Vector3());
    pickables.forEach(object => box.union(new THREE.Box3().setFromObject(object)));
    const center = box.getCenter(new THREE.Vector3());
    const span = Math.max(box.getSize(new THREE.Vector3()).length(), 2);
    camera.position.copy(center).add(new THREE.Vector3(1, 0.8, 1.4).normalize().multiplyScalar(span * 1.2 / Math.min(1, camera.aspect)));
    controls.target.copy(center); controls.update(); draw();
  }
  function populate(mode, next, tensor) {
    if (!initialize()) return;
    clearScene(); group = new THREE.Group(); scene.add(group);
    data = next;
    let axisLength = 1.4;
    if (mode === 'vectors') {
      // Normalize scene scale without changing the values shown to the user.
      const scale = Math.max(...next.items.flatMap(item => item.vector.map(Math.abs)), 1e-12);
      const grid = new THREE.GridHelper(2.6, 10, 0x526580, 0x33445c); group.add(grid);
      next.items.forEach((item, i) => {
        const end = new THREE.Vector3(...item.vector.map(v => v / scale));
        const length = end.length(), color = colors[i % colors.length];
        if (length) {
          const arrow = new THREE.ArrowHelper(end.clone().normalize(), new THREE.Vector3(), length, color, Math.min(length * .25, .12), Math.min(length * .15, .07));
          arrow.traverse(object => { object.userData.item = item; }); group.add(arrow); pickables.push(arrow);
        }
        const marker = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), new THREE.MeshBasicMaterial({ color }));
        marker.position.copy(end); marker.userData.item = item; group.add(marker); pickables.push(marker);
        if (next.items.length <= 8) label(item.index === null ? tensor.name : `${tensor.name}[${item.index}]`, end, `#${color.toString(16).padStart(6, '0')}`);
      });
      label(`坐标轴刻度 × ${scale.toPrecision(4)}`, new THREE.Vector3(0, -.2, 0), '#acb9cb');
      list.replaceChildren(...next.items.map(item => {
        const node = document.createElement('span'); node.textContent = `${tensor.name}${item.index === null ? '' : `[${item.index}]`} = (${item.vector.join(', ')})`; return node;
      }));
    } else {
      const bounds = next.items.reduce((b, item) => b.map((v, axis) => Math.max(v, item.position[axis] + 1)), [1, 1, 1]);
      axisLength = Math.max(...bounds);
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.78, .78, .78), new THREE.MeshStandardMaterial({ roughness: .55 }), next.items.length);
      const matrix = new THREE.Matrix4(), color = new THREE.Color();
      const min = tensor.stats?.min ?? 0, max = tensor.stats?.max ?? 0, scale = Math.max(Math.abs(min), Math.abs(max), 1e-12);
      next.items.forEach((item, i) => {
        matrix.makeTranslation(...item.position); mesh.setMatrixAt(i, matrix);
        const range = max / scale - min / scale;
        const t = range ? (item.value / scale - min / scale) / range : .5;
        color.setHSL((1 - t) * .66, .7, .52); mesh.setColorAt(i, color);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); group.add(mesh); pickables.push(mesh);
      const grid = new THREE.GridHelper(Math.max(...bounds) * 2, Math.max(...bounds) * 2, 0x526580, 0x33445c); grid.position.y = -.5; group.add(grid);
      list.textContent = `数值色标：蓝 ${min} → 红 ${max} · 每个方块对应一个元素，悬停查看原始索引与数值。`;
    }
    const directions = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
    directions.forEach((direction, axis) => {
      const color = [0xff7777, 0x76dc96, 0x73b9ff][axis];
      group.add(new THREE.ArrowHelper(direction, new THREE.Vector3(), axisLength, color, axisLength * .055, axisLength * .025));
      label(['X', 'Y', 'Z'][axis], direction.multiplyScalar(axisLength * 1.08), `#${color.toString(16)}`);
    });
    raycaster.params.Line.threshold = mode === 'vectors' ? .03 : .1;
    if (!initialized) { reset(); initialized = true; }
    draw();
  }
  async function load(force = false) {
    const tensor = tensors.find(t => t.name === tensorName);
    const mode = modeSelect.value === 'auto' ? spatialMode(tensor?.shape || []) : modeSelect.value;
    const key = JSON.stringify([tensor?.id, mode, starts]);
    if (root.hidden || (!force && key === snapshotKey)) return;
    snapshotKey = key;
    const token = ++generation;
    if (!tensor || !mode) { clearScene(); list.textContent = ''; summary.textContent = '选择 [3]、[N,3]、[3,N] 向量或至少三维的张量。'; draw(); return; }
    if (isStale) { summary.textContent = '代码待更新，三维视图保留上次快照。'; snapshotKey = ''; return; }
    summary.textContent = '正在读取三维快照…'; root.setAttribute('aria-busy', 'true');
    try {
      const next = await spatialData(tensor, mode, starts, request);
      if (token !== generation || isStale) return;
      summary.textContent = `${tensor.name} [${tensor.shape.join(', ')}] · ${next.description} · ${next.items.length} 个${mode === 'volume' ? '方块' : '向量'}${next.skipped ? ` · 跳过 ${next.skipped} 个非有限实数` : ''}`;
      readout.textContent = '拖动旋转 · 滚轮缩放 · 右键拖动平移 · 悬停查看坐标与数值';
      populate(mode, next, tensor);
    } catch (error) {
      if (token === generation) { clearScene(); list.textContent = ''; summary.textContent = error.message; draw(); }
    } finally { if (token === generation) root.setAttribute('aria-busy', 'false'); }
  }
  function indexControls() {
    const tensor = tensors.find(t => t.name === tensorName);
    $('#spatial-indices').replaceChildren();
    if (!tensor) return;
    const mode = modeSelect.value === 'auto' ? spatialMode(tensor.shape) : modeSelect.value;
    tensor.shape.forEach((size, axis) => {
      if (mode === 'vectors' && (tensor.shape.length === 1 || axis === (tensor.shape[1] === 3 ? 1 : 0))) return;
      const label = document.createElement('label');
      label.textContent = `d${axis}${mode === 'volume' && axis < tensor.shape.length - 3 ? ' 固定索引' : ' 起点'} `;
      const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.max = String(Math.max(0, size - 1)); input.step = '1'; input.value = String(starts[axis] || 0); input.setAttribute('aria-label', `三维 d${axis} 索引`);
      input.onchange = () => { starts[axis] = Math.max(0, Math.min(size - 1, Math.trunc(Number(input.value) || 0))); input.value = String(starts[axis]); void load(); };
      label.append(input); $('#spatial-indices').append(label);
    });
  }
  tensorSelect.onchange = () => { tensorName = tensorSelect.value; starts = []; initialized = false; indexControls(); void load(); };
  modeSelect.onchange = () => { starts = []; initialized = false; indexControls(); void load(); };
  $('#spatial-reset').onclick = reset;
  canvas.onpointermove = event => {
    if (!renderer || isStale || root.getAttribute('aria-busy') === 'true') return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    const item = hit?.instanceId !== undefined ? data?.items[hit.instanceId] : hit?.object.userData.item;
    if (!item) return;
    readout.textContent = item.vector ? `${tensorName}${item.index === null ? '' : `[${item.index}]`} = (${item.vector.join(', ')})` : `${tensorName}[${item.coord.join(', ')}] = ${item.value}`;
  };
  canvas.onkeydown = event => {
    if (!controls) return;
    if (event.key.toLowerCase() === 'r') { reset(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target), spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += event.key === 'ArrowLeft' ? .1 : event.key === 'ArrowRight' ? -.1 : 0;
    spherical.phi += event.key === 'ArrowUp' ? -.1 : event.key === 'ArrowDown' ? .1 : 0;
    spherical.makeSafe(); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update(); draw();
  };
  const observer = new ResizeObserver(draw); observer.observe(stage);
  return {
    update(next, preferred, stale) {
      isStale = stale; root.classList.toggle('stale-analysis', stale);
      if (stale) { generation++; snapshotKey = ''; root.setAttribute('aria-busy', 'false'); summary.textContent = '代码待更新，三维视图保留上次快照。'; return; }
      tensors = next || [];
      if (!tensors.some(t => t.name === tensorName)) {
        tensorName = tensors.find(t => t.name === preferred && spatialMode(t.shape))?.name || tensors.find(t => spatialMode(t.shape))?.name || tensors[0]?.name;
        starts = []; initialized = false;
      }
      tensorSelect.replaceChildren(...tensors.map(t => { const option = document.createElement('option'); option.value = t.name; option.textContent = `${t.name} [${t.shape.join(', ')}]`; return option; }));
      tensorSelect.value = tensorName || ''; indexControls(); void load(); draw();
    },
    dispose() { generation++; observer.disconnect(); controls?.dispose(); clearScene(); renderer?.dispose(); },
  };
}
