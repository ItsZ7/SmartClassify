'use strict';
const $ = id => document.getElementById(id);
// FastAPI mode: the UI and API are served by the same Uvicorn process.
const USE_API = true;
const API_BASE_URL = '';
// Browser fallback remains available if USE_API is changed to false.
const MODEL_BASE_URL = './model/';
const THRESHOLD = 0.7;
let model = null, stream = null, generation = 0, timer = null, loading = false, lastResult = null;
let mode = 'empty';
const labels = ['Jam', 'Tetikus', 'Buku'];
const pretty = label => label === 'Jam' ? 'Jam tangan' : label;
const canvas = $('canvas'), video = $('video'), ctx = canvas.getContext('2d');
function message(text = '') { $('error').textContent = text; $('error').hidden = !text; }
function setModelStatus(text, state) { $('modelStatus').textContent = text; $('modelDot').className = 'dot ' + state; }
function makeScores(names) {
  $('scores').replaceChildren();
  for (const name of names) {
    const row = document.createElement('div'); row.className = 'score-row'; row.dataset.label = name;
    const label = document.createElement('span'); label.textContent = pretty(name);
    const track = document.createElement('div'); track.className = 'score-track';
    const bar = document.createElement('div'); track.append(bar);
    const value = document.createElement('span'); value.textContent = '—';
    row.append(label, track, value); $('scores').append(row);
  }
}
function emptyResult() {
  lastResult = null;
  $('prediction').textContent = 'Belum ada ramalan.';
  $('resultHint').textContent = 'Mulakan kamera atau pilih gambar untuk melihat keputusan.';
  $('confidence').replaceChildren(document.createTextNode('—'));
  const unit = document.createElement('small'); unit.textContent = '%'; $('confidence').append(unit);
  $('confidenceBar').style.width = '0%'; $('confidenceNote').textContent = 'Ambang keputusan: 70%';
  $('resultBadge').className = 'badge'; $('resultBadge').textContent = 'Menunggu input';
  makeScores(model ? model.getClassLabels() : labels);
}
function stopMedia() {
  generation++; clearTimeout(timer); timer = null;
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
  video.pause(); video.srcObject = null;
  $('cameraLabel').textContent = 'Mulakan kamera';
}
function reset() {
  stopMedia(); mode = 'empty'; message();
  canvas.hidden = true; ctx.clearRect(0, 0, canvas.width, canvas.height);
  $('emptyState').hidden = false; $('dropzone').classList.remove('has-media');
  $('sourceLabel').textContent = 'RUANG IMBASAN'; $('imageInfo').textContent = 'Bahagian tengah gambar akan dianalisis';
  $('inputMode').textContent = 'Gambar atau kamera'; $('file').value = ''; emptyResult();
  $('camera').disabled = !model; $('upload').disabled = !model;
}
function showMedia(source, info) {
  canvas.hidden = false; $('emptyState').hidden = true; $('dropzone').classList.add('has-media');
  $('sourceLabel').textContent = source; $('imageInfo').textContent = info;
}
function draw(source) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  if (!w || !h) throw new Error('Gambar belum tersedia.');
  const size = Math.min(w, h);
  // The same centered square crop is shown to the user and passed to the model.
  ctx.drawImage(source, (w - size) / 2, (h - size) / 2, size, size, 0, 0, canvas.width, canvas.height);
}
function display(predictions) {
  if (!Array.isArray(predictions) || !predictions.length || predictions.some(p => !Number.isFinite(p.probability))) throw new Error('Keputusan model tidak sah.');
  const top = predictions.reduce((best, p) => p.probability > best.probability ? p : best);
  const accepted = top.probability >= THRESHOLD;
  lastResult = { prediction: top.className, confidence: top.probability, status: accepted ? 'recognized' : 'uncertain', scores: predictions };
  const title = accepted ? pretty(top.className) : 'Tidak pasti';
  // Avoid repeatedly changing the live announcement when the class is unchanged.
  if ($('prediction').textContent !== title) $('prediction').textContent = title;
  const hint = accepted ? 'Semak sama ada objek ini sepadan dengan gambar anda.' : `Calon tertinggi: ${pretty(top.className)}. Cuba ubah sudut atau pencahayaan.`;
  if ($('resultHint').textContent !== hint) $('resultHint').textContent = hint;
  $('resultBadge').className = 'badge ' + (accepted ? 'success' : 'unsure');
  $('resultBadge').textContent = accepted ? 'Dikenal pasti' : 'Confidence rendah';
  $('confidence').textContent = (top.probability * 100).toFixed(2);
  const small = document.createElement('small'); small.textContent = '%'; $('confidence').append(small);
  $('confidenceBar').style.width = `${top.probability * 100}%`;
  $('confidenceNote').textContent = accepted ? 'Melepasi ambang 70%' : 'Di bawah ambang 70%';
  for (const row of $('scores').children) {
    const p = predictions.find(item => item.className === row.dataset.label);
    row.lastElementChild.textContent = p ? (p.probability * 100).toFixed(2) + '%' : '—';
    row.querySelector('.score-track > div').style.width = p ? `${p.probability * 100}%` : '0%';
  }
}
async function loadModel() {
  if (loading || model) return;
  loading = true; $('retry').hidden = true; message(); setModelStatus('Memuatkan model…', 'loading');
  try {
    if (USE_API) {
      const response = await fetch(API_BASE_URL + '/health');
      const health = await response.json();
      if (!response.ok || !health.model_loaded) throw new Error(health.error || 'Backend model belum sedia.');
      model = { getClassLabels: () => health.labels };
    } else {
      if (!window.tmImage || !window.tf) throw new Error('Komponen AI tidak dapat dimuatkan. Muat semula halaman.');
      await tf.ready();
      const loaded = await tmImage.load(MODEL_BASE_URL + 'model.json', MODEL_BASE_URL + 'metadata.json');
      if (loaded.getTotalClasses() !== 3) throw new Error('Model perlu mempunyai tiga kelas.');
      model = loaded;
    }
    makeScores(model.getClassLabels());
    setModelStatus('Model sedia digunakan', 'ready'); $('camera').disabled = false; $('upload').disabled = false;
  } catch (err) {
    setModelStatus('Model gagal dimuatkan', 'failed'); message('Backend model belum sedia. Semak pemasangan dan cuba semula.');
    $('retry').hidden = false; console.error(err);
  } finally { loading = false; }
}
async function predictCanvas() {
  if (!USE_API) return model.predict(canvas);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Gambar tidak dapat disediakan.');
  const form = new FormData(); form.append('file', blob, 'capture.jpg');
  const response = await fetch(API_BASE_URL + '/predict', { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Backend gagal membuat ramalan.');
  return data.scores.map(item => ({ className: item.label, probability: item.confidence }));
}
async function camera() {
  if (!model) return;
  if (mode === 'camera' || mode === 'starting') { reset(); return; }
  stopMedia(); emptyResult(); message(); mode = 'starting'; const run = generation;
  $('cameraLabel').textContent = 'Batal kamera';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera tidak disokong. Gunakan pautan HTTPS atau muat naik gambar.');
    const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
    if (run !== generation) { acquired.getTracks().forEach(t => t.stop()); return; }
    stream = acquired; video.srcObject = acquired; await video.play();
    if (run !== generation) return;
    mode = 'camera'; $('cameraLabel').textContent = 'Hentikan kamera'; $('inputMode').textContent = 'Kamera langsung';
    showMedia('KAMERA LANGSUNG', 'Letakkan objek di tengah bingkai');
    const loop = async () => {
      if (run !== generation || mode !== 'camera') return;
      try {
        if (video.readyState >= 2) { draw(video); const predictions = await predictCanvas(); if (run === generation) display(predictions); }
        if (run === generation) timer = setTimeout(loop, 400);
      } catch (err) { if (run === generation) { reset(); message('Ramalan kamera terganggu. Cuba semula atau muat naik gambar.'); } console.error(err); }
    };
    await loop();
  } catch (err) {
    if (run !== generation) return;
    reset();
    const text = err.name === 'NotAllowedError' ? 'Akses kamera tidak dibenarkan. Benarkan kamera dalam tetapan pelayar atau muat naik gambar.' : err.name === 'NotFoundError' ? 'Tiada kamera ditemui. Gunakan muat naik gambar.' : err.name === 'NotReadableError' ? 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi itu dan cuba semula.' : 'Kamera tidak dapat dimulakan. Cuba semula atau muat naik gambar.';
    message(text); console.error(err);
  }
}
async function upload(file) {
  if (!file) return;
  if (!model) { message('Tunggu sehingga model sedia digunakan.'); return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { message('Pilih gambar JPG, PNG atau WebP.'); return; }
  if (file.size > 10 * 1024 * 1024) { message('Saiz gambar melebihi 10 MB. Pilih gambar yang lebih kecil.'); return; }
  stopMedia(); mode = 'image'; message(); emptyResult(); const run = generation;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    if (run !== generation) return;
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('Gambar rosak.');
    draw(img); showMedia('GAMBAR DIMUAT NAIK', 'Bahagian tengah gambar'); $('inputMode').textContent = 'Gambar';
    $('resultBadge').textContent = 'Menganalisis…';
    const predictions = await predictCanvas();
    if (run === generation) display(predictions);
  } catch (err) {
    if (run === generation) { reset(); message('Gambar tidak dapat dianalisis. Cuba gambar JPG, PNG atau WebP yang lain.'); }
    console.error(err);
  } finally { URL.revokeObjectURL(url); }
}
$('camera').addEventListener('click', camera);
$('upload').addEventListener('click', () => { $('file').value = ''; $('file').click(); });
$('file').addEventListener('change', event => upload(event.target.files[0]));
$('reset').addEventListener('click', reset);
$('retry').addEventListener('click', () => { model = null; loadModel(); });
for (const name of ['dragenter', 'dragover']) $('dropzone').addEventListener(name, e => { e.preventDefault(); $('dropzone').classList.add('drag'); });
for (const name of ['dragleave', 'drop']) $('dropzone').addEventListener(name, e => { e.preventDefault(); $('dropzone').classList.remove('drag'); });
$('dropzone').addEventListener('drop', e => upload(e.dataTransfer.files[0]));
window.addEventListener('pagehide', stopMedia);
document.addEventListener('visibilitychange', () => { if (document.hidden && (mode === 'camera' || mode === 'starting')) reset(); });
// Optional browser-agent tools expose the same result and reset action as the UI.
const lifecycle = new AbortController();
if (document.modelContext?.registerTool) {
  const validate = input => { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Expected an empty object.'); };
  for (const tool of [
    {name:'read_classification', title:'Baca keputusan ramalan', description:'Read the current displayed prediction and model readiness without changing the image.', inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){validate(input);return {ready:!!model, mode, result:lastResult};}},
    {name:'reset_classification',title:'Reset ramalan',description:'Stop the active camera and clear the image and prediction, matching the Reset button.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){validate(input);reset();return {mode,result:lastResult};}}
  ]) { try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(console.warn); } catch(err) { console.warn(err); } }
}
window.addEventListener('pagehide', () => lifecycle.abort());
makeScores(labels); loadModel();
