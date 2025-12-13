<head>
<script src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"></script>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; margin: 1.6rem; background: #f7fafc; }
  textarea { width: 100%; height: 200px; font-family: monospace; padding: 8px; box-sizing: border-box; }
  .row { display:flex; gap: .5rem; margin-top:.5rem; }
  button { padding: .5rem 1rem; cursor: pointer; }
  pre { background: #fff; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-break: break-word; }
  .debug { font-size: .9rem; color: #444; margin-top:.5rem; }
  label { display:inline-flex; align-items:center; gap:.5rem; }
  #dropzone { border: 2px dashed #cbd5e1; padding: 1rem; border-radius: 8px; text-align: center; color:#64748b; margin-top:.5rem; }
</style>
</head>
<body>
<h1>GD Level String Decryptor</h1>

<label for="input">Paste Base64/GZIP/plain text here:</label>
<textarea id="input" placeholder="Paste base64 (maybe gzip) or plain text"></textarea>

<div class="row">
  <button id="decodeBtn">Decode</button>
  <button id="downloadBtn" disabled>Download decoded</button>
  <label><input type="checkbox" id="forceBase64"> Force treat input as Base64</label>
  <label><input type="checkbox" id="forceGzip"> Force treat result as GZIP</label>
</div>

<div id="dropzone">Or drop a file here (.gz, .b64, .txt). Click to choose file.
<input type="file" id="fileInput" style="display:none"></div>

<h2>Decoded Output</h2>
<pre id="output">(decoded output will appear here)</pre>

<h2>Debug</h2>
<pre id="debug" class="debug">(debug messages)</pre>

<script>
/* Helpers */

// sanitize and detect URL-safe base64 -> standard base64
function normalizeBase64(s) {
  s = s.replace(/\\s+/g, ''); // remove whitespace/newlines
  // If input looks like data URL, strip prefix
  const dataUrlMatch = s.match(/^data:[^;]+;base64,(.*)$/i);
  if (dataUrlMatch) s = dataUrlMatch[1];
  // URL-safe -> replace
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  // pad if needed
  const pad = s.length % 4;
  if (pad === 2) s += '==';
  else if (pad === 3) s += '=';
  else if (pad === 1) {
    // invalid base64 length, but we won't throw here
  }
  return s;
}

// base64 -> Uint8Array (works for arbitrary bytes)
function base64ToBytes(b64) {
  try {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (e) {
    throw new Error('atob() failed: invalid base64 input or too large');
  }
}

function isLikelyBase64(s) {
  s = s.trim();
  if (!s) return false;
  // allow data: URIs
  if (s.startsWith('data:')) return true;
  // roughly check: only base64 chars and whitespace
  return /^[A-Za-z0-9+/=\\s_-]+$/.test(s);
}

function bytesToUtf8(bytes) {
  try {
    return new TextDecoder('utf-8', {fatal:false}).decode(bytes);
  } catch (e) {
    return null;
  }
}

function bytesToHex(bytes, length=64) {
  let out = [];
  for (let i=0;i<Math.min(bytes.length, length);i++){
    out.push(bytes[i].toString(16).padStart(2,'0'));
  }
  return out.join(' ');
}

/* UI */
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const debugEl = document.getElementById('debug');
const decodeBtn = document.getElementById('decodeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const forceB64 = document.getElementById('forceBase64');
const forceGz = document.getElementById('forceGzip');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

let lastDecodedBytes = null;

function logDebug(...parts) {
  debugEl.textContent = (debugEl.textContent ? debugEl.textContent + '\\n' : '') + parts.join(' ');
}

// main decode routine
function decodeHandler() {
  debugEl.textContent = '';
  outputEl.textContent = '';
  lastDecodedBytes = null;

  const raw = inputEl.value;
  if (!raw) {
    logDebug('No input.');
    return;
  }

  // Step 1: decide if base64
  let treatedAsBase64 = forceB64.checked || isLikelyBase64(raw);
  logDebug('Input length:', raw.length, '| Force base64:', forceB64.checked, '| Looks like base64:', isLikelyBase64(raw));

  let bytes = null;
  if (treatedAsBase64) {
    const b64 = normalizeBase64(raw);
    logDebug('Normalized base64 length:', b64.length);
    try {
      bytes = base64ToBytes(b64);
      logDebug('Decoded base64 -> bytes length:', bytes.length);
    } catch (e) {
      logDebug('Base64 decode failed:', e.message);
      // fallback: interpret raw as UTF-8 bytes
      bytes = new TextEncoder().encode(raw);
      logDebug('Falling back to UTF-8 bytes from raw text, length:', bytes.length);
      treatedAsBase64 = false;
    }
  } else {
    // treat raw as text bytes (UTF-8)
    bytes = new TextEncoder().encode(raw);
    logDebug('Treating input as UTF-8 text bytes, length:', bytes.length);
  }

  // Step 2: detect gzip header 0x1f 0x8b
  const isGzip = (bytes && bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b);
  logDebug('GZIP header bytes:', bytes ? bytesToHex(bytes, 8) : '(none)', '| Detected gzip:', isGzip, '| Force gzip:', forceGz.checked);

  // If forced gzip but we don't have gzip header, still try inflate (useful if user pasted raw gz text incorrectly)
  const tryGzip = forceGz.checked || isGzip;

  if (tryGzip) {
    try {
      const inflated = pako.ungzip(bytes); // returns Uint8Array
      lastDecodedBytes = inflated;
      const maybeText = bytesToUtf8(inflated);
      outputEl.textContent = maybeText !== null ? maybeText : '[binary data] length=' + inflated.length;
      logDebug('Successfully ungzipped. Inflated length:', inflated.length);
      downloadBtn.disabled = false;
      return;
    } catch (e) {
      logDebug('pako.ungzip failed:', e && e.message ? e.message : e);
      // continue to next fallback
    }
  }

  // Step 3: If not gzip or gzip failed, attempt to decode bytes as UTF-8 text
  const text = bytesToUtf8(bytes);
  if (text !== null) {
    lastDecodedBytes = bytes;
    outputEl.textContent = text;
    logDebug('Decoded bytes as UTF-8 text. Length:', bytes.length);
    downloadBtn.disabled = false;
    return;
  }

  // Step 4: fallback: show hex and indicate binary
  lastDecodedBytes = bytes;
  outputEl.textContent = '[binary data] hex preview: ' + bytesToHex(bytes, 128) + (bytes.length>128 ? '\\n... (truncated)':'');
  downloadBtn.disabled = false;
  logDebug('All text decoding attempts failed; showing hex preview. Total bytes:', bytes.length);
}

/* download the last result */
function downloadDecoded() {
  if (!lastDecodedBytes) return;
  const blob = new Blob([lastDecodedBytes], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'decoded.bin';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* drag & drop / file input */
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#60a5fa'; });
dropzone.addEventListener('dragleave', (e) => { dropzone.style.borderColor = '#cbd5e1'; });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.borderColor = '#cbd5e1';
  const f = e.dataTransfer.files[0];
  if (f) readFileToTextarea(f);
});
fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) readFileToTextarea(f);
});

function readFileToTextarea(file) {
  const r = new FileReader();
  r.onload = function(ev) {
    // If file is binary, convert to base64
    const result = ev.target.result;
    if (typeof result === 'string') {
      // text file -> place text
      inputEl.value = result;
    } else {
      // ArrayBuffer -> base64 string
      const bytes = new Uint8Array(result);
      let binary = '';
      for (let i=0;i<bytes.byteLength;i++) binary += String.fromCharCode(bytes[i]);
      inputEl.value = btoa(binary);
    }
    logDebug('Loaded file:', file.name, 'size:', file.size, 'bytes');
  };
  // read as ArrayBuffer to handle binary files
  r.readAsArrayBuffer(file);
}

/* UI wireup */
decodeBtn.addEventListener('click', decodeHandler);
downloadBtn.addEventListener('click', downloadDecoded);

/* allow Enter+Ctrl to decode from textarea */
inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    decodeHandler();
  }
});
</script>
</body>
</html>
