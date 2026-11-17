# 多平台聚合 · dsh-platform-hub

DeepSeek Harness（DSH）侧边栏面板插件：一个面板里并排放多个站点，切走面板也不停播。

目前聚合两个站点：

| 标签页 | 内容 |
| --- | --- |
| 汽水音乐 | 扫码登录后在后台播放，「随心听」一键随机开声；搜索、歌单、「我喜欢的音乐」「最近播放」同步，支持按音质下载 |
| 世界电台 | 基于 radio-browser 公共索引，中文电台优先，也可按分类或关键词挑全世界的台 |

## 为什么需要 host 侧代理

汽水音乐没有网页播放器，世界电台的流分散在成千上万个互不相关的域名上，两者的音频都不能被面板直接 `<audio>` 引用（CORS / Referer 校验）。所以面板只负责界面，音频一律走 host 侧的本地回环代理：

- `/audio`：汽水音乐音频，只放行内置的 CDN 主机白名单（字节系域名 + `qishui.com`），并透传 `Range`，保证可拖动进度。
- `/radio/stream`：电台流中继，拒绝私网与回环地址（`127.0.0.0/8`、`10/8`、`172.16/12`、`192.168/16`、`169.254/16`、`.local`、`localhost`），避免被当成内网探测器。
- `/download`：按音质取最清晰的可下载变体，带 `Content-Disposition` 让浏览器直接存文件；只有加密音源的曲目会明确报 415，而不是假装成功。

所有接口**仅允许回环地址访问**；账号凭据始终留在 host 侧，浏览器拿不到。

## 安装

插件以 DSH profile 的本地包形式加载。把它放进 profile 的 `plugins/` 目录，并在 `package.json` 中登记：

```json
{
  "dependencies": {
    "dsh-platform-hub": "file:plugins/dsh-platform-hub"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-platform-hub"]
    }
  }
}
```

随后在 profile 目录执行：

```sh
pnpm install
```

## 文件结构

```
index.js                   服务端：汽水音乐客户端引导、音频/下载代理、电台索引与流中继
client.js                  前端：window.ModuleLoader 形态的侧边栏与主面板
cordis.patch.yml           bundle 补丁，向 host 插入本插件
package.json               包元信息与 dsh.bundle / dsh.client 声明
icon.svg                   面板图标
locale/zh.json             中文文案
locale/en.json             英文文案
test-client.cjs            前端集成自测脚本（npm test）
verify-player.cjs          播放链路校验脚本（npm run verify）
vendor/qishui-music-api/   第三方依赖，见下方「致谢」
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/plugins/dsh-platform-hub/api` | 统一入口，入参 `{ op, params }`，由 host 转发给汽水音乐客户端 |
| GET/HEAD | `/plugins/dsh-platform-hub/audio?u=<url>` | 音频代理，仅放行 CDN 白名单主机，透传 `Range` |
| GET/HEAD | `/plugins/dsh-platform-hub/download?id=<id>&quality=<q>` | 下载音源，`quality` ∈ `standard` / `high` / `lossless` / `hires`（默认 `hires`） |
| GET | `/plugins/dsh-platform-hub/radio/stations?tag=&q=&limit=` | 电台检索，`limit` 上限 200；无关键词无分类时默认只取中文台 |
| GET/HEAD | `/plugins/dsh-platform-hub/radio/stream?u=<url>` | 电台流中继，拒绝私网目标 |
| GET | `/plugins/dsh-platform-hub/status` | 轮询扫码登录状态 |

## 数据

登录态与 deviceId 存放在 `$DSH_HOME/platform-hub/qishui.json`（默认 `~/.dsh/platform-hub/`），**不在仓库内**。

## 致谢

`vendor/qishui-music-api` 来自 [GSQZ/qishui-music-api](https://github.com/GSQZ/qishui-music-api)，MIT 许可，版权归 sayqz 所有，许可原文见 [vendor/qishui-music-api/LICENSE](vendor/qishui-music-api/LICENSE)。

电台索引来自公共的 [radio-browser](https://www.radio-browser.info/) 服务，无需 API key。

## 许可

MIT，见 [LICENSE](LICENSE)。
