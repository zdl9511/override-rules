## powerfullz 的 Mihomo/Substore 覆写规则

![](img/cover.png)

[![](https://data.jsdelivr.com/v1/package/gh/powerfullz/override-rules/badge?style=rounded)](https://www.jsdelivr.com/package/gh/powerfullz/override-rules)

本仓库为 Mihomo/Substore 设计，提供高效、灵活的覆写规则（**不建议用于 Stash**）。核心特色如下：

* 只展示「直连」「自定义直连」「国外」「AI」四个策略，国外与 AI 可独立选择出口。
* 自定义直连支持域名、IP/CIDR 和进程名，清单随覆写内嵌，无需额外下载。
* 通过 GeoSite/GeoIP 区分国内与国外流量，保留可选广告过滤。
* 国外与 AI 直接展示订阅原始节点；仅在链式代理或 Tailscale 确有引用时生成对应的隐藏路由组。

> 本项目为本人自用，欢迎交流建议（Issue/PR）。如无特殊反馈，将优先满足个人需求与体验优化。

[点击访问 Forgejo 上的镜像](https://git.l3zc.com/powerfullz/override-rules)

### AFF

#### FlowerCloud

[注册链接](https://api-flowercloud.com/aff.php?aff=4352)

目前我的主力机场，也是一家老牌一线机场了，线路扎实，冗余足够，实验性节点0.2倍率，部分地区的高级节点是家宽落地，用起来还是很舒服的。

#### CNIX

[注册链接](https://nozomi.wtf/auth/register?code=2d50f605de)

开了很多年的一家机场，目前有各种针对不同运营商的优化线路。可玩性还是很高的，缺点就是审计规则比较多，而且禁止测速。

### 使用方法

**Clash Party/Sparkle**

> [!TIP]
> Clash Party 不支持给脚本传入参数，如果需要传入参数，请使用集成的 Substore。

1.  推荐直接使用 JS 动态覆写：`https://raw.githubusercontent.com/zdl9511/override-rules/refs/heads/preview/convert.min.js`
2.  打开 Clash Party → 左侧「覆写」→ 粘贴上述链接导入。
3.  打开「订阅管理」→ 目标订阅右上角三个点 → 「编辑信息」→ 选择该覆写脚本 → 保存。

需要注意，Clash Party 在默认设置下还会接管 DNS 和 SNI（域名嗅探），需要手动在设置中关闭「控制 DNS 设置」和「控制域名嗅探」两个选项。

**Clash Verge 系（Clash Verge Rev、Clash Nyanpasu 等）**

直接复制需要的 YAML 格式覆写粘贴到覆写规则部分（无法自动更新）。

**SubStore**

参考[最速 Substore 订阅管理指南](https://blog.l3zc.com/2025/03/clash-subscription-convert/)。

2025/06/17 更新：新增 JavaScript 格式覆写，更易于维护，已经成为首选方式。JavaScript 格式覆写支持在脚本链接末尾加入`#`以传入参数，传入多个参数时，用`&`分隔，例如`#quic=true`。

目前支持的参数：

*   `ipv6`：启用 IPv6 支持（默认 false）
*   `full`：生成完整配置（适合纯内核启动，默认 false）
*   `keepalive`：启用 TCP Keep Alive（默认 false）[^fn2]
*   `fakeip`：DNS 增强模式使用 `fake-ip` 而不是 `redir-host`（开启后可能有助于解决 TUN 模式无法上网的问题；未传参时默认 `true`，显式传 `false` 时使用 `redir-host`）
*   `quic`：允许 QUIC 流量（UDP 443，默认 false）[^quic]
*   `regex`：通过 `include-all` 让 Mihomo 动态载入原始节点，包含链式代理落地节点，仅排除已识别的 Tailscale 节点（默认 false）[^regex]
*   `tun`：启用 TUN 模式（gvisor 栈，自动配置路由排除地址与 DNS 劫持，默认 false）
*   `adblock`：去广告规则（0=关闭，1=adrules.top，2=217heidai，3=AWAvenue，默认 3）

「国外」与「AI」均直接引用节点，名称和订阅顺序保持原样，可分别手动选择。空订阅统一补入 `DIRECT`。旧的 `grouptype`、`loadbalance`、`threshold` 参数已移除。

[^quic]: 默认屏蔽了 QUIC 流量防止节点 UDP 性能不佳影响上网体验，如果确信节点质量良好，建议设置为 true。
[^regex]: 需要由内核动态纳入额外节点时可启用此参数；`exclude-filter` 按完整名称排除生成时已识别的 Tailscale 节点。静态配置无法识别后续新增的 Tailscale 节点，包含此类节点的订阅适合使用 JS 动态覆写。

说明：布尔参数支持字符串 true/false 或 1/0。注：预生成的 YAML 格式覆写（`yamls/` 目录）固定使用正则模式，不受此参数影响。

[^fn2]: 无特殊需求不要启用，否则会造成[移动设备异常耗电问题](https://github.com/vernesong/OpenClash/issues/2614)。

#### JS 覆写使用示例

例如允许 QUIC 流量，在 Substore「脚本操作」处填入：

```
https://raw.githubusercontent.com/zdl9511/override-rules/refs/heads/preview/convert.min.js#quic=true
```

如果想第一时间体验最新加入的 ~~Bug~~ 功能，可以使用 preview 分支的 Github Raw 链接：

```
https://raw.githubusercontent.com/zdl9511/override-rules/refs/heads/preview/convert.min.js
```

### 测速后按延迟排序

在 Clash Party 的「代理组」页面，打开顶部「显示设置 → 排序 → 延迟」（旧版可通过顶部排序按钮切换为「按延迟排序」），再点击「国外」或「AI」组的测速按钮；客户端按最新延迟从低到高展示节点，超时节点排在后面。该设置会记住，不影响四个策略的先后顺序，也不会自动切换已选节点。

实时排序由客户端完成，覆写脚本在配置生成阶段无法读取之后的测速结果。其他客户端需启用各自的延迟排序设置。实现见 [Clash Party 代理页面](https://github.com/mihomo-party-org/clash-party/blob/main/src/renderer/src/pages/proxies.tsx)。

### 关于 DNS 泄露的说明

很多人问用了这覆写规则跑 DNS 泄露测试说会泄露，为此我写了一篇文章澄清一些误解，具体请看[「关于 DNS 泄露及其相关误解的说明」](https://blog.l3zc.com/2026/05/dns-leak-misunderstanding/)。

### 分流策略与自定义直连

| 策略 | 匹配流量 | 默认出口 |
| --- | --- | --- |
| 直连 | 内网、国内域名和中国 IP | `DIRECT` |
| 自定义直连 | 自定义域名、IP/CIDR、进程 | 直连，也可手动切到国外 |
| 国外 | 未命中其他规则的流量 | 订阅首个节点，可手动选择 |
| AI | GeoSite 的 `category-ai-!cn` | 订阅首个节点，可独立手动选择 |

规则优先级为：**自定义直连 → QUIC 限制 → Tailscale → 内网 → 广告过滤 → AI → 国内域名 → 国内 IP → 国外兜底**。原有流媒体、静态资源、金融等服务组已合并；AI 以外的服务统一按国内/国外规则处理。广告直接 `REJECT`，通过 `adblock=0` 关闭。

自定义清单位于 [`src/catalog/custom-direct.ts`](src/catalog/custom-direct.ts)，已加入指定的 17 个去重域名、6 个 IP 和 Windows 微信的 `WeChat.exe`、`Weixin.exe`。在 `CUSTOM_DIRECT_RULES` 数组中逐行添加即可：

```typescript
"DOMAIN-SUFFIX,example.com",       // 该域名及子域名
"DOMAIN,only.example.net",         // 只匹配这个完整域名
"IP-CIDR,203.0.113.10/32",         // 单个 IPv4；网段可写 /24 等
"IP-CIDR6,2001:db8::1/128",        // IPv6
"PROCESS-NAME,Example.exe",        // 进程名
```

清单中只写匹配条件，出口由「自定义直连」策略统一控制。IP 清单使用 `no-resolve`，匹配连接已知的目标 IP，不会仅为核对清单而查询域名的 IP。域名规则和进程规则不受此限制。

修改后运行 `npm run artifacts`，将生成的 `convert.min.js` 或 YAML 重新载入客户端。源码推送到 `main` 后，GitHub Actions 也会自动生成 `preview` 分支产物；使用自己仓库的 preview 链接才能取得这些修改。

脚本始终输出 `find-process-mode: strict`，供本机按需识别进程。微信进程分流需要流量经过本机 Mihomo，且客户端未覆盖此设置；路由器转发的其他设备流量无法获得原设备的进程名。

`GLOBAL` 是内核预置的全局入口，脚本显式设置 `hidden: true`，使 Clash Party 的普通策略页仅显示上述四个策略。客户端开启「显示隐藏代理组」后仍可查看它。当前规则分流不引用 `GLOBAL`。

### 关于链式代理的说明

在 Substore 添加自建节点时，设置 `dialer-proxy: "前置代理"` 即可自动识别链式代理。落地节点直接列在「国外」与「AI」中；脚本仅额外生成隐藏的「前置代理」组，其候选为 `DIRECT` 加所有非落地、非 Tailscale 节点，避免链式循环。订阅全部为落地节点时，「前置代理」仅保留 `DIRECT`。

![新增的代理组](img/dialer-group.png) ![如何配置自建节点](img/dialer-example.png)

### 关于 Tailscale 的说明

Mihomo 内核在近期的更新中支持了 Tailscale 出站，这覆写规则也做出了更新，当检测到订阅中存在`tailscale`类型的节点时，会自动配置相关的代理组、Tun 配置和分流规则，开箱即用，支持 Magic DNS，以下是 Tailscale 节点配置的示例：

「Tailscale」代理组默认带有 `hidden: true`，不会显示在支持此字段的客户端代理组列表中；Tailscale 节点从「国外」「AI」及「前置代理」候选中排除，仅通过 `100.64.0.0/10`、`fd7a:115c:a1e0::/48` 和 `ts.net` 的定向分流规则使用。

```yaml
proxies:
  - name: "Tailscale出口"   # 注意节点名称不能为 Tailscale，否则会和代理组重名造成启动出错
    type: tailscale
    auth-key: tskey-auth-xxxxxxxx
    control-url: https://controlplane.tailscale.com
    ephemeral: true
    udp: true
```

### 关于自动生成的 YAML 格式覆写

除了直接引用动态构建的 JS 覆写脚本外，你也可以使用预先生成好的静态 YAML 覆写文件。这适用于某些不支持执行 JS 的客户端（例如旧版的 Clash Verge）。

> [!NOTE]
> 为了保持代码仓库的纯净，`main` 主分支不再跟踪和提交生成的产物文件（如 `convert.js` 和 `yamls/`）。
> 源码推送到 `main`（涉及 `src/` 或 `scripts/`）后，Preview 工作流自动构建并更新 `preview` 分支。正式发布由 `src-v*` Tag 触发 Release 工作流，产物写入 `dist` 分支及对应 Release。

当前定制版的 YAML 位于自己仓库的 `preview` 分支，文件名按六个布尔参数和四个广告源组合生成，共 256 份：

```text
config_adblock-{0|1|2|3}_ipv6-{0|1}_full-{0|1}_keepalive-{0|1}_fakeip-{0|1}_quic-{0|1}_tun-{0|1}.yaml
```

例如开启 `full`、保留默认 `fakeip`，其余关闭：

```text
https://raw.githubusercontent.com/zdl9511/override-rules/refs/heads/preview/yamls/config_adblock-0_ipv6-0_full-1_keepalive-0_fakeip-1_quic-0_tun-0.yaml
```

旧的 `config_gt-*` 文件已移除，使用静态 YAML 时需更新地址；JS 覆写地址不变。正式发布产物可从维护者仓库的 `dist` 分支或版本 Tag 获取，需与该版本的文件命名规则对应。

静态 YAML 固定使用 `include-all`，由内核填入实际节点。生成器的 `fake_proxies.json` 无法反映真实订阅的链式代理与 Tailscale 状态；此类订阅适合使用 JS 动态覆写。

### 如何自定义与贡献

**如果你想基于本项目深度定制自己专属的覆写规则：**

请阅读 [如何自定义专属覆写规则](docs/HOW_TO_CUSTOMISE.md)。里面详细介绍了如何修改默认参数、调整代理组及增添自定义的 Rule Providers。

**如果你想为本项目贡献代码或新增特性：**

请阅读 [贡献指南](docs/HOW_TO_CONTRIBUTE.md)。里面包含关于代码规范、开发流与提交 PR 的要求。

**如果你是 AI AGENT：**

请阅读 [`./AGENTS.md`](./AGENTS.md)。
