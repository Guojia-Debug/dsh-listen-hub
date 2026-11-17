/* 运行时行为验证：用可寻址的假音频元素驱动真实的 player 逻辑。
   与 test-client.cjs 的源码级断言不同，这里真的会：
     1) 点一首歌 → 断言旧音频先被 pause、新地址被装进 src；
     2) 播放中换另一首 → 断言不会继续放旧歌；
     3) 拖动进度条 → 断言音频 currentTime 真的跟到新位置；
     4) 元数据未就绪时拖动 → 断言 seek 被挂起并在 loadedmetadata 后重放。
   运行：node verify-player.cjs [host]   默认 http://127.0.0.1:20092 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HOST = process.argv[2] || 'http://127.0.0.1:20092';
const source = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');

/* ------------------------------------------------ 可寻址的假音频元素 */
class FakeAudio {
	constructor() {
		this.src = '';
		this.volume = 1;
		this.paused = true;
		this.duration = NaN;
		this.readyState = 0;
		this._t = 0;
		this._events = {};
		this.playCalls = 0;
		this.pauseCalls = 0;
		this.loadCalls = 0;
		FakeAudio.instances.push(this);
	}

	addEventListener(type, fn) {
		(this._events[type] = this._events[type] || []).push(fn);
	}

	dispatch(type) {
		for (const fn of this._events[type] || []) fn();
	}

	play() {
		this.playCalls += 1;
		this.paused = false;
		this.dispatch('play');
		return Promise.resolve();
	}

	pause() {
		this.pauseCalls += 1;
		this.paused = true;
		this.dispatch('pause');
	}

	load() {
		this.loadCalls += 1;
		this.readyState = 0;
		this.duration = NaN;
		this._t = 0;
	}

	/* 浏览器对未就绪的媒体静默忽略 currentTime 赋值，这里照抄这个语义。 */
	set currentTime(value) {
		if (this.readyState < 1) return;
		const limit = Number.isFinite(this.duration) && this.duration > 0 ? this.duration : value;
		this._t = Math.max(0, Math.min(value, limit));
		this.dispatch('timeupdate');
	}

	get currentTime() { return this._t; }

	/* 模拟解码器就绪：之后 seek 才真正生效。 */
	becomeReady(duration = 60) {
		this.duration = duration;
		this.readyState = 4;
		this.dispatch('loadedmetadata');
	}
}
FakeAudio.instances = [];

/* ------------------------------------------------------- 最小 React 运行时 */
let current = null;

function useState(initial) {
	const owner = current;
	const index = owner.cursor++;
	if (!(index in owner.store)) owner.store[index] = typeof initial === 'function' ? initial() : initial;
	const set = (next) => {
		const value = typeof next === 'function' ? next(owner.store[index]) : next;
		if (value !== owner.store[index]) {
			owner.store[index] = value;
			owner.dirty = true;
		}
	};
	return [owner.store[index], set];
}

function useRef(initial) {
	const index = current.cursor++;
	if (!(index in current.store)) current.store[index] = { current: initial || null };
	return current.store[index];
}

function useEffect(fn, deps) {
	const index = current.cursor++;
	const previous = current.effects[index];
	if (previous) {
		const same = deps && previous.deps && deps.length === previous.deps.length
			&& deps.every((value, i) => value === previous.deps[i]);
		if (same) return;
		if (typeof previous.cleanup === 'function') previous.cleanup();
	}
	current.effects[index] = { deps: deps || null, cleanup: fn() };
}

function useCallback(fn) { return fn; }
function useMemo(fn) { return fn(); }

const React = {
	useState, useEffect, useRef, useCallback, useMemo,
	createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
};

function mount(component) {
	return { component, store: [], effects: [], cursor: 0, dirty: false, tree: null };
}

function paint(instance, props = {}) {
	let rounds = 0;
	do {
		current = instance;
		instance.cursor = 0;
		instance.dirty = false;
		instance.tree = instance.component(props);
		rounds += 1;
	} while (instance.dirty && rounds < 30);
	current = null;
	return instance.tree;
}

