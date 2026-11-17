window.__ModuleLoader__.load({
	id: 'dsh-platform-hub',
	factory(require) {
		const React = require('react');
		const h = React.createElement;
		const { useState, useEffect, useRef, useCallback, useMemo } = React;

		const PANEL_ID = 'dsh-platform-hub';
		const BASE = '/plugins/dsh-platform-hub';

		/* ------------------------------------------------------------- sites */

		const TABS = [
			{ id: 'qishui', label: '汽水音乐', hint: '扫码登录后可在后台播放，「随心听」随机开一首。' },
			{ id: 'radio', label: '世界电台', hint: '中文电台优先，按分类或关键词挑台，切走面板也不停播。' },
		];

		/* ------------------------------------------------------------- style */

		const CSS = `
.ph-root{
  --ph-line:color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent);
  --ph-line-soft:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);
  --ph-acc:var(--dsw-alias-brand-primary);
  --ph-acc-soft:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);
  --ph-acc-line:color-mix(in srgb,var(--dsw-alias-brand-primary) 38%,transparent);
  --ph-glow:color-mix(in srgb,var(--dsw-alias-brand-primary) 24%,transparent);
  --ph-panel:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent);
  display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;position:relative;
  background:
    radial-gradient(120% 72% at 108% -12%,color-mix(in srgb,var(--dsw-alias-brand-primary) 15%,transparent),transparent 62%),
    radial-gradient(90% 58% at -14% 4%,color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent),transparent 58%),
    var(--dsw-alias-bg-base);
  color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45;
}
/* ---- header ---- */
.ph-top{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;flex:0 0 auto}
.ph-logo{width:31px;height:31px;border-radius:10px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  color:var(--dsw-alias-bg-base);
  background:linear-gradient(135deg,var(--dsw-alias-brand-primary) 10%,color-mix(in srgb,var(--dsw-alias-brand-primary) 52%,#7c5cff) 100%);
  box-shadow:0 8px 20px -12px var(--dsw-alias-brand-primary),inset 0 1px 0 rgba(255,255,255,.28)}
.ph-brand{flex:1;min-width:0}
.ph-title{font-size:14px;font-weight:650;letter-spacing:.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-sub{font-size:11px;color:var(--dsw-alias-label-secondary);letter-spacing:.4px;margin-top:1px}
.ph-status{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--ph-acc);flex:0 0 auto;
  padding:3px 9px;border-radius:999px;background:var(--ph-acc-soft)}
.ph-status-idle{color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent)}
.ph-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:ph-pulse 1.9s ease-out infinite}
@keyframes ph-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 55%,transparent)}70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
/* ---- platform tabs ---- */
.ph-tabs{display:flex;gap:4px;margin:0 16px 10px;padding:4px;flex:0 0 auto;border-radius:13px;
  border:1px solid var(--ph-line-soft);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent)}
.ph-tab{flex:1;appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);
  font:inherit;font-size:12.5px;font-weight:520;padding:7px 10px;border-radius:10px;cursor:pointer;
  transition:background .18s,color .18s,box-shadow .18s;white-space:nowrap}
.ph-tab:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent)}
.ph-tab-active{color:var(--ph-acc);background:var(--ph-acc-soft);font-weight:620;
  box-shadow:inset 0 0 0 1px var(--ph-acc-line)}
/* ---- hint bar ---- */
.ph-bar{display:flex;align-items:center;gap:8px;padding:0 16px 8px;flex:0 0 auto;min-height:26px}
.ph-hint{flex:1;min-width:0;font-size:11.5px;color:var(--dsw-alias-label-secondary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ---- controls ---- */
.ph-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:27px;padding:0 10px;
  border-radius:9px;border:1px solid var(--ph-line);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent);
  color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;cursor:pointer;flex:0 0 auto;
  transition:background .16s,border-color .16s,transform .12s}
.ph-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.ph-btn:active{transform:scale(.97)}
.ph-btn:disabled{opacity:.4;cursor:default;transform:none}
.ph-btn-primary{border-color:var(--ph-acc-line);color:var(--ph-acc);background:var(--ph-acc-soft)}
.ph-iconbtn{width:29px;padding:0}
.ph-cta{border:0;color:var(--dsw-alias-bg-base);font-weight:600;letter-spacing:.2px;
  background:linear-gradient(135deg,var(--dsw-alias-brand-primary) 12%,color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,#7c5cff) 100%);
  box-shadow:0 8px 20px -12px var(--dsw-alias-brand-primary)}
.ph-cta:hover{background:linear-gradient(135deg,var(--dsw-alias-brand-primary) 0%,color-mix(in srgb,var(--dsw-alias-brand-primary) 60%,#7c5cff) 100%)}
.ph-cta:disabled{box-shadow:none}
.ph-body{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}
.ph-msg{padding:6px 16px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.ph-err{color:var(--dsw-alias-state-error-primary)}
/* ---- search ---- */
.ph-searchwrap{display:flex;align-items:center;gap:8px;padding:0 16px 10px;flex:0 0 auto}
.ph-input{flex:1;min-width:0;height:32px;padding:0 12px;border-radius:10px;border:1px solid var(--ph-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);
  color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;outline:none;
  transition:border-color .18s,box-shadow .18s,background .18s}
.ph-input::placeholder{color:color-mix(in srgb,var(--dsw-alias-label-secondary) 82%,transparent)}
.ph-input:focus{border-color:var(--ph-acc-line);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);
  box-shadow:0 0 0 3px var(--ph-glow)}
/* ---- segmented view nav ---- */
.ph-seg{display:flex;align-items:center;gap:6px;padding:0 16px 8px;flex:0 0 auto;flex-wrap:wrap}
.ph-segbtn{appearance:none;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);
  font:inherit;font-size:12px;padding:4px 11px;border-radius:999px;cursor:pointer;transition:all .16s}
.ph-segbtn:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent)}
.ph-segbtn-on{color:var(--ph-acc);background:var(--ph-acc-soft);border-color:var(--ph-acc-line);font-weight:600}
/* ---- account ---- */
.ph-account{display:flex;align-items:center;gap:8px;padding:0 16px 8px;flex:0 0 auto;font-size:11.5px;
  color:var(--dsw-alias-label-secondary)}
.ph-account-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-account strong{color:var(--dsw-alias-label-primary);font-weight:600}
/* ---- scroll surfaces ---- */
.ph-scroll{flex:1;min-height:0;overflow-y:auto;padding:2px 16px 16px;scrollbar-width:thin}
.ph-scroll::-webkit-scrollbar{width:8px}
.ph-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent);border-radius:8px}
.ph-sect{display:flex;align-items:center;gap:8px;margin:2px 0 10px;min-height:28px}
.ph-sect-title{flex:1;min-width:0;font-size:13px;font-weight:640;letter-spacing:.2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-sect-sub{font-size:11px;color:var(--dsw-alias-label-secondary);flex:0 0 auto}
/* ---- cover grid ---- */
.ph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:10px 10px;padding-bottom:6px}
.ph-card{position:relative;cursor:pointer;border-radius:14px;padding:7px;border:1px solid transparent;min-width:0;
  transition:background .18s,border-color .18s,transform .18s}
.ph-card:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 78%,transparent);
  border-color:var(--ph-line);transform:translateY(-2px)}
.ph-card-on{background:var(--ph-acc-soft);border-color:var(--ph-acc-line)}
.ph-thumb{position:relative;width:100%;aspect-ratio:1/1;border-radius:11px;overflow:hidden;
  background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;
  color:var(--dsw-alias-label-secondary);font-size:20px;box-shadow:0 12px 26px -20px rgba(0,0,0,.95)}
.ph-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s cubic-bezier(.2,.8,.3,1)}
.ph-card:hover .ph-thumb img{transform:scale(1.055)}
.ph-thumb-vip{position:absolute;top:6px;left:6px;padding:0 5px;border-radius:5px;font-size:9px;line-height:15px;
  letter-spacing:.5px;font-weight:600;color:var(--dsw-alias-bg-base);background:var(--dsw-alias-state-warn-primary)}
.ph-hoverplay{position:absolute;right:7px;bottom:7px;width:29px;height:29px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-primary);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 62%,transparent);border:1px solid var(--ph-line);
  backdrop-filter:blur(8px);opacity:0;transform:translateY(5px);transition:opacity .18s,transform .18s;
  box-shadow:0 6px 16px -10px rgba(0,0,0,.9)}
.ph-card:hover .ph-hoverplay,.ph-card-on .ph-hoverplay{opacity:1;transform:none}
.ph-cname{font-size:12px;margin-top:7px;font-weight:520;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-csub{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
/* ---- equalizer ---- */
.ph-eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;width:12px;justify-content:center;color:var(--ph-acc)}
.ph-eq i{width:2.5px;border-radius:2px;background:currentColor;height:26%;animation:ph-eq .95s ease-in-out infinite}
.ph-eq i:nth-child(2){animation-delay:.18s;height:70%}
.ph-eq i:nth-child(3){animation-delay:.36s;height:44%}
@keyframes ph-eq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
/* ---- track list ---- */
.ph-list{display:flex;flex-direction:column;gap:1px}
.ph-row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:11px;cursor:pointer;
  border:1px solid transparent;transition:background .15s,border-color .15s}
.ph-row:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);border-color:var(--ph-line-soft)}
.ph-row-on{background:var(--ph-acc-soft);border-color:var(--ph-acc-line)}
.ph-cover{width:38px;height:38px;border-radius:9px;object-fit:cover;flex:0 0 auto;
  background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;
  color:var(--dsw-alias-label-secondary);font-size:13px;overflow:hidden}
.ph-cover img{width:100%;height:100%;object-fit:cover;display:block}
.ph-meta{flex:1;min-width:0}
.ph-name{font-size:12.5px;font-weight:520;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-sub-t{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
.ph-num{font-size:11px;color:var(--dsw-alias-label-secondary);width:18px;flex:0 0 auto;text-align:center;
  font-variant-numeric:tabular-nums;display:flex;align-items:center;justify-content:center}
.ph-vip{display:inline-block;margin-left:6px;padding:0 5px;border-radius:5px;font-size:9px;line-height:14px;
  font-weight:600;vertical-align:1px;letter-spacing:.5px;color:var(--dsw-alias-bg-base);background:var(--dsw-alias-state-warn-primary)}
.ph-like{appearance:none;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);
  width:27px;height:27px;border-radius:8px;cursor:pointer;flex:0 0 auto;display:inline-flex;
  align-items:center;justify-content:center;transition:color .16s,background .16s,transform .12s}
.ph-like:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);transform:scale(1.08)}
.ph-like-on{color:var(--dsw-alias-state-error-primary)}
/* ---- player bar ---- */
.ph-player{flex:0 0 auto;margin:0 10px 10px;padding:10px 12px 11px;border-radius:17px;
  border:1px solid var(--ph-line);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 88%,transparent);
  backdrop-filter:blur(16px);display:flex;flex-direction:column;gap:8px;
  box-shadow:0 18px 40px -34px rgba(0,0,0,.95),inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent)}
.ph-np{display:flex;align-items:center;gap:10px}
.ph-npcover{position:relative;width:42px;height:42px;border-radius:11px;overflow:hidden;flex:0 0 auto;
  background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;
  color:var(--dsw-alias-label-secondary);font-size:14px}
.ph-npcover img{width:100%;height:100%;object-fit:cover;display:block}
.ph-npmeta{flex:1;min-width:0}
.ph-npname{font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-npsub{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
.ph-seekrow{display:flex;align-items:center;gap:8px}
.ph-time{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:0 0 auto;min-width:30px}
.ph-time-r{text-align:right}
/* The input keeps a 16px hit area; the 4px groove is painted by background-size,
   and the filled part comes from an inline gradient driven by shownProgress. */
.ph-seek{flex:1;min-width:0;height:16px;appearance:none;background-color:transparent;cursor:pointer;outline:none;
  background-repeat:no-repeat;background-position:center;background-size:100% 4px;border-radius:999px}
.ph-seek::-webkit-slider-runnable-track{height:4px;border-radius:999px;background:transparent}
.ph-seek::-webkit-slider-thumb{appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;
  background:var(--dsw-alias-bg-base);border:2px solid var(--dsw-alias-brand-primary);cursor:grab;
  box-shadow:0 2px 8px -2px rgba(0,0,0,.6);transition:transform .12s}
.ph-seek:active::-webkit-slider-thumb{cursor:grabbing;transform:scale(1.18)}
.ph-seek::-moz-range-track{height:4px;border-radius:999px;background:var(--dsw-alias-border-l2)}
.ph-seek::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:var(--dsw-alias-bg-base);
  border:2px solid var(--dsw-alias-brand-primary);cursor:grab}
.ph-vol{width:66px;height:14px;appearance:none;background:transparent;cursor:pointer;outline:none;flex:0 0 auto}
.ph-vol::-webkit-slider-runnable-track{height:3px;border-radius:999px;background:var(--dsw-alias-border-l2)}
.ph-vol::-webkit-slider-thumb{appearance:none;width:9px;height:9px;margin-top:-3px;border-radius:50%;
  background:var(--dsw-alias-label-secondary)}
.ph-vol::-moz-range-track{height:3px;border-radius:999px;background:var(--dsw-alias-border-l2)}
.ph-vol::-moz-range-thumb{width:9px;height:9px;border:0;border-radius:50%;background:var(--dsw-alias-label-secondary)}
.ph-ctrl{display:flex;align-items:center;gap:5px}
.ph-ghost{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-primary);
  width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;flex:0 0 auto;position:relative;transition:background .15s,color .15s,transform .12s}
.ph-ghost:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent)}
.ph-ghost:active{transform:scale(.94)}
.ph-ghost:disabled{opacity:.34;cursor:default;transform:none;background:transparent}
.ph-ghost-on{color:var(--ph-acc)}
.ph-play{width:38px;height:38px;border-radius:50%;border:0;cursor:pointer;flex:0 0 auto;
  display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-bg-base);
  background:linear-gradient(135deg,var(--dsw-alias-brand-primary) 8%,color-mix(in srgb,var(--dsw-alias-brand-primary) 58%,#7c5cff) 100%);
  box-shadow:0 10px 22px -12px var(--dsw-alias-brand-primary);transition:transform .15s,box-shadow .15s}
.ph-play:hover{transform:scale(1.06);box-shadow:0 12px 26px -12px var(--dsw-alias-brand-primary)}
.ph-play:active{transform:scale(.95)}
.ph-qbadge{position:absolute;top:-1px;right:-1px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;
  font-size:9px;line-height:15px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;
  color:var(--dsw-alias-bg-base);background:var(--dsw-alias-brand-primary)}
.ph-grow{flex:1;min-width:4px}
.ph-select{font-size:10.5px;padding:3px 4px;border-radius:7px;border:1px solid var(--ph-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);color:var(--dsw-alias-label-primary);
  outline:none;cursor:pointer;flex:0 0 auto}
.ph-dl{margin:0 16px 6px;font-size:11px;color:var(--dsw-alias-label-secondary);flex:0 0 auto}
/* ---- queue sheet ---- */
.ph-sheet{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;justify-content:flex-end;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 52%,transparent);backdrop-filter:blur(2px);
  animation:ph-fade .18s ease}
@keyframes ph-fade{from{opacity:0}to{opacity:1}}
.ph-sheet-card{max-height:76%;display:flex;flex-direction:column;border-radius:18px 18px 0 0;
  border:1px solid var(--ph-line);border-bottom:0;background:var(--dsw-alias-bg-base);
  box-shadow:0 -24px 44px -28px rgba(0,0,0,.85);animation:ph-up .24s cubic-bezier(.2,.8,.3,1)}
@keyframes ph-up{from{transform:translateY(18px);opacity:.4}to{transform:none;opacity:1}}
.ph-sheet-head{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;border-bottom:1px solid var(--ph-line-soft)}
.ph-sheet-title{flex:1;min-width:0;font-size:12.5px;font-weight:620;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-sheet-list{flex:1;min-height:0;overflow-y:auto;padding:6px 8px 12px}
/* ---- lyrics ---- */
.ph-lyrics{flex:1;min-height:0;overflow-y:auto;padding:10px 22px 24px;line-height:2;font-size:13px;
  color:var(--dsw-alias-label-secondary);text-align:center;scrollbar-width:thin}
.ph-lyric-on{color:var(--ph-acc);font-weight:620;transform:scale(1.02)}
.ph-lybar{display:flex;align-items:center;gap:8px;padding:0 16px 8px;flex:0 0 auto}
/* ---- qr / empty / spin ---- */
.ph-qr{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px}
.ph-qr img{width:168px;height:168px;border-radius:14px;background:#fff;padding:7px;
  box-shadow:0 18px 40px -28px rgba(0,0,0,.9)}
.ph-empty{display:flex;flex:1;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);
  font-size:12px;padding:30px 22px;text-align:center;line-height:1.7}
.ph-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-border-l2);
  border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:ph-spin .7s linear infinite}
@keyframes ph-spin{to{transform:rotate(360deg)}}
/* ---- radio ---- */
.ph-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;flex:0 0 auto}
.ph-chip{appearance:none;border:1px solid var(--ph-line);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);
  color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;padding:4px 11px;border-radius:999px;
  cursor:pointer;transition:all .16s;white-space:nowrap}
.ph-chip:hover{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent)}
.ph-chip-on{color:var(--ph-acc);background:var(--ph-acc-soft);border-color:var(--ph-acc-line);font-weight:600}
.ph-station{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;cursor:pointer;
  border:1px solid transparent;transition:background .15s,border-color .15s}
.ph-station:hover{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);border-color:var(--ph-line-soft)}
.ph-station-on{background:var(--ph-acc-soft);border-color:var(--ph-acc-line)}
.ph-wave{width:34px;height:34px;border-radius:10px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary)}
.ph-station-on .ph-wave{color:var(--ph-acc);background:var(--ph-acc-soft)}
.ph-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
.ph-tag{font-size:9.5px;line-height:14px;padding:0 5px;border-radius:4px;color:var(--dsw-alias-label-secondary);
  background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent)}
.ph-onair{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;color:var(--ph-acc);flex:0 0 auto}
`;

		function StyleTag() {
			return h('style', { dangerouslySetInnerHTML: { __html: CSS } });
		}

		/* ------------------------------------------------------------- icons */

		const GLYPH = {
			play: 'M8.2 5.4v13.2L18.8 12z',
			pause: 'M8 5.2h3.1v13.6H8zm4.9 0H16v13.6h-3.1z',
			prev: 'M18.2 6.2v11.6L9.6 12zM6.6 5.8v12.4',
			next: 'M5.8 6.2v11.6L14.4 12zM17.4 5.8v12.4',
			heart: 'M12 20.4l-1.3-1.2C6.2 15.1 3.4 12.5 3.4 9.3 3.4 6.7 5.4 4.7 8 4.7c1.5 0 2.9.7 4 2 1.1-1.3 2.5-2 4-2 2.6 0 4.6 2 4.6 4.6 0 3.2-2.8 5.8-7.3 9.9z',
			queue: 'M4 6.8h12M4 12h9.2M4 17.2h6.6M17.6 10.4v6.3M17.6 16.7a1.95 1.95 0 1 1-1.95-1.95',
			sparkle: 'M11.6 3.6l1.75 4.6 4.6 1.75-4.6 1.75-1.75 4.6-1.75-4.6L5.25 9.95l4.6-1.75zM18.4 15.6l.85 2.05 2.05.85-2.05.85-.85 2.05-.85-2.05-2.05-.85 2.05-.85z',
			download: 'M12 4.6v9.4m0 0l-3.5-3.5M12 14l3.5-3.5M5.2 18.6h13.6',
			volume: 'M4.4 9.9v4.2h3l3.7 3V6.9l-3.7 3zM15.2 9.3a3.9 3.9 0 0 1 0 5.4M17.7 7.1a6.9 6.9 0 0 1 0 9.8',
			search: 'M10.8 4.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8zM19.6 19.6l-4-4',
			close: 'M6.6 6.6l10.8 10.8M17.4 6.6L6.6 17.4',
			refresh: 'M19.2 12a7.2 7.2 0 1 1-2.7-5.6M19.4 4.6v5.2h-5.2',
			back: 'M14.6 5.8L8.4 12l6.2 6.2',
			radio: 'M5.4 10.6a6.6 6.6 0 0 1 13.2 0M8.4 13.6a3.6 3.6 0 0 1 7.2 0M12 17.4h.01',
			stop: 'M7 7h10v10H7z',
			lyrics: 'M5.6 6.4h12.8M5.6 11.2h12.8M5.6 16h7.6',
			disk: 'M12 4.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2zM12 10.9a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z',
			music: 'M9.2 18.2V6.6l10-2v11.6M9.2 18.2a2.4 2.4 0 1 1-2.4-2.4M19.2 16.2a2.4 2.4 0 1 1-2.4-2.4',
		};
		const FILLED = { play: 1, pause: 1, heart: 1, stop: 1 };

		function Glyph(props) {
			const name = props.name;
			const size = typeof props.size === 'number' && props.size > 0 ? props.size : 15;
			const filled = !!FILLED[name];
			return h('svg', {
				width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false',
				fill: filled ? 'currentColor' : 'none',
				stroke: filled ? 'none' : 'currentColor',
				strokeWidth: props.weight || 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
			}, h('path', { d: GLYPH[name] || GLYPH.disk }));
		}

		function Icon(props) {
			const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16;
			return h('svg', {
				width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
				stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
				strokeLinejoin: 'round', 'aria-hidden': true,
			}, [
				h('circle', { key: 'a', cx: 7.2, cy: 17, r: 2.6 }),
				h('path', { key: 'b', d: 'M9.8 17V6.9l9-1.8v3.4' }),
				h('circle', { key: 'c', cx: 16.2, cy: 15, r: 2.6 }),
			]);
		}

		/* ------------------------------------------------------- qishui utils */

		const fmt = (seconds) => {
			if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
			const total = Math.floor(seconds);
			return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
		};

		/* Qishui ships a word-level timeline; the panel only needs line starts. */
		function parseLyrics(content) {
			if (typeof content !== 'string' || !content) return [];
			const lines = [];
			for (const raw of content.split('\n')) {
				const match = raw.match(/^\[(\d+),(\d+)\](.*)$/);
				if (!match) continue;
				const text = match[3].replace(/<\d+,\d+,\d+>/g, '').trim();
				if (text) lines.push({ at: Number(match[1]) / 1000, text });
			}
			return lines;
		}

		/* Scene covers, track covers and artist avatars all share one shape:
		   { uri, urls, template_prefix }. The bare `urls[0] + uri` form the API
		   advertises answers 400 — the CDN only serves the templated variant
		   `~<template_prefix>-15.webp`, and that prefix is not the same for
		   images and avatars, so it must come from the payload. */
		function imageUrl(image) {
			if (!image || typeof image !== 'object') return '';
			if (typeof image.uri !== 'string' || !image.uri) return '';
			if (/^https?:/.test(image.uri)) return image.uri;
			const raw = Array.isArray(image.urls) ? image.urls[0] : '';
			let origin = '';
			try { origin = new URL(raw).origin; } catch { return ''; }
			const prefix = image.template_prefix || 'tplv-b829550vbb';
			return `${origin}/${image.uri}~${prefix}-15.webp`;
		}

		/* Covers live on nested card items, but a paywalled track only carries a
		   "vip" placeholder there; the artist avatar is the real fallback. */
		function coverOf(track) {
			const cards = track?.display_info?.card_items;
			if (Array.isArray(cards)) {
				for (const card of cards) {
					const image = card?.entity?.cover?.anchor?.image;
					if (typeof image?.uri === 'string' && /vip\.png$/i.test(image.uri)) continue;
					const url = imageUrl(image);
					if (url) return url;
				}
			}
			return imageUrl(track?.related_info?.artist_links?.[0]?.url_avatar);
		}

		const nameOf = (track) => track?.base_info?.name || track?.name || '未知曲目';
		const artistOf = (track) => {
			const links = track?.related_info?.artist_links;
			if (Array.isArray(links) && links.length) return links.map((a) => a.name).filter(Boolean).join(' / ');
			return track?.base_info?.song_maker_team?.composers?.map((c) => c.name).filter(Boolean).join(' / ') || '';
		};

		/* A member-only track always ships a "vip" anchor card; the payment type
		   is the cheap second opinion (2 free, 3 member). Both agreed on all 70
		   tracks sampled, so either one alone is enough. */
		const isVip = (track) => {
			if (!track) return false;
			if (Number(track?.commerce_info?.payment_type) === 3) return true;
			const cards = track?.display_info?.card_items;
			return Array.isArray(cards) && cards.some((card) => card?.entity?.cover?.anchor?.type === 'vip');
		};

		/* Endpoints disagree on wrapping: some return a bare array, others { items }. */
		const asList = (value) => {
			if (Array.isArray(value)) return value;
			if (Array.isArray(value && value.items)) return value.items;
			return [];
		};

		const shuffled = (list) => {
			const copy = list.slice();
			for (let index = copy.length - 1; index > 0; index -= 1) {
				const other = Math.floor(Math.random() * (index + 1));
				const swap = copy[index];
				copy[index] = copy[other];
				copy[other] = swap;
			}
			return copy;
		};

		/* --------------------------------------------------- player service */

		async function call(op, params) {
			try {
				const response = await fetch(`${BASE}/api`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ op, params: params || {} }),
				});
				return await response.json();
			} catch (cause) {
				return { ok: false, error: { code: 'network', message: String(cause?.message ?? cause) } };
			}
		}

		/* One audio element per role, parked on window and shared with any later copy of
		   this module. A plugin hot-reload otherwise left the previous element playing
		   with no owner left to pause it, which is how two songs ended up audible at
		   once and why pausing only ever reached the newest player. */
		const AUDIO_SLOT = '__dshPlatformHubAudio__';

		const audioSlot = () => {
			const host = window;
			if (!host[AUDIO_SLOT] || typeof host[AUDIO_SLOT] !== 'object') host[AUDIO_SLOT] = {};
			return host[AUDIO_SLOT];
		};

		const AUDIO_TYPES = ['play', 'pause', 'timeupdate', 'loadedmetadata', 'canplay', 'ended', 'error', 'waiting', 'playing'];

		/* Handlers live in a Set owned by the slot: a reloaded module swaps the owner
		   instead of stacking a second listener on the same element. */
		const audioEntry = (key) => {
			const slot = audioSlot();
			let entry = slot[key];
			if (!entry || !entry.node) {
				entry = slot[key] = { node: new Audio(), handlers: new Set(), bound: false };
			}
			if (!entry.bound) {
				entry.bound = true;
				const node = entry.node;
				for (const type of AUDIO_TYPES) {
					node.addEventListener(type, () => {
						for (const fn of Array.from(entry.handlers)) {
							try { fn(type); } catch { /* a stale owner must not silence playback */ }
						}
					});
				}
			}
			return entry;
		};

		/* The state travels with the element: after a reload the progress bar and the
		   track title still describe what is actually playing. */
		const adoptState = (key, initial) => {
			const slot = audioSlot();
			if (!slot[key] || typeof slot[key] !== 'object') slot[key] = initial;
			return slot[key];
		};

		const silence = (key) => {
			const entry = audioSlot()[key];
			if (!entry || !entry.node) return;
			try { entry.node.pause(); } catch { /* already detached */ }
		};

		/* The queue outlives the panel: opening another sidebar entry unmounts
		   this React tree, so the audio element is detached from it on purpose.
		   Its state rides along on the slot, otherwise a hot-reload would blank the
		   progress bar and forget the track while the element kept playing. */
		const player = {
			audio: null,
			state: adoptState('musicState', {
				current: null, src: '', playing: false, progress: 0, duration: 0,
				volume: 0.8, lyrics: [], queue: [], index: -1, note: '',
			}),
			listeners: new Set(),
			/* Bumped on every load, so a slow address lookup cannot overwrite a newer pick.
			   Kept on the shared slot: a player left behind by an earlier copy of this
			   module must not see its own stale token still matching and then grab the
			   element back mid-song. */
			get seq() { return audioSlot().seq || 0; },
			set seq(value) { audioSlot().seq = value; },
			/* Seek requested while the media was still loading, replayed once metadata lands. */
			get pending() { return audioSlot().pending ?? null; },
			set pending(value) { audioSlot().pending = value; },
			/* Consecutive unplayable tracks in the current queue. */
			failures: 0,
			patch(next) {
				Object.assign(player.state, next);
				for (const fn of Array.from(player.listeners)) {
					try { fn(); } catch { /* a stale listener must not stop playback */ }
				}
			},
			subscribe(fn) {
				player.listeners.add(fn);
				return () => { player.listeners.delete(fn); };
			},
			node() {
				/* A single element per role, shared with any previous copy of this module,
				   so a reload cannot end up with two players fighting over the sound. */
				const entry = audioEntry('music');
				const node = entry.node;
				if (player.audio === node) return node;
				entry.handlers.clear();
				node.preload = 'auto';
				node.volume = player.state.volume;
				entry.handlers.add((type) => {
					if (type === 'play') player.patch({ playing: true });
					else if (type === 'pause') player.patch({ playing: false });
					else if (type === 'timeupdate') player.patch({ progress: node.currentTime || 0 });
					else if (type === 'loadedmetadata') {
						player.patch({ duration: node.duration || 0 });
						/* A seek issued against a not-yet-loaded source is silently clamped to 0,
						   so it is replayed here once the true duration is known. */
						if (player.pending !== null) player.applyPending();
					} else if (type === 'canplay') {
						if (player.pending !== null) player.applyPending();
					} else if (type === 'ended') {
						player.step(1);
					} else if (type === 'error') {
						if (player.state.src) player.patch({ note: '音源加载失败，请换一首。', playing: false });
					}
				});
				player.audio = node;
				return node;
			},
			async load(track, index, queue) {
				const node = player.node();
				const token = (player.seq += 1);
				if (queue) player.state.queue = queue;
				if (typeof index === 'number') player.state.index = index;
				/* Switching songs must not overlap: pausing first is what stops the previous
				   track from playing on when the new address cannot be resolved. */
				try { node.pause(); } catch { /* a detached element is already silent */ }
				player.pending = null;
				player.patch({ current: track, src: '', note: '', progress: 0, duration: 0, lyrics: [], playing: false });
				const result = await call('audio', { id: track.id, quality: 'standard' });
				/* A later pick already won; dropping this reply keeps the shown track and the audio in step. */
				if (token !== player.seq) return;
				if (!result.ok) {
					const lost = result.error?.code === 'not-playable' || result.error?.code === 'network';
					/* Dropping the source matters: leaving the old address in place lets the
					   play button resume the previous track after a failed switch. */
					try { node.src = ''; } catch { /* detached element */ }
					player.patch({
						note: result.error?.code === 'unsupported'
							? '该曲目仅提供加密音源，本项目不解密，请换一首。'
							: lost
								? `这首取不到音源（${result.error?.message || '上游未返回曲目'}），已跳过。`
								: (result.error?.message || '无法获取播放地址'),
					});
					/* Files removed upstream hide inside long playlists, so a skip keeps the queue moving. */
					player.failures += 1;
					if (queue && index >= 0 && player.failures < Math.min(queue.length, 6)) {
						const next = (index + 1) % queue.length;
						player.load(queue[next], next, queue);
					}
					return;
				}
				player.failures = 0;
				/* The Host proxy keeps the CDN URL and the range requests server-side. */
				player.patch({
					src: `${BASE}/audio?u=${encodeURIComponent(result.data.url)}`,
					note: result.data.preview ? '会员曲目，仅能播放试听片段。' : '',
					progress: 0,
				});
				node.src = player.state.src;
				node.load();
				const attempt = node.play();
				if (attempt && typeof attempt.catch === 'function') attempt.catch(() => player.patch({ playing: false }));
				const lyric = await call('lyrics', { id: track.id });
				if (token !== player.seq) return;
				player.patch({ lyrics: lyric.ok ? parseLyrics(lyric.data?.lyric_entity?.content) : [] });
			},
			step(delta) {
				const { queue, index } = player.state;
				if (!queue.length) return;
				if (delta > 0) player.failures = 0;
				const next = (index + delta + queue.length) % queue.length;
				player.load(queue[next], next);
			},
			toggle() {
				const node = player.node();
				if (node.paused) { const p = node.play(); if (p && p.catch) p.catch(() => {}); }
				else node.pause();
			},
			/* Halts the sound but keeps the track, so the master stop button is a pause
			   at zero rather than a teardown: pressing play again resumes from the top. */
			stop() {
				const node = player.node();
				player.pending = null;
				try { node.pause(); } catch { /* already detached */ }
				try { node.currentTime = 0; } catch { /* metadata not ready */ }
				player.patch({ playing: false, progress: 0 });
			},
			/* Seeking before metadata arrives is accepted by the element and then ignored,
			   so the target is stored and replayed on loadedmetadata/canplay. */
			applyPending() {
				const node = player.node();
				const value = player.pending;
				if (value === null) return;
				const limit = Number.isFinite(node.duration) && node.duration > 0 ? node.duration : value;
				player.pending = null;
				try {
					node.currentTime = Math.max(0, Math.min(value, limit));
					player.patch({ progress: node.currentTime });
				} catch {
					player.pending = value;
				}
			},
			seek(value) {
				const node = player.node();
				player.patch({ progress: value });
				if (node.readyState < 1) { player.pending = value; return; }
				try {
					node.currentTime = value;
				} catch {
					player.pending = value;
				}
			},
			setVolume(value) {
				player.state.volume = value;
				player.node().volume = value;
				player.patch({});
			},
		};

		/* ------------------------------------------------------ qishui panel */

		function QishuiPanel() {
			const [query, setQuery] = useState('');
			const [user, setUser] = useState(null);
			const [qr, setQr] = useState('');
			const [qrNote, setQrNote] = useState('');
			const [showLyrics, setShowLyrics] = useState(false);
			const [view, setView] = useState('home');
			const [busy, setBusy] = useState('');
			const [tracks, setTracks] = useState([]);
			const [scenes, setScenes] = useState([]);
			const [scene, setScene] = useState(null);
			const [mine, setMine] = useState(null);
			const [detail, setDetail] = useState(null);
			const [detailTracks, setDetailTracks] = useState([]);
			const [detailBusy, setDetailBusy] = useState(false);
			const [tip, setTip] = useState('');
			const [, setBeat] = useState(0);
			const [likedIds, setLikedIds] = useState([]);
			const [dlLevel, setDlLevel] = useState('hires');
			const [dlNote, setDlNote] = useState('');
			const [dlBusy, setDlBusy] = useState(false);
			const [queueOpen, setQueueOpen] = useState(false);

			const pollRef = useRef(null);

			/* Re-render whenever the detached player publishes a change. */
			useEffect(() => {
				player.node();
				const stop = player.subscribe(() => setBeat((value) => value + 1));
				return stop;
			}, []);

			const { current, playing, progress, duration, volume, lyrics, note, queue, index } = player.state;
			/* While the thumb is held, timeupdate must not override the value the
			   user is dragging; the seek is committed on release instead. */
			const [scrub, setScrub] = useState(null);
			const shownProgress = scrub === null ? progress : scrub;
			/* The audio is moved while the thumb travels, so the position under the thumb is
			   already the audible one. Pointer capture on the input is not guaranteed, hence
			   every release path clears the drag state instead of only onPointerUp. */
			const draggingRef = useRef(false);
			const lastSeekRef = useRef(0);
			/* Moves the audio while the thumb travels as well, throttled: relying on the
			   release alone left the position unchanged whenever pointerup was delivered
			   outside the input (no pointer capture), which is what made drags look dead. */
			const dragSeek = (value) => {
				draggingRef.current = true;
				setScrub(value);
				const now = Date.now();
				if (now - lastSeekRef.current < 120) return;
				lastSeekRef.current = now;
				player.seek(value);
			};
			const commitSeek = (value) => {
				draggingRef.current = false;
				lastSeekRef.current = 0;
				setScrub(null);
				player.seek(value);
			};

			const error = note;

			const refreshUser = useCallback(async () => {
				const result = await call('login_status', {});
				if (result.ok) setUser(result.data ?? null);
			}, []);

			/* The heart has to be right for tracks that were never loaded in this
			   session, so the liked ids come from the account, not from the list. */
			const refreshLiked = useCallback(async () => {
				const result = await call('liked_songs', {});
				if (result.ok) setLikedIds((result.data?.ids || []).map(String));
			}, []);

			useEffect(() => {
				if (user) refreshLiked();
				else setLikedIds([]);
			}, [user, refreshLiked]);

			const isLiked = (track) => likedIds.includes(String(track?.id ?? ''));

			const toggleLike = useCallback(async (track) => {
				const id = String(track?.id ?? '');
				if (!id) return;
				if (!user) { setTip('登录后才能收藏。'); return; }
				const liked = likedIds.includes(id);
				const keep = (list, add) => (add
					? [...list, track]
					: list.filter((item) => String(item.id ?? item) !== id));
				setLikedIds(liked ? likedIds.filter((item) => item !== id) : [...likedIds, id]);
				setMine((prev) => (prev ? { ...prev, liked: keep(prev.liked || [], !liked) } : prev));
				const result = await call('like_song', { id, liked: !liked });
				if (!result.ok) {
					/* Roll both copies back so the heart never lies about the account. */
					setLikedIds(likedIds);
					setMine((prev) => (prev ? { ...prev, liked: keep(prev.liked || [], liked) } : prev));
					setTip(result.error?.message || '收藏失败');
					return;
				}
				setTip('');
			}, [likedIds, user]);

			useEffect(() => { refreshUser(); }, [refreshUser]);
			useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

			/* The recommendation stream advances server-side on every request,
			   so a plain refetch is the natural "next batch" button. */
			const loadFeed = useCallback(async (sceneId, explore) => {
				setBusy('feed');
				const params = { count: 24 };
				if (sceneId) params.scene = String(sceneId);
				if (explore) params.queue = 'explore';
				const result = await call('feed', params);
				setBusy('');
				if (!result.ok) { setTip(result.error?.message || '推荐流加载失败'); return; }
				setTracks(asList(result.data));
				setTip('');
			}, []);

			const loadScenes = useCallback(async () => {
				const result = await call('feed_modes', {});
				if (result.ok) setScenes(asList(result.data));
			}, []);

			useEffect(() => { loadFeed(null); loadScenes(); }, [loadFeed, loadScenes]);

			const loadMine = useCallback(async () => {
				setBusy('mine');
				const lists = await call('user_playlists', {});
				const playlists = lists.ok ? asList(lists.data) : [];
				/* "我喜欢的音乐" arrives as ids only, so it is fetched like any other
				   playlist instead — type 1 is the account's liked collection. */
				const liked = playlists.find((item) => Number(item?.base_info?.type) === 1);
				const likedId = liked?.base_info?.id || liked?.id || '';
				const results = await Promise.all([
					likedId
						? call('playlist_tracks', { id: likedId, ownerId: liked?.base_info?.owner_id || '', limit: 40, offset: 0 })
						: call('liked_songs', {}),
					call('recent_played', { limit: 40, offset: 0 }),
				]);
				setBusy('');
				setMine({
					liked: results[0].ok ? asList(results[0].data) : [],
					recent: results[1].ok ? asList(results[1].data) : [],
					lists: playlists,
				});
			}, []);

			const search = useCallback(async () => {
				const text = query.trim();
				if (!text) return;
				setBusy('search');
				const result = await call('search', { query: text, limit: 30, offset: 0 });
				setBusy('');
				setView('search');
				if (!result.ok) { setTip(result.error?.message || '搜索失败'); setTracks([]); return; }
				setTracks(asList(result.data));
				setTip('');
			}, [query]);

			const pickScene = useCallback(async (item) => {
				setScene(item);
				setView('home');
				await loadFeed(item.id);
			}, [loadFeed]);

			/* 随心听：不挑场景、不挑曲目，抽一批推荐打散后排进队列，直接开声。 */
			const shuffleListen = useCallback(async () => {
				if (busy === 'shuffle') return;
				setBusy('shuffle');
				setTip('');
				const result = await call('feed', { count: 50, queue: 'explore' });
				setBusy('');
				if (!result.ok) { setTip(result.error?.message || '随心听没能取到曲目'); return; }
				const list = shuffled(asList(result.data));
				if (!list.length) { setTip('这次没抽到曲目，再点一次试试。'); return; }
				setScene(null);
				setView('home');
				setTracks(list);
				player.load(list[0], 0, list);
				setTip(`随心听 · 随机排好 ${list.length} 首`);
			}, [busy]);

			/* 播放列表里换顺序：整队打散并从第一首开始，队列索引才不会指错人。 */
			const shuffleQueue = () => {
				const list = player.state.queue;
				if (list.length < 2) return;
				const mixed = shuffled(list);
				player.load(mixed[0], 0, mixed);
			};

			const startLogin = useCallback(async () => {
				setQrNote('正在生成二维码…');
				const key = await call('login_qr_key', {});
				if (!key.ok) {
					setQrNote(`生成失败：${key.error?.message || '未知错误'}`);
					return;
				}
				const image = await call('login_qr_create', { key: key.data.key });
				if (!image.ok) {
					setQrNote(`生成失败：${image.error?.message || '未知错误'}`);
					return;
				}
				setQr(image.data.imageUrl);
				setQrNote('用汽水音乐 App 扫码登录');
				if (pollRef.current) clearInterval(pollRef.current);
				pollRef.current = setInterval(async () => {
					const check = await call('login_qr_check', { key: key.data.key });
					const state = check.ok ? check.data?.state : 'error';
					if (state === 'scanned') setQrNote('已扫码，请在手机上确认');
					if (state === 'confirmed') {
						clearInterval(pollRef.current);
						pollRef.current = null;
						setQr('');
						setQrNote('');
						await refreshUser();
					}
					if (state === 'expired' || state === 'error') {
						clearInterval(pollRef.current);
						pollRef.current = null;
						setQr('');
						setQrNote('二维码已过期，请重新获取');
					}
				}, 2000);
			}, [refreshUser]);

			const logout = useCallback(async () => {
				await call('logout', {});
				setUser(null);
				setMine(null);
			}, []);

			const play = (track, index, list) => player.load(track, index, list);

			/* Lyrics need their own beat: timeupdate can skip a whole line. */
			useEffect(() => {
				if (!playing || !lyrics.length) return undefined;
				const timer = setInterval(() => setBeat((value) => value + 1), 400);
				return () => clearInterval(timer);
			}, [playing, lyrics.length]);

			const activeLine = useMemo(() => {
				if (!lyrics.length) return -1;
				let found = -1;
				for (let line = 0; line < lyrics.length; line += 1) {
					if (lyrics[line].at <= progress) found = line;
					else break;
				}
				return found;
			}, [lyrics, progress]);

			const lyricRef = useRef(null);
			useEffect(() => {
				const box = lyricRef.current;
				if (!box || activeLine < 0) return;
				const row = box.children[activeLine];
				if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'center', behavior: 'smooth' });
			}, [activeLine]);

			/* Draws the played part of the groove: the range input itself cannot
			   paint two colors, so the fill rides on an inline gradient. */
			const seekPct = duration > 0 ? Math.min(100, Math.max(0, (shownProgress / duration) * 100)) : 0;
			const seekFill = {
				backgroundImage: `linear-gradient(to right, var(--dsw-alias-brand-primary) 0%, var(--dsw-alias-brand-primary) ${seekPct}%, var(--dsw-alias-border-l2) ${seekPct}%, var(--dsw-alias-border-l2) 100%)`,
			};

			const accountRow = h('div', { className: 'ph-account' },
				h('span', { className: 'ph-account-name' },
					user
						? h('span', null, '已登录 · ', h('strong', null, user.nickname || user.id), user.isVip ? '（会员）' : '')
						: '未登录 · 仍可搜索与试听'),
				user
					? h('button', { className: 'ph-btn', onClick: logout }, '退出登录')
					: h('button', { className: 'ph-btn ph-btn-primary', onClick: startLogin }, '扫码登录'));

			const searchRow = h('div', { className: 'ph-searchwrap' },
				h('input', {
					className: 'ph-input',
					placeholder: '搜索歌曲、歌手、歌单',
					value: query,
					onChange: (event) => setQuery(event.target.value),
					onKeyDown: (event) => { if (event.key === 'Enter') search(); },
				}),
				h('button', {
					className: 'ph-btn ph-iconbtn',
					title: '搜索',
					onClick: search,
					disabled: busy === 'search',
				}, busy === 'search' ? h('span', { className: 'ph-spin' }) : h(Glyph, { name: 'search', size: 15 })));

			const cardGrid = (list) => h('div', { className: 'ph-grid' },
				list.map((item, position) => {
					const cover = coverOf(item);
					const on = current && current.id === item.id;
					return h('div', {
						key: item.id || position,
						className: `ph-card${on ? ' ph-card-on' : ''}`,
						onClick: () => play(item, position, list),
					},
					h('div', { className: 'ph-thumb' },
						cover ? h('img', { src: cover, alt: '', loading: 'lazy' }) : h('span', null, '♪'),
						isVip(item) ? h('span', { className: 'ph-thumb-vip' }, 'VIP') : null,
						h('span', { className: 'ph-hoverplay' },
							on && playing
								? h('span', { className: 'ph-eq' }, [h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })])
								: h(Glyph, { name: 'play', size: 13 }))),
					h('div', { className: 'ph-cname' }, nameOf(item)),
					h('div', { className: 'ph-csub' }, artistOf(item) || '—'));
				}));

			/* One list renderer for search results and for an opened collection. */
			const trackList = (list) => h('div', { className: 'ph-list' }, list.map((track, position) => {
				const on = current && current.id === track.id;
				const cover = coverOf(track);
				return h('div', {
					key: track.id || position,
					className: `ph-row${on ? ' ph-row-on' : ''}`,
					onClick: () => play(track, position, list),
				},
				h('span', { className: 'ph-num' }, on && playing
					? h('span', { className: 'ph-eq' }, [h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })])
					: String(position + 1)),
				cover ? h('img', { className: 'ph-cover', src: cover, alt: '', loading: 'lazy' }) : h('div', { className: 'ph-cover' }, '♪'),
				h('div', { className: 'ph-meta' },
					h('div', { className: 'ph-name' }, nameOf(track),
						isVip(track) ? h('span', { className: 'ph-vip' }, 'VIP') : null),
					h('div', { className: 'ph-sub-t' }, artistOf(track) || '—')),
				h('button', {
					className: `ph-like${isLiked(track) ? ' ph-like-on' : ''}`,
					title: isLiked(track) ? '取消收藏' : '收藏到「我喜欢的音乐」',
					onClick: (event) => { event.stopPropagation(); toggleLike(track); },
				}, h(Glyph, { name: 'heart', size: 14 })));
			}));

			/* Opening a collection replaces the grid with its track list: a grid of
			   covers cannot say what is inside, and the user asked for the list. */
			const openDetail = useCallback(async (source) => {
				setDetail(source);
				setView('detail');
				setDetailBusy(true);
				setDetailTracks([]);
				let list = [];
				if (source.kind === 'scene') {
					const result = await call('feed', { scene: String(source.id), count: 60 });
					list = result.ok ? asList(result.data) : [];
					if (!result.ok) setTip(result.error?.message || '合集加载失败');
				} else if (source.kind === 'playlist') {
					const result = await call('playlist_tracks', {
						id: source.id, limit: 60, offset: 0, ownerId: source.ownerId || '',
					});
					list = result.ok ? asList(result.data) : [];
					if (!result.ok) setTip(result.error?.message || '歌单加载失败');
				} else if (source.kind === 'liked') {
					list = (mine && mine.liked) || [];
				} else if (source.kind === 'recent') {
					list = (mine && mine.recent) || [];
				}
				setDetailTracks(list);
				setDetailBusy(false);
			}, [mine]);

			const sceneGrid = () => h('div', { className: 'ph-grid' },
				scenes.map((item) => {
					const cover = imageUrl(item.coverUrl);
					return h('div', {
						key: item.id,
						className: `ph-card${detail && detail.id === item.id ? ' ph-card-on' : ''}`,
						onClick: () => openDetail({ kind: 'scene', id: item.id, name: item.name, group: item.group }),
					},
					h('div', { className: 'ph-thumb' },
						cover ? h('img', { src: cover, alt: '', loading: 'lazy' }) : h('span', null, '♪'),
						h('span', { className: 'ph-hoverplay' }, h(Glyph, { name: 'play', size: 13 }))),
					h('div', { className: 'ph-cname' }, item.name || '场景'),
					h('div', { className: 'ph-csub' }, item.group || '场景音乐'));
				}));

			const detailView = () => {
				if (!detail) return h('div', { className: 'ph-empty' }, '没有选中合集。');
				const title = detail.kind === 'liked' ? '我喜欢的音乐'
					: detail.kind === 'recent' ? '最近播放'
						: detail.name || '合集';
				const sub = detail.group || (detail.kind === 'playlist' ? `歌单 · ${detailTracks.length} 首` : '');
				return h('div', null,
					h('div', { className: 'ph-sect' },
						h('button', {
							className: 'ph-btn ph-iconbtn',
							title: '返回',
							onClick: () => setView(detail.back || 'scenes'),
						}, h(Glyph, { name: 'back', size: 15 })),
						h('span', { className: 'ph-sect-title' }, title),
						sub ? h('span', { className: 'ph-sect-sub' }, sub) : null,
						detailTracks.length ? h('button', {
							className: 'ph-btn ph-btn-primary',
							onClick: () => player.load(detailTracks[0], 0, detailTracks),
						}, h(Glyph, { name: 'play', size: 12 }), '播放全部') : null),
					detailBusy
						? h('div', { className: 'ph-empty' }, '正在加载曲目…')
						: (detailTracks.length ? trackList(detailTracks) : h('div', { className: 'ph-empty' }, '这个合集里还没有曲目。')));
			};

			const mineView = () => {
				if (!user) {
					return h('div', { className: 'ph-empty' },
						h('div', null,
							h('div', { style: { marginBottom: 12 } }, '登录后可同步「我喜欢的音乐」「最近播放」和你的歌单。'),
							h('button', { className: 'ph-btn ph-btn-primary', onClick: startLogin }, '扫码登录')));
				}
				if (busy === 'mine') return h('div', { className: 'ph-empty' }, '正在加载我的音乐…');
				if (!mine) return h('div', { className: 'ph-empty' }, h('button', { className: 'ph-btn ph-btn-primary', onClick: loadMine }, '加载我的音乐'));
				const blocks = [];
				if (mine.liked.length) blocks.push(h('div', { key: 'liked' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' }, '我喜欢的音乐'),
						h('span', { className: 'ph-sect-sub' }, `${mine.liked.length} 首`),
						h('button', { className: 'ph-btn', onClick: () => openDetail({ kind: 'liked', back: 'mine' }) }, '全部')),
					cardGrid(mine.liked)));
				if (mine.recent.length) blocks.push(h('div', { key: 'recent' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' }, '最近播放'),
						h('span', { className: 'ph-sect-sub' }, `${mine.recent.length} 首`),
						h('button', { className: 'ph-btn', onClick: () => openDetail({ kind: 'recent', back: 'mine' }) }, '全部')),
					cardGrid(mine.recent)));
				if (mine.lists.length) {
					const playlistRows = mine.lists.map((item, position) => {
						const count = item.resource_cnt?.track_cnt ?? item.track_count ?? item.trackCount ?? '—';
						const open = () => openDetail({
							kind: 'playlist',
							id: item.id || item.base_info?.id,
							ownerId: item.owner_id || item.ownerId || '',
							name: item.name || item.title || '歌单',
							back: 'mine',
						});
						return h('div', { key: item.id || position, className: 'ph-row', onClick: open },
							h('span', { className: 'ph-num' }, String(position + 1)),
							h('div', { className: 'ph-cover' }, h(Glyph, { name: 'music', size: 14 })),
							h('div', { className: 'ph-meta' },
								h('div', { className: 'ph-name' }, item.name || item.title || '歌单'),
								h('div', { className: 'ph-sub-t' }, `${count} 首`)),
							h(Glyph, { name: 'next', size: 13 }));
					});
					blocks.push(h('div', { key: 'lists' },
						h('div', { className: 'ph-sect' }, h('span', { className: 'ph-sect-title' }, '我的歌单')),
						h('div', { className: 'ph-list' }, playlistRows)));
				}
				if (!blocks.length) return h('div', { className: 'ph-empty' }, '这里还没有内容，先去推荐里喜欢几首吧。');
				return h('div', null, blocks);
			};

			let content;
			if (qr) {
				content = h('div', { className: 'ph-qr' },
					h('img', { src: qr, alt: '登录二维码' }),
					h('span', { className: 'ph-hint' }, qrNote || '用汽水音乐 App 扫码'),
					h('button', {
						className: 'ph-btn',
						onClick: () => {
							setQr('');
							setQrNote('');
							if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
						},
					}, '取消'));
			} else if (showLyrics && current) {
				content = h('div', { style: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } },
					h('div', { className: 'ph-lybar' },
						h('span', { className: 'ph-hint' }, `${nameOf(current)}${artistOf(current) ? ` — ${artistOf(current)}` : ''}`),
						h('button', { className: 'ph-btn', onClick: () => setShowLyrics(false) }, '收起歌词')),
					h('div', { className: 'ph-lyrics', ref: lyricRef },
						lyrics.length
							? lyrics.map((line, position) => h('div', {
								key: `${line.at}-${position}`,
								className: position === activeLine ? 'ph-lyric-on' : '',
							}, line.text))
							: h('span', { className: 'ph-hint' }, '暂无歌词')));
			} else if (view === 'scenes') {
				content = h('div', { className: 'ph-scroll' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' }, '场景音乐'),
						scenes.length ? h('span', { className: 'ph-sect-sub' }, `${scenes.length} 个`) : null,
						h('button', { className: 'ph-btn ph-iconbtn', title: '重新加载', onClick: loadScenes }, h(Glyph, { name: 'refresh', size: 14 }))),
					scenes.length ? sceneGrid() : h('div', { className: 'ph-empty' }, '正在加载场景…'));
			} else if (view === 'mine') {
				content = h('div', { className: 'ph-scroll' }, mineView());
			} else if (view === 'detail') {
				content = h('div', { className: 'ph-scroll' }, detailView());
			} else if (view === 'search') {
				content = h('div', { className: 'ph-scroll' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' }, `「${query.trim()}」的搜索结果`),
						h('span', { className: 'ph-sect-sub' }, `${tracks.length} 首`),
						tracks.length ? h('button', {
							className: 'ph-btn ph-btn-primary',
							onClick: () => player.load(tracks[0], 0, tracks),
						}, h(Glyph, { name: 'play', size: 12 }), '播放全部') : null),
					tracks.length ? trackList(tracks) : h('div', { className: 'ph-empty' }, '没有找到相关曲目。'));
			} else {
				content = h('div', { className: 'ph-scroll' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' }, scene ? scene.name || '场景' : '猜你喜欢'),
						busy === 'feed' ? h('span', { className: 'ph-sect-sub' }, '加载中…') : null,
						scene ? h('button', {
							className: 'ph-btn',
							onClick: () => { setScene(null); loadFeed(null); },
						}, '回到推荐') : h('button', {
							className: 'ph-btn ph-iconbtn',
							title: '换一批',
							onClick: () => loadFeed(null, true),
						}, h(Glyph, { name: 'refresh', size: 14 })),
						h('button', {
							className: 'ph-btn ph-cta',
							disabled: busy === 'shuffle',
							title: '随机抽一批推荐，打乱后立刻播放',
							onClick: shuffleListen,
						}, busy === 'shuffle'
							? h('span', { className: 'ph-spin' })
							: h(Glyph, { name: 'sparkle', size: 13 }), '随心听')),
					tracks.length ? cardGrid(tracks) : h('div', { className: 'ph-empty' }, '正在加载推荐…'));
			}

			/* Highest quality the server can resolve; named buttons pick a lower
			   rung when the top one turns out to be a member-only preview. */
			const DOWNLOAD_LEVELS = [['hires', '最高音质'], ['lossless', '无损'], ['high', '高品质'], ['standard', '标准']];

			const download = async (track) => {
				if (!track || dlBusy) return;
				const name = `${nameOf(track)}${artistOf(track) ? ` - ${artistOf(track)}` : ''}`;
				const query = new URLSearchParams({ id: String(track.id), name, quality: dlLevel });
				setDlBusy(true);
				setDlNote('');
				try {
					/* A HEAD first turns the server's refusal into a message instead of a
					   failed download the browser silently drops. */
					const probe = await fetch(`${BASE}/download?${query}`, { method: 'HEAD' });
					if (!probe.ok) {
						let message = `下载失败（${probe.status}）`;
						try {
							const payload = await probe.json();
							if (payload?.error?.message) message = payload.error.message;
						} catch { /* not json */ }
						setDlNote(message);
						return;
					}
					const quality = probe.headers.get('x-qishui-quality') || dlLevel;
					const preview = probe.headers.get('x-qishui-preview') === '1';
					setDlNote(preview
						? `会员曲目，只能取到 ${quality} 试听片段。`
						: `开始下载 ${quality} 音质。`);
					const link = document.createElement('a');
					link.href = `${BASE}/download?${query}`;
					link.download = '';
					document.body.appendChild(link);
					link.click();
					link.remove();
				} catch (error) {
					setDlNote(String(error && error.message ? error.message : error));
				} finally {
					setDlBusy(false);
				}
			};

			const playerBar = current ? h('div', { className: 'ph-player' },
				h('div', { className: 'ph-np' },
					h('div', { className: 'ph-npcover' },
						coverOf(current) ? h('img', { src: coverOf(current), alt: '' }) : h(Glyph, { name: 'music', size: 16 })),
					h('div', { className: 'ph-npmeta' },
						h('div', { className: 'ph-npname' }, nameOf(current),
							isVip(current) ? h('span', { className: 'ph-vip' }, 'VIP') : null),
						h('div', { className: 'ph-npsub' }, artistOf(current) || '未知歌手')),
					h('button', {
						className: `ph-like${isLiked(current) ? ' ph-like-on' : ''}`,
						title: isLiked(current) ? '取消收藏' : '收藏到「我喜欢的音乐」',
						onClick: () => toggleLike(current),
					}, h(Glyph, { name: 'heart', size: 15 }))),
				h('div', { className: 'ph-seekrow' },
					h('span', { className: 'ph-time' }, fmt(shownProgress)),
					h('input', {
						className: 'ph-seek',
						type: 'range',
						min: 0,
						max: Math.max(duration || 0, 0.1),
						step: 0.1,
						value: shownProgress,
						style: seekFill,
						'aria-label': '播放进度',
						/* React maps onChange to the same input event as onInput, so committing
						   there would seek twice per pixel. The drag seeks itself, throttled. */
						onInput: (event) => dragSeek(Number(event.target.value)),
						onPointerUp: (event) => commitSeek(Number(event.target.value)),
						onPointerCancel: (event) => commitSeek(Number(event.target.value)),
						onMouseUp: (event) => commitSeek(Number(event.target.value)),
						onTouchEnd: (event) => commitSeek(Number(event.target.value)),
						onKeyUp: (event) => commitSeek(Number(event.target.value)),
						onBlur: () => { draggingRef.current = false; setScrub(null); },
					}),
					h('span', { className: 'ph-time ph-time-r' }, fmt(duration))),
				h('div', { className: 'ph-ctrl' },
					h('button', { className: 'ph-ghost', title: '上一首', onClick: () => player.step(-1) }, h(Glyph, { name: 'prev', size: 17 })),
					h('button', { className: 'ph-play', title: playing ? '暂停' : '播放', onClick: () => player.toggle() },
						h(Glyph, { name: playing ? 'pause' : 'play', size: 18 })),
					h('button', { className: 'ph-ghost', title: '下一首', onClick: () => player.step(1) }, h(Glyph, { name: 'next', size: 17 })),
					h('button', {
						className: `ph-ghost${queueOpen ? ' ph-ghost-on' : ''}`,
						title: '播放列表',
						onClick: () => setQueueOpen((value) => !value),
					},
					h(Glyph, { name: 'queue', size: 16 }),
					queue.length ? h('span', { className: 'ph-qbadge' }, String(queue.length)) : null),
					h('button', {
						className: `ph-ghost${showLyrics ? ' ph-ghost-on' : ''}`,
						title: '歌词',
						onClick: () => setShowLyrics((value) => !value),
					}, h(Glyph, { name: 'lyrics', size: 16 })),
					h('span', { className: 'ph-grow' }),
					h('select', {
						className: 'ph-select',
						value: dlLevel,
						title: '下载音质',
						onChange: (event) => setDlLevel(event.target.value),
					}, DOWNLOAD_LEVELS.map(([key, label]) => h('option', { key, value: key }, label))),
					h('button', {
						className: 'ph-ghost',
						disabled: dlBusy,
						title: '下载当前曲目（默认取可用的最高音质）',
						onClick: () => download(current),
					}, dlBusy ? h('span', { className: 'ph-spin' }) : h(Glyph, { name: 'download', size: 15 })),
					h(Glyph, { name: 'volume', size: 14 }),
					h('input', {
						className: 'ph-vol',
						type: 'range',
						min: 0,
						max: 1,
						step: 0.01,
						value: volume,
						'aria-label': '音量',
						onChange: (event) => player.setVolume(Number(event.target.value)),
					}))) : null;

			const queueSheet = queueOpen ? h('div', {
				className: 'ph-sheet',
				onClick: () => setQueueOpen(false),
			},
			h('div', { className: 'ph-sheet-card', onClick: (event) => event.stopPropagation() },
				h('div', { className: 'ph-sheet-head' },
					h('span', { className: 'ph-sheet-title' }, `当前播放 · ${queue.length} 首`),
					queue.length > 1 ? h('button', { className: 'ph-btn', onClick: shuffleQueue, title: '打乱队列顺序' }, '打乱') : null,
					h('button', {
						className: 'ph-btn ph-iconbtn',
						title: '收起播放列表',
						onClick: () => setQueueOpen(false),
					}, h(Glyph, { name: 'close', size: 14 }))),
				h('div', { className: 'ph-sheet-list' },
					queue.length ? queue.map((track, position) => {
						const on = position === index;
						const cover = coverOf(track);
						return h('div', {
							key: `${track.id}-${position}`,
							className: `ph-row${on ? ' ph-row-on' : ''}`,
							onClick: () => { if (!on) player.load(queue[position], position, queue); },
						},
						h('span', { className: 'ph-num' }, on && playing
							? h('span', { className: 'ph-eq' }, [h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })])
							: String(position + 1)),
						cover ? h('img', { className: 'ph-cover', src: cover, alt: '', loading: 'lazy' }) : h('div', { className: 'ph-cover' }, '♪'),
						h('div', { className: 'ph-meta' },
							h('div', { className: 'ph-name' }, nameOf(track),
								isVip(track) ? h('span', { className: 'ph-vip' }, 'VIP') : null),
							h('div', { className: 'ph-sub-t' }, artistOf(track) || '—')),
						h('span', { className: 'ph-time' }, on ? (playing ? '播放中' : '已暂停') : '点播'));
					}) : h('div', { className: 'ph-empty' }, '还没有播放列表，先挑一首歌吧。')))) : null;

			const views = [['home', '推荐'], ['scenes', '场景'], ['mine', '我的']];
			if (view === 'search') views.push(['search', '搜索结果']);

			return h('div', { className: 'ph-body' },
				searchRow,
				h('div', { className: 'ph-seg' },
					views.map(([key, label]) => h('button', {
						key,
						className: `ph-segbtn${view === key ? ' ph-segbtn-on' : ''}`,
						onClick: () => {
							setView(key);
							if (key === 'mine' && user && !mine) loadMine();
						},
					}, label))),
				accountRow,
				error ? h('div', { className: 'ph-msg ph-err' }, error) : null,
				tip ? h('div', { className: 'ph-msg' }, tip) : null,
				content,
				dlNote ? h('div', { className: 'ph-dl' }, dlNote) : null,
				playerBar,
				queueSheet);
		}
		/* ------------------------------------------------------- world radio */

		/* Radiocast is an English-only single-page app with no public API, so the
		   panel is fed by the community radio-browser index and plays through the
		   host relay. Like the music queue it lives outside React: leaving the
		   panel must not silence the station. */
		const RADIO_TAGS = [
			['', '中文电台'],
			['news', '新闻'],
			['music', '音乐'],
			['pop', '流行'],
			['classical', '古典'],
			['jazz', '爵士'],
			['rock', '摇滚'],
			['talk', '谈话'],
			['traffic radio broadcast', '交通'],
			['children', '少儿'],
		];

		const radio = {
			audio: null,
			state: adoptState('radioState', { station: null, playing: false, loading: false }),
			listeners: new Set(),
			patch(next) {
				Object.assign(radio.state, next);
				for (const fn of Array.from(radio.listeners)) {
					try { fn(); } catch { /* a stale listener must not stop the stream */ }
				}
			},
			subscribe(fn) {
				radio.listeners.add(fn);
				return () => { radio.listeners.delete(fn); };
			},
			node() {
				const entry = audioEntry('radio');
				const node = entry.node;
				if (radio.audio === node) return node;
				entry.handlers.clear();
				node.preload = 'none';
				entry.handlers.add((type) => {
					if (type === 'playing') radio.patch({ playing: true, loading: false });
					else if (type === 'pause') radio.patch({ playing: false });
					else if (type === 'waiting') radio.patch({ loading: true });
					else if (type === 'error') radio.patch({ playing: false, loading: false });
				});
				radio.audio = node;
				return node;
			},
			play(station) {
				/* One sound source at a time: a catalogue track and a live stream
				   would otherwise play over each other. The music element is addressed
				   through the shared slot, so this also stops a player left behind by
				   an earlier copy of this module. */
				silence('music');
				if (player.audio) player.patch({ playing: false });
				const node = radio.node();
				radio.patch({ station, loading: true });
				node.src = `${BASE}/radio/stream?u=${encodeURIComponent(station.url)}`;
				node.load();
				const attempt = node.play();
				if (attempt && typeof attempt.catch === 'function') {
					attempt.catch(() => radio.patch({ playing: false, loading: false }));
				}
			},
			stop() {
				const node = radio.node();
				node.pause();
				node.removeAttribute('src');
				node.load();
				radio.patch({ station: null, playing: false, loading: false });
			},
			toggle() {
				if (!radio.state.station) return;
				const node = radio.node();
				if (node.paused) radio.play(radio.state.station);
				else node.pause();
			},
		};

		function RadioPanel() {
			const [tag, setTag] = useState('');
			const [q, setQ] = useState('');
			const [stations, setStations] = useState([]);
			const [busy, setBusy] = useState(false);
			const [tip, setTip] = useState('');
			const [, setBeat] = useState(0);

			useEffect(() => {
				radio.node();
				const stop = radio.subscribe(() => setBeat((value) => value + 1));
				return stop;
			}, []);

			const { station, playing, loading } = radio.state;

			const load = useCallback(async (nextTag, nextQuery) => {
				setBusy(true);
				const params = new URLSearchParams({ limit: '120' });
				if (nextTag) params.set('tag', nextTag);
				if (nextQuery) params.set('q', nextQuery);
				try {
					const response = await fetch(`${BASE}/radio/stations?${params}`);
					const payload = await response.json();
					if (payload && payload.ok) {
						setStations(payload.data.items || []);
						setTip('');
					} else {
						setStations([]);
						setTip(payload?.error?.message || '电台列表加载失败');
					}
				} catch (error) {
					setStations([]);
					setTip(String(error && error.message ? error.message : error));
				}
				setBusy(false);
			}, []);

			useEffect(() => { load('', ''); }, [load]);

			const submit = () => { load(tag, q.trim()); };
			const pickTag = (nextTag) => { setTag(nextTag); setQ(''); load(nextTag, ''); };

			const rows = stations.map((item, position) => {
				const on = station && station.id === item.id;
				return h('div', {
					key: item.id || position,
					className: `ph-station${on ? ' ph-station-on' : ''}`,
					onClick: () => { if (!on) radio.play(item); },
				},
				h('div', { className: 'ph-wave' },
					on && playing
						? h('span', { className: 'ph-eq' }, [h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })])
						: h(Glyph, { name: 'radio', size: 16 })),
				h('div', { className: 'ph-meta' },
					h('div', { className: 'ph-name' }, item.name),
					h('div', { className: 'ph-sub-t' },
						[item.country, item.codec && item.bitrate ? `${item.codec} ${item.bitrate}k` : item.codec]
							.filter(Boolean).join(' · ') || '网络电台'),
					item.tags && item.tags.length
						? h('div', { className: 'ph-tags' },
							item.tags.slice(0, 3).map((value) => h('span', { key: value, className: 'ph-tag' }, value)))
						: null),
				h('button', {
					className: `ph-ghost${on ? ' ph-ghost-on' : ''}`,
					title: on ? (playing ? '暂停' : '继续收听') : '收听',
					onClick: (event) => {
						event.stopPropagation();
						if (on) radio.toggle();
						else radio.play(item);
					},
				}, on && loading
					? h('span', { className: 'ph-spin' })
					: h(Glyph, { name: on && playing ? 'pause' : 'play', size: 15 })));
			});

			return h('div', { className: 'ph-body' },
				h('div', { className: 'ph-searchwrap' },
					h('input', {
						className: 'ph-input',
						placeholder: '搜索电台名称，留空则显示当前分类',
						value: q,
						onChange: (event) => setQ(event.target.value),
						onKeyDown: (event) => { if (event.key === 'Enter') submit(); },
					}),
					h('button', { className: 'ph-btn ph-iconbtn', title: '搜索', onClick: submit, disabled: busy },
						busy ? h('span', { className: 'ph-spin' }) : h(Glyph, { name: 'search', size: 15 }))),
				h('div', { className: 'ph-chips' },
					RADIO_TAGS.map(([value, label]) => h('button', {
						key: value || 'all',
						className: `ph-chip${tag === value ? ' ph-chip-on' : ''}`,
						onClick: () => pickTag(value),
					}, label))),
				tip ? h('div', { className: 'ph-msg ph-err' }, tip) : null,
				h('div', { className: 'ph-scroll' },
					h('div', { className: 'ph-sect' },
						h('span', { className: 'ph-sect-title' },
							q.trim() ? `「${q.trim()}」` : (RADIO_TAGS.find(([value]) => value === tag) || RADIO_TAGS[0])[1]),
						h('span', { className: 'ph-sect-sub' }, `${stations.length} 个电台`),
						h('button', {
							className: 'ph-btn ph-iconbtn',
							title: '刷新',
							onClick: () => load(tag, q.trim()),
						}, h(Glyph, { name: 'refresh', size: 14 }))),
					stations.length ? h('div', { className: 'ph-list' }, rows) : h('div', { className: 'ph-empty' }, busy ? '正在获取电台…' : '没有找到电台。')),
				station ? h('div', { className: 'ph-player' },
					h('div', { className: 'ph-np' },
						h('div', { className: 'ph-wave' }, playing
							? h('span', { className: 'ph-eq' }, [h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 })])
							: h(Glyph, { name: 'radio', size: 17 })),
						h('div', { className: 'ph-npmeta' },
							h('div', { className: 'ph-npname' }, station.name),
							h('div', { className: 'ph-npsub' },
								loading ? '正在连接…' : playing ? '正在收听' : '已暂停',
								station.country ? ` · ${station.country}` : '')),
						h('span', { className: 'ph-onair' },
							playing ? h('i', { className: 'ph-dot' }) : null,
							playing ? 'ON AIR' : 'OFF')),
					h('div', { className: 'ph-ctrl' },
						h('button', {
							className: 'ph-play',
							title: playing ? '暂停' : '继续收听',
							onClick: () => radio.toggle(),
						}, h(Glyph, { name: playing ? 'pause' : 'play', size: 18 })),
						h('button', {
							className: 'ph-ghost',
							title: '停止收听',
							onClick: () => radio.stop(),
						}, h(Glyph, { name: 'stop', size: 15 })),
						h('span', { className: 'ph-grow' }),
						h('span', { className: 'ph-time' },
							[station.codec, station.bitrate ? `${station.bitrate}k` : ''].filter(Boolean).join(' · ') || '直播流'))) : null);
		}

		/* ------------------------------------------------------------- panel */

		function PlatformHub() {
			const [active, setActive] = useState(TABS[0].id);
			const [, setBeat] = useState(0);

			/* The bar's stop button has to know whether either source is audible,
			   whichever tab happens to be mounted. */
			useEffect(() => {
				const a = player.subscribe(() => setBeat((value) => value + 1));
				const b = radio.subscribe(() => setBeat((value) => value + 1));
				return () => { a(); b(); };
			}, []);

			const tab = TABS.find((entry) => entry.id === active) || TABS[0];
			const musicOn = player.state.playing;
			const radioOn = radio.state.playing || (radio.state.loading && !!radio.state.station);
			const soundOn = musicOn || radioOn;

			const stopAll = () => {
				player.stop();
				if (radio.state.station) radio.stop();
			};

			const body = h('div', { className: 'ph-body' },
				tab.id === 'radio' ? h(RadioPanel) : h(QishuiPanel));

			return h('div', { className: 'ph-root' },
				h(StyleTag),
				h('div', { className: 'ph-top' },
					h('div', { className: 'ph-logo' }, h(Icon, { size: 17 })),
					h('div', { className: 'ph-brand' },
						h('div', { className: 'ph-title' }, '多平台'),
						h('div', { className: 'ph-sub' }, '汽水音乐 · 世界电台')),
					soundOn
						? h('span', { className: 'ph-status' }, h('i', { className: 'ph-dot' }), '播放中')
						: h('span', { className: 'ph-status ph-status-idle' }, '静音')),
				h('div', { className: 'ph-tabs' },
					TABS.map((entry) => h('button', {
						key: entry.id,
						className: `ph-tab${active === entry.id ? ' ph-tab-active' : ''}`,
						onClick: () => setActive(entry.id),
					}, entry.label))),
				h('div', { className: 'ph-bar' },
					h('span', { className: 'ph-hint' }, tab.hint),
					/* One switch for both sources: a station and a song can otherwise be
					   paused only from their own tab, which is unreachable while the other
					   one is open. */
					h('button', {
						className: 'ph-btn',
						disabled: !soundOn,
						title: soundOn ? '暂停全部声音（音乐与电台）' : '当前没有播放中的声音',
						onClick: stopAll,
					}, soundOn ? '暂停全部' : '全部已停')),
				body);
		}

		/* The sidebar icon is the only entry point: the panel is opened from it. */
		const registerSidebar = (ctx) => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
			name: 'sidebar.panellist',
			id: PANEL_ID,
			order: 35,
			label: () => '多平台',
		}, Icon));

		const registerPanel = (ctx) => ctx.slots.inject('main', () => ctx.slots.register({
			name: 'main',
			key: PANEL_ID,
		}, PlatformHub));

		const module = { exports: {} };
		module.exports.name = 'dsh-platform-hub';
		module.exports.inject = ['slots'];
		module.exports.apply = (ctx) => {
			try { registerPanel(ctx); } catch (error) { console.error('[dsh-platform-hub] 主面板注册失败：', error); }
			try { registerSidebar(ctx); } catch (error) { console.error('[dsh-platform-hub] 侧边栏注册失败：', error); }
		};
		return module.exports;
	},
});
