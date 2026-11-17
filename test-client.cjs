/* 用最小 React 运行时执行 client.js，验证：
   1) 槽位注册形状正确；
   2) 面板只剩两个原生平台，不再承载任何 iframe；
   3) 汽水面板可拖动、可展开合集列表；电台面板已中文化。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'client.js'), 'utf8');

/* ---------------------------------------------------- 最小 hook 运行时 */

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

function makeNode() {
	return {
		getBoundingClientRect: () => ({ left: 120, top: 80, width: 900, height: 700 }),
		contentWindow: { location: { reload() {} } },
	};
}

function useRef(initial) {
	const index = current.cursor++;
	if (!(index in current.store)) current.store[index] = { current: initial || makeNode() };
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

function element(type, props, ...children) {
	return { type, props: props || {}, children };
}

const React = { useState, useEffect, useRef, useCallback, useMemo, createElement: element };

function mount(component) {
	return { component, store: [], effects: [], cursor: 0, dirty: false, tree: null };
}

/* React 会持续重渲染直到状态收敛，这里同样循环到 dirty 为假。 */
function paint(instance, props = {}) {
	let rounds = 0;
	do {
		current = instance;
		instance.cursor = 0;
		instance.dirty = false;
		instance.tree = instance.component(props);
		rounds += 1;
	} while (instance.dirty && rounds < 20);
	current = null;
	return instance.tree;
}

/* ------------------------------------------------------------ 运行环境 */

class FakeAudio {
	constructor() { this.src = ''; this.volume = 1; this.paused = true; this.currentTime = 0; }
	play() { this.paused = false; return Promise.resolve(); }
	pause() { this.paused = true; }
	load() {}
	addEventListener() {}
}

let observerCount = 0;
class FakeResizeObserver {
	constructor(cb) { this.cb = cb; observerCount += 1; }
	observe() {}
	disconnect() {}
}

const listeners = [];
/* 同步执行回调的 rAF：merely 合并帧内多次调用，不改变最终结果。 */
let rafCalls = 0;
const sandbox = {
	React,
	Audio: FakeAudio,
	ResizeObserver: FakeResizeObserver,
	requestAnimationFrame: (fn) => { rafCalls += 1; fn(); return rafCalls; },
	cancelAnimationFrame: () => {},
	fetch: () => Promise.reject(new Error('offline in test')),
	console,
	setInterval: () => 0,
	clearInterval: () => {},
	setTimeout: () => 0,
	clearTimeout: () => {},
	document: { querySelector: () => null, getElementById: () => null },
	URL,
	URLSearchParams,
};
sandbox.window = sandbox;
sandbox.window.addEventListener = (type) => listeners.push(type);
sandbox.window.removeEventListener = () => {};
sandbox.window.open = () => null;

let captured = null;
sandbox.window.__ModuleLoader__ = { load(descriptor) { captured = descriptor; } };

vm.runInContext(source, vm.createContext(sandbox), { filename: 'client.js' });

if (!captured) throw new Error('__ModuleLoader__.load 未被调用');
if (captured.id !== 'dsh-platform-hub') throw new Error(`模块 id 错误：${captured.id}`);

const api = captured.factory((name) => {
	if (name === 'react') return React;
	throw new Error(`未知依赖：${name}`);
});

if (api.name !== 'dsh-platform-hub') throw new Error('exports.name 错误');
if (!Array.isArray(api.inject) || api.inject[0] !== 'slots') throw new Error('exports.inject 错误');

const registrations = [];
api.apply({
	slots: {
		inject(owner, fn) { fn(); },
		register(options, component) { registrations.push({ options, component }); return () => {}; },
	},
});

/* ------------------------------------------------- 一、注册形状 */

const expected = [
	['main', 'key', 'dsh-platform-hub'],
	['sidebar.panellist', 'id', 'dsh-platform-hub'],
];
if (registrations.length !== expected.length) {
	throw new Error(`槽位注册数量 ${registrations.length}，应为 ${expected.length}`);
}
for (const [owner, key, value] of expected) {
	if (!registrations.some((item) => item.options.name === owner && item.options[key] === value)) {
		throw new Error(`缺少注册：${owner} / ${key}=${value}`);
	}
}
const find = (id) => registrations.find((item) => (item.options.id || item.options.key) === id);

/* ------------------------------- 二、只剩原生平台，不再承载 iframe */

const panel = mount(find('dsh-platform-hub').component);
const side = mount(registrations.find((item) => item.options.name === 'sidebar.panellist').component);

paint(side, { size: 20, active: false });
paint(panel, { size: 20, active: true });

/* 组件的 children 常是数组（来自 .map），先摊平再查找。 */
function flatChildren(node) {
	const out = [];
	for (const child of node.children || []) {
		if (Array.isArray(child)) out.push(...child.flat(3));
		else out.push(child);
	}
	return out.filter(Boolean);
}

function tabLabels(tree) {
	const bar = flatChildren(tree).find((node) => node && node.props && node.props.className === 'ph-tabs');
	if (!bar) throw new Error('找不到标签栏');
	return flatChildren(bar).map((node) => (node.children || [])[0]);
}

function clickTab(tree, label) {
	const bar = flatChildren(tree).find((node) => node && node.props && node.props.className === 'ph-tabs');
	if (!bar) throw new Error('找不到标签栏');
	const button = flatChildren(bar).find((node) => (node.children || []).includes(label));
	if (!button) throw new Error(`找不到标签：${label}`);
	button.props.onClick();
}

const labels = tabLabels(panel.tree);
if (String(labels) !== '汽水音乐,世界电台') throw new Error(`标签应为 汽水音乐,世界电台，实际 ${labels}`);
for (const gone of ['线报库', '小红书', '微信读书']) {
	if (labels.includes(gone)) throw new Error(`已移除的平台仍在标签栏：${gone}`);
}

/* 任何标签下都不得出现 iframe：两个平台都是原生面板。 */
const countFrames = (node) => {
	if (!node || typeof node !== 'object') return 0;
	if (Array.isArray(node)) return node.reduce((sum, child) => sum + countFrames(child), 0);
	if (node.type === 'iframe') return 1;
	return (node.children || []).reduce((sum, child) => sum + countFrames(child), 0);
};
for (const label of ['汽水音乐', '世界电台']) {
	clickTab(paint(panel, { size: 20, active: true }), label);
	const tree = paint(panel, { size: 20, active: true });
	if (countFrames(tree) !== 0) throw new Error(`${label} 标签下不应有 iframe`);
}
if (/new\.xianbao\.fun|xiaohongshu\.com/.test(source)) {
	throw new Error('已移除的平台 URL 仍残留在代码里');
}

/* 后台播放时前端不得显示任何悬浮内容。 */
if (/ph-pip|MiniPlayer|shell\.overlay/.test(source)) {
	throw new Error('后台播放不应在前端显示悬浮控件');
}

/* ------------------------------------ 五、新增交互（拖动 / 合集 / 电台） */

/* 组件节点在我的迷你运行时里不会展开，需要手动找到函数型子节点并单独挂载。 */
function findComponent(node, name) {
	if (!node || typeof node !== 'object') return null;
	if (typeof node.type === 'function' && node.type.name === name) return node.type;
	for (const child of node.children || []) {
		const hit = findComponent(child, name);
		if (hit) return hit;
	}
	return null;
}

const textOf = (node) => {
	const out = [];
	const walk = (item) => {
		if (item === null || item === undefined) return;
		if (Array.isArray(item)) { for (const child of item) walk(child); return; }
		if (typeof item === 'string' || typeof item === 'number') { out.push(String(item)); return; }
		if (typeof item === 'function') return;
		for (const child of item.children || []) walk(child);
	};
	walk(node);
	return out.join(' ');
};

/* 汽水面板必须有视图切换，而不是只有检索框。 */
clickTab(paint(panel, { size: 20, active: true }), '汽水音乐');
const musicHost = paint(panel, { size: 20, active: true });
const Qishui = findComponent(musicHost, 'QishuiPanel');
if (!Qishui) throw new Error('找不到汽水面板组件');
const musicText = textOf(paint(mount(Qishui), {}));
for (const word of ['推荐', '场景', '我的']) {
	if (!musicText.includes(word)) throw new Error(`汽水面板缺少视图入口：${word}`);
}

/* 电台面板必须中文化，且不再引入 iframe。 */
clickTab(paint(panel, { size: 20, active: true }), '世界电台');
const radioHost = paint(panel, { size: 20, active: true });
const Radio = findComponent(radioHost, 'RadioPanel');
if (!Radio) throw new Error('找不到电台面板组件');
const radioText = textOf(paint(mount(Radio), {}));
for (const word of ['中文电台', '新闻', '爵士', '摇滚']) {
	if (!radioText.includes(word)) throw new Error(`电台面板缺少中文分类：${word}`);
}
if (/Radiocast|Explore world radio/.test(radioText)) throw new Error('电台面板仍是英文 iframe 内容');

/* 进度条必须支持拖动：拖动中由 scrub 顶住 timeupdate，位置随拇指实时移动。 */
if (!/onInput: \(event\) => dragSeek/.test(source)) throw new Error('进度条缺少 onInput 拖动处理');
if (/value: progress,/.test(source)) throw new Error('进度条仍直接绑定 progress，拖动会被 timeupdate 覆盖');
if (!/const shownProgress = scrub === null \? progress : scrub;/.test(source)) throw new Error('缺少 scrub 中间态');
/* 松手可能发生在输入框之外（没有指针捕获），因此不只 onPointerUp 收尾。 */
for (const handler of ['onPointerUp', 'onPointerCancel', 'onMouseUp', 'onTouchEnd', 'onBlur']) {
	if (!source.includes(`${handler}: `)) throw new Error(`进度条缺少 ${handler} 收尾，拖动后可能不生效`);
}
if (!/onPointerUp: \(event\) => commitSeek/.test(source)) throw new Error('松手未提交 seek');
/* 拖动过程中就要 seek，只靠松手会在指针丢失时完全不生效。 */
if (!/const dragSeek = \(value\) =>/.test(source)) throw new Error('缺少拖动中的实时 seek');
/* 播放位置在元数据就绪前设置会被忽略，需要挂起后重放。 */
if (!/const \[scrub, setScrub\] = useState\(null\)/.test(source)) throw new Error('缺少 scrub state');
if (!/applyPending\(\)/.test(source)) throw new Error('缺少元数据就绪后重放 seek 的逻辑');

/* 换歌必须停掉上一首：先暂停、再用序号丢弃过期响应。 */
if (!/const token = \(player\.seq \+= 1\)/.test(source)) throw new Error('缺少换歌序号，慢响应会覆盖新选择');
if (!/if \(token !== player\.seq\) return;/.test(source)) throw new Error('缺少过期响应丢弃');
if (!/try \{ node\.pause\(\); \}/.test(source)) throw new Error('换歌时未暂停上一首，取不到音源会继续播旧歌');
if (!/player\.failures < Math\.min\(queue\.length, 6\)/.test(source)) throw new Error('缺少取不到音源时的跳过逻辑');

/* 点开合集必须给出歌曲列表，而不是继续用封面网格。 */
if (!/const openDetail = useCallback/.test(source)) throw new Error('缺少 openDetail');
if (!/view === 'detail'/.test(source)) throw new Error('缺少 detail 视图分支');
if (!/const trackList = \(list\) =>/.test(source)) throw new Error('缺少 trackList 列表渲染');
if (!source.includes("openDetail({ kind: 'scene'")) throw new Error('场景卡片未绑定 openDetail');

/* 下载按钮：默认最高音质，先 HEAD 探测再交给浏览器保存。 */
if (!/const download = async \(track\) =>/.test(source)) throw new Error('缺少 download 下载逻辑');
if (!/const \[dlLevel, setDlLevel\] = useState\('hires'\)/.test(source)) throw new Error('下载音质默认值不是最高档 hires');
if (!/\[BASE\]\/download\?/.test(source.replace(/\$\{/g, '[').replace(/\}/g, ']'))) throw new Error('下载链接未指向 Host 下载路由');
if (!/method: 'HEAD'/.test(source)) throw new Error('下载前缺少 HEAD 探测，失败会静默无声');
const hostSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
if (!/register\('\/download'/.test(hostSource)) throw new Error('Host 缺少 /download 路由');
if (!/const quality = \['standard', 'high', 'lossless', 'hires'\]\.includes\(asked\) \? asked : 'hires';/.test(hostSource)) {
	throw new Error('Host 下载路由未默认最高音质 hires');
}

/* 收藏与 VIP 标识：心形按钮要能收藏到「我喜欢的音乐」，会员曲要挂 VIP 徽标。 */
if (!/const isLiked = \(track\) => likedIds\.includes/.test(source)) throw new Error('缺少 isLiked 判定');
if (!/call\('like_song', \{ id, liked: !liked \}\)/.test(source)) throw new Error('收藏未调用 like_song');
if (!/const isVip = \(track\) =>/.test(source)) throw new Error('缺少 isVip 判定');
if (!/payment_type\) === 3/.test(source)) throw new Error('isVip 未按 payment_type=3 判定会员曲');
if (!/anchor\?\.type === 'vip'/.test(source)) throw new Error('isVip 未按 anchor.type=vip 兜底');
if (!/className: 'ph-vip'/.test(source)) throw new Error('缺少 VIP 徽标');
if (!/className: `ph-like\$\{isLiked/.test(source)) throw new Error('曲目行缺少收藏按钮');

/* 「我喜欢的音乐」只能拿到 id，必须换成 playlist_tracks 才拿得到曲目名与封面。 */
if (!/const liked = playlists\.find\(\(item\) => Number\(item\?\.base_info\?\.type\) === 1\)/.test(source)) {
	throw new Error('loadMine 未按 type=1 定位「我喜欢的音乐」歌单');
}
if (!/call\('playlist_tracks', \{ id: likedId/.test(source)) throw new Error('「我喜欢的音乐」仍在用 liked_songs 的 id 列表');
if (/call\('liked_songs', \{ limit: 40/.test(source)) throw new Error('「我喜欢的音乐」仍在用 liked_songs 的 id 列表');

/* 音频元素必须挂在 window 上：热重载会重新求值整个模块，模块级的 new Audio()
   会把上一个元素丢在外面继续响，而新模块以为自己掌握着唯一的播放器。 */
if (!source.includes("const AUDIO_SLOT = '__dshPlatformHubAudio__';")) {
	throw new Error('音频元素没有挂在 window 上，热重载会出现第二个播放器');
}
if (!/const audioEntry = \(key\) =>/.test(source)) throw new Error('缺少共享音频入口 audioEntry');
if (!/const adoptState = \(key, initial\) =>/.test(source)) throw new Error('播放状态未跨重载保留，进度条会变空');
if (!/handlers\.clear\(\)/.test(source)) throw new Error('事件处理器未替换旧所有者，会叠加第二个监听器');
if (!source.includes("silence('music')")) throw new Error('电台开播时没有静音音乐，两路会同时出声');

/* 顶栏的全局暂停：一个开关同时停掉音乐与电台，不必切到对应标签。 */
if (!/const stopAll = \(\) =>/.test(source)) throw new Error('缺少全局暂停处理 stopAll');
if (!source.includes('player.stop();')) throw new Error('全局暂停没有调用 player.stop()');
if (!source.includes("'暂停全部'") || !source.includes("'全部已停'")) {
	throw new Error('全局暂停按钮缺少播放中/已停的两种文案');
}

console.log(`✅ 槽位注册 ${registrations.length} 处，形状正确`);
console.log('   标签栏：', labels.join(' , '));
console.log('   iframe 数量：', countFrames(paint(panel, { size: 20, active: false })), '（应为 0）');
console.log('   汽水面板：推荐 / 场景 / 我的');
console.log('   电台面板：中文分类 + 中文电台列表');
console.log('   进度条：onInput 拖动 → 松手 seek');
console.log('   下载：默认 hires，HEAD 探测后再保存');
console.log('   收藏：like_song + 心形按钮；「我喜欢的音乐」走 playlist_tracks');
console.log('   VIP：payment_type=3 / anchor.type=vip → 徽标');
