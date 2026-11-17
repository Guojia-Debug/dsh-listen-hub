/**
 * Platform Hub: one sidebar panel that hosts several third-party sites side by side.
 *
 * The four site tabs are plain iframes — the user needs the real sites, real
 * logins and real playback, which only the origin itself can provide. Only
 * Qishui Music has no web player, so its host half proxies the open-source
 * car-protocol client (vendor/qishui-music-api, MIT, GSQZ/qishui-music-api)
 * and re-serves plaintext audio for the panel's own player.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const BASE = '/plugins/dsh-platform-hub';
const STORE_DIRNAME = 'platform-hub';
const require = createRequire(import.meta.url);
const { createQishuiApi, createQishuiDeviceId } = require('./vendor/qishui-music-api/index.cjs');

/* Same host allowlist the vendored client enforces; audio may only be proxied from it. */
const MEDIA_HOSTS = ['365yg.com', 'douyinvod.com', 'douyinscdn.com', 'bytefcdn.com', 'bytecdn.cn',
  'byteicdn.com', 'ibytedtos.com', 'pstatp.com', 'snssdk.com', 'bytedance.com', 'bytetos.com',
  'volcvideo.com', 'volccdn.com', 'volces.com', 'volcengineapi.com', 'douyin.com', 'qishui.com',
  'zijieapi.com', 'zjcdn.com'];

function storeDir() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, STORE_DIRNAME);
}

async function readStore() {
  try {
    const parsed = JSON.parse(await readFile(path.join(storeDir(), 'qishui.json'), 'utf8'));
    if (parsed && typeof parsed === 'object' && typeof parsed.deviceId === 'string') return parsed;
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }
  return { version: 1, deviceId: '', session: null };
}

async function writeStore(store) {
  const dir = storeDir();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'qishui.json');
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), 'utf8');
  await rename(tmp, file);
}

/** The client wants a session repository with a revision counter; persistence is ours. */
function createSessions(store) {
  let current = store.session ?? null;
  let revision = 0;
  let pending = Promise.resolve();
  const persist = () => {
    store.session = current;
    pending = pending.then(() => writeStore(store)).catch(() => {});
    return pending;
  };
  return {
    deviceId: store.deviceId,
    get revision() { return revision; },
    get: () => current,
    set(value) { current = value; revision += 1; persist(); },
    clear() { current = null; revision += 1; persist(); },
  };
}

function isLoopback(req) {
  const address = req.socket?.remoteAddress ?? '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function readBody(req, limitBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  return text.trim() === '' ? {} : JSON.parse(text);
}

/* World radio streams live on thousands of unrelated hosts, so the media
   allowlist above cannot apply; loopback and private ranges are refused
   instead, which keeps the proxy from being turned into an intranet probe. */
function isPublicAudioUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return null;
  if (/^127./.test(host) || /^10./.test(host) || /^192.168./.test(host)) return null;
  if (/^172.(1[6-9]|2[0-9]|3[01])./.test(host)) return null;
  if (/^169.254./.test(host) || host === '0.0.0.0' || host === '[::1]') return null;
  return url;
}

function trustedMediaUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const allowed = MEDIA_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  return allowed ? url : null;
}