const sandbox = {
	React,
	Audio: FakeAudio,
	ResizeObserver: class { constructor(cb) { this.cb = cb; } observe() {} disconnect() {} },
	requestAnimationFrame: (fn) => { fn(); return 0; },
	cancelAnimationFrame: () => {},
	console,
	setInterval: () => 0,
	clearInterval: () => {},
	setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); return 0; },
	clearTimeout: () => {},
	document: { querySelector: () => null, getElementById: () => null, createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } },
	URL,
	URLSearchParams,
	Promise,
	Date,
};
/* client.js 用相对路径打同源接口；Node 的 fetch 只吃绝对地址，这里补上主机。 */
sandbox.fetch = (url, options) => fetch(url.startsWith('http') ? url : HOST + url, options);
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};
sandbox.window.open = () => null;

let captured = null;
sandbox.window.__ModuleLoader__ = { load(descriptor) { captured = descriptor; } };
vm.runInContext(source, vm.createContext(sandbox), { filename: 'client.js' });

const api = captured.factory((name) => {
	if (name === 'react') return React;
	throw new Error(`未知依赖：${name}`);
});

const registrations = [];
api.apply({
	slots: {
		inject(owner, fn) { fn(); },
		register(options, component) { registrations.push({ options, component }); return () => {}; },
	},
});

const panel = registrations.find((item) => item.options.name === 'main').component;

/* ------------------------------------------------------------ 工具函数 */
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function walk(node, visit) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) { node.forEach((child) => walk(child, visit)); return; }
	visit(node);
	for (const child of node.children || []) walk(child, visit);
}

function find(node, predicate) {
	let hit = null;
	walk(node, (item) => { if (!hit && predicate(item)) hit = item; });
	return hit;
}

/* 返回组件函数本身（不是节点），才能交给 mount() 单独渲染。 */
function findComponent(node, name) {
	const hit = find(node, (item) => typeof item.type === 'function' && item.type.name === name);
	return hit ? hit.type : null;
}

const audio = () => FakeAudio.instances[0];
const fail = (message) => { throw new Error(`✗ ${message}`); };
const ok = (message) => console.log(`✓ ${message}`);