export function apply(ctx) {
  ctx.inject(['webServer'], (scoped) => {
    scoped.effect(() => {
      let store = null;
      let api = null;
      let booting = null;

      /* First request pays the one-time store read; later ones reuse the live instance. */
      const boot = () => {
        if (booting) return booting;
        booting = (async () => {
          store = await readStore();
          if (!store.deviceId || typeof createQishuiDeviceId !== 'function') {
            store.deviceId = createQishuiDeviceId();
          }
          const sessions = createSessions(store);
          api = createQishuiApi({
            deviceId: store.deviceId,
            sessions,
            fetch: globalThis.fetch,
            log: () => {},
            warn: () => {},
          });
          await writeStore(store);
          return api;
        })();
        booting.catch(() => { booting = null; });
        return booting;
      };

      const register = (prefix, handler) => scoped.webServer.register({
        kind: 'exact',
        path: `${BASE}${prefix}`,
        handler,
      });

      const disposers = [
        /* One door for every Qishui operation; the browser never sees credentials. */
        register('/api', async (req, res) => {
          if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          let payload;
          try {
            payload = await readBody(req);
          } catch (error) {
            return sendJson(res, 400, { ok: false, error: { code: 'invalid-response', message: String(error?.message ?? error) } });
          }
          const op = typeof payload?.op === 'string' ? payload.op : '';
          const params = payload?.params && typeof payload.params === 'object' ? payload.params : {};
          if (!op) return sendJson(res, 400, { ok: false, error: { code: 'invalid-response', message: 'op required' } });
          try {
            const client = await boot();
            const result = await client.request(op, params);
            sendJson(res, 200, result);
          } catch (error) {
            sendJson(res, 500, { ok: false, error: { code: 'network', message: String(error?.message ?? error) } });
          }
        }),

        /* Audio is re-served from loopback so the panel is not subject to the CDN's referer rules. */
        register('/audio', async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          const raw = new URL(req.url, 'http://127.0.0.1').searchParams.get('u') ?? '';
          const target = trustedMediaUrl(raw);
          if (!target) return sendJson(res, 400, { error: 'untrusted media url' });
          const headers = {};
          if (typeof req.headers.range === 'string') headers.range = req.headers.range;
          let upstream;
          try {
            /* The CDN answers 302 to a signed edge first, so redirects must be followed. */
            upstream = await fetch(target, { headers, redirect: 'follow', signal: AbortSignal.timeout(30000) });
          } catch (error) {
            return sendJson(res, 502, { error: String(error?.message ?? error) });
          }
          const out = {};
          for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
            const value = upstream.headers.get(key);
            if (value) out[key] = value;
          }
          out['cache-control'] = 'private, max-age=3600';
          /* The CDN omits accept-ranges on a ranged reply. Announcing it anyway keeps
             the audio element seekable in the panel instead of falling back to a
             stream that only plays from the start. */
          out['accept-ranges'] = 'bytes';
          res.writeHead(upstream.status, out);
          if (req.method === 'HEAD' || !upstream.body) return res.end();
          try {
            for await (const chunk of upstream.body) res.write(chunk);
          } catch {
            /* client hung up mid-stream */
          }
          res.end();
        }),

        /* Highest quality the account can reach, then named so the browser saves
           it as a file instead of opening a player tab. Members still get the
           preview clip, which is flagged rather than silently pretending. */
        register('/download', async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          const params = new URL(req.url, 'http://127.0.0.1').searchParams;
          const id = (params.get('id') ?? '').trim();
          if (!id) return sendJson(res, 400, { error: 'id required' });
          const asked = (params.get('quality') ?? '').trim();
          const quality = ['standard', 'high', 'lossless', 'hires'].includes(asked) ? asked : 'hires';
          let audio;
          try {
            const client = await boot();
            /* 'hires' already resolves to the best plaintext variant on offer. */
            const result = await client.request('audio', { id, quality });
            if (!result.ok) {
              const code = result.error?.code;
              const message = code === 'unsupported'
                ? '该曲目只有加密音源，无法下载。'
                : (result.error?.message || '无法获取下载地址');
              return sendJson(res, code === 'unsupported' ? 415 : 502, { ok: false, error: { code: code || 'unavailable', message } });
            }
            audio = result.data;
          } catch (error) {
            return sendJson(res, 500, { ok: false, error: { code: 'network', message: String(error?.message ?? error) } });
          }
          const target = trustedMediaUrl(audio.url);
          if (!target) return sendJson(res, 400, { error: 'untrusted media url' });
          let upstream;
          try {
            upstream = await fetch(target, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
          } catch (error) {
            return sendJson(res, 502, { error: String(error?.message ?? error) });
          }
          if (!upstream.ok || !upstream.body) return sendJson(res, 502, { error: `upstream ${upstream.status}` });
          const type = upstream.headers.get('content-type') || 'audio/mp4';
          const extension = /flac/.test(type) ? 'flac' : /mpeg|mp3/.test(type) ? 'mp3' : /ogg/.test(type) ? 'ogg' : 'm4a';
          const pretty = (params.get('name') ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').trim().slice(0, 80) || 'qishui';
          const headers = {
            'content-type': type,
            'content-disposition': `attachment; filename="qishui.${extension}"; filename*=UTF-8''${encodeURIComponent(pretty + '.' + extension)}`,
            'x-qishui-quality': audio.quality || 'standard',
            'x-qishui-preview': audio.preview ? '1' : '0',
            'cache-control': 'no-store',
          };
          const length = upstream.headers.get('content-length');
          if (length) headers['content-length'] = length;
          res.writeHead(200, headers);
          if (req.method === 'HEAD') {
            /* The probe only wants the quality headers; drop the upstream body. */
            try { await upstream.body.cancel(); } catch { /* already closed */ }
            return res.end();
          }
          try {
            for await (const chunk of upstream.body) res.write(chunk);
          } catch {
            /* client hung up mid-download */
          }
          res.end();
        }),

        /* World radio: Radiocast itself is English-only and offers no API, so the
           panel is built on the community radio-browser index (public, keyless)
           and every stream is relayed through this proxy. */
        register('/radio/stations', async (req, res) => {
          if (req.method !== 'GET') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          const query = new URL(req.url, 'http://127.0.0.1').searchParams;
          const tag = (query.get('tag') || '').trim();
          const search = (query.get('q') || '').trim();
          const limit = Math.min(Math.max(Number(query.get('limit')) || 60, 1), 200);
          const params = new URLSearchParams({
            hidebroken: 'true',
            order: 'clickcount',
            reverse: 'true',
            limit: String(limit),
          });
          /* A keyword search must not be pinned to Chinese, or the user cannot
             reach the non-Chinese stations Radiocast used to offer. */
          if (search) params.set('name', search);
          /* Only the untargeted default is narrowed to Chinese; a keyword or a
             genre tag has to search the whole world index. */
          if (!search && !tag) params.set('language', 'chinese');
          if (tag) params.set('tagList', tag);
          let lastError = null;
          for (const host of ['de1.api.radio-browser.info', 'de2.api.radio-browser.info', 'nl1.api.radio-browser.info']) {
            try {
              const upstream = await fetch(`https://${host}/json/stations/search?${params}`, {
                headers: { 'user-agent': 'dsh-platform-hub/1.0' },
                signal: AbortSignal.timeout(12000),
              });
              if (!upstream.ok) { lastError = `upstream ${upstream.status}`; continue; }
              const rows = await upstream.json();
              const items = (Array.isArray(rows) ? rows : [])
                .filter((row) => row && typeof row.name === 'string' && row.name.trim())
                .filter((row) => row.lastcheckok === 1 && !row.hls)
                .map((row) => ({
                  id: row.stationuuid,
                  name: row.name.trim(),
                  country: row.country || '',
                  tags: String(row.tags || '').split(',').filter(Boolean).slice(0, 4),
                  codec: row.codec || '',
                  bitrate: Number(row.bitrate) || 0,
                  votes: Number(row.votes) || 0,
                  url: row.url_resolved || row.url || '',
                }))
                .filter((row) => row.url);
              return sendJson(res, 200, { ok: true, data: { items, tag, q: search } });
            } catch (error) {
              lastError = String(error?.message ?? error);
            }
          }
          sendJson(res, 502, { ok: false, error: { code: 'network', message: lastError || 'stations unavailable' } });
        }),

        /* Endless stream: the relay stops the moment the browser hangs up so a
           closed tab cannot leave a socket reading radio forever. */
        register('/radio/stream', async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          const raw = new URL(req.url, 'http://127.0.0.1').searchParams.get('u') ?? '';
          const target = isPublicAudioUrl(raw);
          if (!target) return sendJson(res, 400, { error: 'untrusted stream url' });
          const control = new AbortController();
          const hangUp = () => control.abort();
          res.on('close', hangUp);
          let upstream;
          try {
            upstream = await fetch(target, {
              headers: { 'user-agent': 'Mozilla/5.0', accept: '*/*' },
              redirect: 'follow',
              signal: control.signal,
            });
          } catch (error) {
            res.off('close', hangUp);
            return sendJson(res, 502, { error: String(error?.message ?? error) });
          }
          const out = {};
          const type = upstream.headers.get('content-type');
          out['content-type'] = type && /audio|mpeg|aac|ogg/i.test(type) ? type : 'audio/mpeg';
          out['cache-control'] = 'no-store';
          res.writeHead(upstream.status === 200 ? 200 : upstream.status, out);
          if (req.method === 'HEAD' || !upstream.body) {
            res.off('close', hangUp);
            return res.end();
          }
          try {
            for await (const chunk of upstream.body) {
              if (control.signal.aborted) break;
              if (!res.write(chunk)) await new Promise((done) => res.once('drain', done));
            }
          } catch {
            /* the listener closed the tab */
          }
          res.off('close', hangUp);
          try { res.end(); } catch { /* already closed */ }
        }),

        /* Cheap status the panel polls while a QR code is pending. */
        register('/status', async (req, res) => {
          if (req.method !== 'GET') return sendJson(res, 405, { error: 'method not allowed' });
          if (!isLoopback(req)) return sendJson(res, 403, { error: 'loopback only' });
          try {
            const client = await boot();
            const result = await client.request('login_status', {});
            sendJson(res, 200, result.ok
              ? { ok: true, user: result.data ?? null }
              : { ok: false, user: null, error: result.error });
          } catch (error) {
            sendJson(res, 200, { ok: false, user: null, error: { code: 'network', message: String(error?.message ?? error) } });
          }
        }),
      ];

      return () => {
        for (const dispose of disposers) {
          try { dispose(); } catch { /* already gone */ }
        }
      };
    });
  });
}