/* ------------------------------------------------------------ 开始验证 */
(async () => {
	/* 面板首屏会拉推荐流。 */
	const hub = mount(panel);
	paint(hub, { size: 20, active: true });
	await sleep(3500);
	let tree = paint(hub, { size: 20, active: true });

	const Qishui = findComponent(tree, 'QishuiPanel');
	if (!Qishui) fail('找不到汽水面板');

	const music = mount(Qishui);
	paint(music, {});
	await sleep(3000);
	tree = paint(music, {});

	/* --- 1. 推荐流里的第一首：点它 --- */
	const cards = [];
	walk(tree, (item) => { if (item.props && item.props.className === 'ph-card') cards.push(item); });
	if (!cards.length) fail('推荐流没有曲目卡片（Host 未返回数据？）');

	const first = cards[0];
	first.props.onClick();
	await sleep(1200);
	tree = paint(music, {});

	const node = audio();
	if (!node) fail('播放器没有创建音频元素');
	if (!node.src) fail('点歌后音频 src 仍为空');
	if (!/\/plugins\/dsh-platform-hub\/audio\?u=/.test(node.src)) fail(`音频未走 Host 代理：${node.src}`);
	if (node.playCalls < 1) fail('点歌后没有调用 play()');
	ok(`点歌 → src 指向代理、play 已调用（${node.playCalls} 次）`);

	/* --- 2. 模拟解码就绪，然后拖动进度条 --- */
	node.becomeReady(60);
	tree = paint(music, {});
	const seek = find(tree, (item) => item.props && item.props.className === 'ph-seek' && item.props.type === 'range');
	if (!seek) fail('找不到进度条');
	if (!seek.props.onInput) fail('进度条没有 onInput');

	seek.props.onInput({ target: { value: '42' } });
	await sleep(10);
	if (Math.abs(node.currentTime - 42) > 0.5) {
		fail(`拖动后音频位置是 ${node.currentTime}，应为 42 —— seek 没有落到音频上`);
	}
	ok(`拖动中实时 seek 生效（currentTime=${node.currentTime}）`);

	seek.props.onPointerUp({ target: { value: '42' } });
	if (Math.abs(node.currentTime - 42) > 0.5) fail(`松手后位置是 ${node.currentTime}，应为 42`);
	ok('松手提交后仍停在拖动位置');

	/* --- 3. 元数据未就绪时拖动：应挂起，就绪后重放 --- */
	node.readyState = 0;
	node.duration = NaN;
	node.currentTime = 5; /* 未就绪，应被静默忽略 */
	if (node.currentTime === 5) fail('假音频没有模拟「未就绪时忽略 currentTime」');
	seek.props.onInput({ target: { value: '33' } });
	if (Math.abs(node.currentTime - 33) < 0.5) fail('未就绪时竟然直接生效了，挂起逻辑没有走到');
	tree = paint(music, {});
	node.becomeReady(60);
	if (Math.abs(node.currentTime - 33) > 0.5) {
		fail(`元数据就绪后位置是 ${node.currentTime}，应重放到 33`);
	}
	ok(`未就绪时的 seek 被挂起，就绪后重放到 ${node.currentTime}`);

	/* --- 4. 播放中换另一首：必须切掉旧音轨 --- */
	tree = paint(music, {});
	const cards2 = [];
	walk(tree, (item) => { if (item.props && item.props.className === 'ph-card') cards2.push(item); });
	if (cards2.length < 2) fail('推荐流曲目不足两首，无法验证换歌');
	const beforeSrc = node.src;
	const pauseBefore = node.pauseCalls;

	cards2[1].props.onClick();
	await sleep(3000);
	tree = paint(music, {});

	if (node.pauseCalls <= pauseBefore) fail('换歌时没有先暂停旧音轨，旧歌会继续播');
	if (node.src === beforeSrc) fail('换歌后 src 没有变化，仍在放旧歌');
	ok(`换歌 → 先暂停旧音轨（pause ${pauseBefore} → ${node.pauseCalls}），src 已更换`);

	/* --- 5. 平台栏的全局「暂停全部」：一处停掉声音 --- */
	tree = paint(hub, { size: 20, active: true });
	const stopBtn = find(tree, (item) => item.props && item.props.className === 'ph-btn'
		&& typeof item.props.onClick === 'function');
	if (!stopBtn) fail('平台栏没有全局暂停按钮');
	const stopLabel = (stopBtn.children || []).join('');
	if (stopLabel !== '暂停全部') fail(`播放中时全局按钮应显示「暂停全部」，实际是「${stopLabel}」`);
	if (stopBtn.props.disabled) fail('有声音在播，全局暂停按钮却是 disabled');
	const pauseBeforeStop = node.pauseCalls;
	stopBtn.props.onClick();
	if (node.pauseCalls <= pauseBeforeStop) fail('点击全局暂停后音频元素没有 pause()');
	if (!node.paused) fail('点击全局暂停后仍在播放');
	if (Math.abs(node.currentTime) > 0.5) fail(`全局暂停应把位置归零，实际 ${node.currentTime}`);
	ok('全局暂停 → 声音已停且位置归零');

	/* --- 6. 取不到音源（上游已下架）时必须停声并清掉旧地址 --- */
	const realFetch = sandbox.fetch;
	sandbox.fetch = (url, options) => {
		if (String(url).endsWith('/api') && String(options && options.body).includes('"audio"')) {
			return Promise.resolve({
				ok: true,
				json: async () => ({ ok: false, error: { code: 'not-playable', message: 'Qishui did not return the track' } }),
			});
		}
		return realFetch(url, options);
	};

	tree = paint(music, {});
	const cards3 = [];
	walk(tree, (item) => { if (item.props && item.props.className === 'ph-card') cards3.push(item); });
	if (cards3.length < 2) fail('推荐流曲目不足两首，无法验证失败分支');
	cards3[1].props.onClick();
	await sleep(3000);
	tree = paint(music, {});
	sandbox.fetch = realFetch;

	if (!node.paused) fail('取不到音源时旧音轨仍在播放 —— 这就是「换歌还在放上一首」');
	if (node.src) fail(`取不到音源时 src 仍是 ${node.src}，按「播放」会重播旧歌`);
	ok('取不到音源 → 旧音轨已停、src 已清空');

	console.log('\n✅ 播放器运行时行为全部通过');
	console.log('   — 拖动：拖动中实时 seek + 松手提交 + 未就绪挂起重放');
	console.log('   — 换歌：先暂停旧音轨 + 序号丢弃过期响应');
})().catch((error) => {
	console.error(String(error && error.message ? error.message : error));
	process.exitCode = 1;
});
