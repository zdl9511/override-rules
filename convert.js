/*!
powerfullz 的 Substore 订阅转换脚本
https://github.com/powerfullz/override-rules

支持的传入参数：
- landing: 自动检测带 `dialer-proxy` 字段的节点，无需用户传参
- ipv6: 启用 IPv6 支持（默认 false）
- tun: 启用 TUN 模式（默认 false）
- full: 输出完整配置（适合纯内核启动，默认 false）
- keepalive: 启用 tcp-keep-alive（默认 false）
- fakeip: DNS 使用 FakeIP 模式（默认 true；传 false 时为 RedirHost）
- quic: 允许 QUIC 流量（UDP 443，默认 false）
- regex: 通过 include-all 动态载入原始节点，排除 Tailscale（默认 false）
- adblock: 去广告规则（0=关闭，1=adrules.top，2=217heidai，3=AWAvenue，默认 3）

源码位于 `src/`，入口为 `src/main.ts`。
可见策略：直连、自定义直连、国外、AI；自定义匹配条件维护于 src/catalog/custom-direct.ts。
始终启用按需进程识别；自定义清单优先于 QUIC 限制、广告和自动分类。
*/
"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/utils/primitives.ts
  function parseBool(value, defaultValue = false) {
    if (typeof value === "undefined") return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return false;
  }
  function parseNumber(value, defaultValue = 0) {
    if (value === null || typeof value === "undefined") {
      return defaultValue;
    }
    const num = parseInt(String(value), 10);
    return Number.isNaN(num) ? defaultValue : num;
  }
  function isNotNull(value) {
    return value !== null;
  }
  var init_primitives = __esm({
    "src/utils/primitives.ts"() {
      "use strict";
    }
  });

  // src/args/schema.ts
  var ARG_DEFAULTS;
  var init_schema = __esm({
    "src/args/schema.ts"() {
      "use strict";
      ARG_DEFAULTS = {
        /** 启用 IPv6 支持。 */
        ipv6Enabled: false,
        /** 输出完整内核配置。 */
        fullConfig: false,
        /** 启用 TCP keep-alive。 */
        keepAliveEnabled: false,
        /** 使用 fake-ip 增强模式。 */
        fakeIPEnabled: true,
        /** 允许 QUIC（UDP 443）流量。 */
        quicEnabled: false,
        /** 使用动态原始节点候选。 */
        regexFilter: false,
        /** 启用 TUN 模式。 */
        tunEnabled: false,
        /** 去广告规则来源：0=关闭，1=adrules.top，2=217heidai，3=AWAvenue。 */
        adblockSource: 3
      };
    }
  });

  // src/args/parse.ts
  function parseAdblockSource(args) {
    const raw = parseNumber(args.adblock, ARG_DEFAULTS.adblockSource);
    return raw === 0 || raw === 1 || raw === 2 || raw === 3 ? raw : ARG_DEFAULTS.adblockSource;
  }
  function buildFeatureFlags(args) {
    return {
      ipv6Enabled: parseBool(args.ipv6, ARG_DEFAULTS.ipv6Enabled),
      fullConfig: parseBool(args.full, ARG_DEFAULTS.fullConfig),
      keepAliveEnabled: parseBool(args.keepalive, ARG_DEFAULTS.keepAliveEnabled),
      fakeIPEnabled: parseBool(args.fakeip, ARG_DEFAULTS.fakeIPEnabled),
      quicEnabled: parseBool(args.quic, ARG_DEFAULTS.quicEnabled),
      regexFilter: parseBool(args.regex, ARG_DEFAULTS.regexFilter),
      tunEnabled: parseBool(args.tun, ARG_DEFAULTS.tunEnabled),
      adblockSource: parseAdblockSource(args)
    };
  }
  var init_parse = __esm({
    "src/args/parse.ts"() {
      "use strict";
      init_primitives();
      init_schema();
    }
  });

  // src/catalog/group-names.ts
  var PROXY_GROUPS;
  var init_group_names = __esm({
    "src/catalog/group-names.ts"() {
      "use strict";
      PROXY_GROUPS = {
        DIRECT: "直连",
        CUSTOM_DIRECT: "自定义直连",
        FOREIGN: "国外",
        AI: "AI",
        FRONT_PROXY: "前置代理",
        TAILSCALE: "Tailscale",
        GLOBAL: "GLOBAL"
      };
    }
  });

  // src/analysis/classify.ts
  function analyzeNodes(nodes) {
    const proxyNodes = nodes.filter((node) => node.name && node.type !== "tailscale");
    const tailscaleNodes = nodes.filter((node) => node.name && node.type === "tailscale");
    const frontProxyNodes = proxyNodes.filter(
      (node) => node["dialer-proxy"] !== PROXY_GROUPS.FRONT_PROXY
    );
    return {
      proxyNodes,
      frontProxyNodes,
      hasFrontProxy: frontProxyNodes.length < proxyNodes.length,
      tailscaleNodes,
      hasTailscale: tailscaleNodes.length > 0
    };
  }
  var init_classify = __esm({
    "src/analysis/classify.ts"() {
      "use strict";
      init_group_names();
    }
  });

  // src/utils/regex.ts
  function escapeRegExp(value) {
    return value.replace(REGEXP_SPECIAL_CHARS, "\\$&");
  }
  function buildNodeExcludeFilter(nodes) {
    const names = [...new Set(nodes.map((node) => node.name).filter(Boolean))];
    if (names.length === 0) return void 0;
    return `^(?:${names.map(escapeRegExp).join("|")})$`;
  }
  var REGEXP_SPECIAL_CHARS;
  var init_regex = __esm({
    "src/utils/regex.ts"() {
      "use strict";
      REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;
    }
  });

  // src/builders/selectors.ts
  function buildBaseLists(nodes, regexFilter) {
    let proxySelector = nodes.proxyNodes.map((node) => node.name);
    if (regexFilter && nodes.proxyNodes.length > 0) {
      const excludeFilter = buildNodeExcludeFilter(nodes.tailscaleNodes);
      proxySelector = [
        {
          "include-all": true,
          ...excludeFilter ? { "exclude-filter": excludeFilter } : {}
        }
      ];
    }
    return {
      proxySelector,
      // 前置候选排除所有经「前置代理」拨号的节点，避免链式循环。
      frontProxySelector: ["DIRECT", ...nodes.frontProxyNodes.map((node) => node.name)]
    };
  }
  var init_selectors = __esm({
    "src/builders/selectors.ts"() {
      "use strict";
      init_regex();
    }
  });

  // src/catalog/custom-direct.ts
  var CUSTOM_DIRECT_RULES;
  var init_custom_direct = __esm({
    "src/catalog/custom-direct.ts"() {
      "use strict";
      CUSTOM_DIRECT_RULES = [
        // 域名
        "DOMAIN-SUFFIX,423down.com",
        "DOMAIN-SUFFIX,951199.xyz",
        "DOMAIN-SUFFIX,admin.pandarobot.chat",
        "DOMAIN-SUFFIX,chengmo.cc.cd",
        "DOMAIN-SUFFIX,codexcn.com",
        "DOMAIN-SUFFIX,elysia.h-e.top",
        "DOMAIN-SUFFIX,gitee.com",
        "DOMAIN-SUFFIX,hybgzs.com",
        "DOMAIN-SUFFIX,lianxininc.com",
        "DOMAIN-SUFFIX,lydgcloud.com",
        "DOMAIN-SUFFIX,mpyit.com",
        "DOMAIN-SUFFIX,new.qqwang.net",
        "DOMAIN-SUFFIX,new.sharedchat.cc",
        "DOMAIN-SUFFIX,oracle.com",
        "DOMAIN-SUFFIX,pi.dev",
        "DOMAIN-SUFFIX,quanshengscm.com",
        "DOMAIN-SUFFIX,workflow.lydgcloud.com",
        // IP 或网段
        "IP-CIDR,112.233.242.97/32",
        "IP-CIDR,116.204.85.57/32",
        "IP-CIDR,120.46.144.218/32",
        "IP-CIDR,161.118.206.171/32",
        "IP-CIDR,172.16.0.2/32",
        "IP-CIDR,43.108.58.112/32",
        // Windows 微信新旧版本的主进程
        "PROCESS-NAME,WeChat.exe",
        "PROCESS-NAME,Weixin.exe"
      ];
    }
  });

  // src/catalog/endpoints.ts
  var CDN_URL;
  var init_endpoints = __esm({
    "src/catalog/endpoints.ts"() {
      "use strict";
      CDN_URL = "https://cdn.jsdelivr.net";
    }
  });

  // src/catalog/rule-sets.ts
  function ruleSet(key, target, noResolve = false) {
    return `RULE-SET,${key},${target}${noResolve ? ",no-resolve" : ""}`;
  }
  var ruleSets, adblockAlternatives;
  var init_rule_sets = __esm({
    "src/catalog/rule-sets.ts"() {
      "use strict";
      init_custom_direct();
      init_endpoints();
      ruleSets = {
        CustomDirect: {
          type: "inline",
          behavior: "classical",
          payload: CUSTOM_DIRECT_RULES
        },
        ADBlock: {
          type: "http",
          behavior: "domain",
          format: "yaml",
          interval: 86400,
          url: `${CDN_URL}/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.yaml`,
          path: "./ruleset/ADBlock.yaml"
        },
        AdditionalFilter: {
          type: "http",
          behavior: "classical",
          format: "text",
          interval: 86400,
          url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list`,
          path: "./ruleset/AdditionalFilter.list"
        }
      };
      adblockAlternatives = {
        1: {
          type: "http",
          behavior: "domain",
          format: "mrs",
          interval: 86400,
          url: "https://adrules.top/adrules-mihomo.mrs",
          path: "./ruleset/ADBlock.mrs"
        },
        3: {
          type: "http",
          behavior: "domain",
          format: "mrs",
          interval: 86400,
          url: `${CDN_URL}/gh/TG-Twilight/AWAvenue-Ads-Rule@main/Filters/AWAvenue-Ads-Rule-Clash.mrs`,
          path: "./ruleset/ADBlock.mrs"
        }
      };
    }
  });

  // src/catalog/dns.ts
  var FAKE_IP_FILTER, DEFAULT_NAMESERVERS, DEFAULT_FALLBACK_DNS;
  var init_dns = __esm({
    "src/catalog/dns.ts"() {
      "use strict";
      FAKE_IP_FILTER = [
        "geosite:connectivity-check",
        "Mijia Cloud",
        "dig.io.mi.com",
        "localhost.ptlogin2.qq.com",
        "*.icloud.com",
        "*.stun.*.*",
        "*.stun.*.*.*",
        "*.lan",
        "*.localdomain",
        "*.example",
        "*.invalid",
        "*.localhost",
        "*.test",
        "*.local",
        "*.home.arpa",
        "time.*.com",
        "time.*.gov",
        "time.*.edu.cn",
        "time.*.apple.com",
        "time1.*.com",
        "time2.*.com",
        "time3.*.com",
        "time4.*.com",
        "time5.*.com",
        "time6.*.com",
        "time7.*.com",
        "ntp.*.com",
        "ntp1.*.com",
        "ntp2.*.com",
        "ntp3.*.com",
        "ntp4.*.com",
        "ntp5.*.com",
        "ntp6.*.com",
        "ntp7.*.com",
        "*.time.edu.cn",
        "*.ntp.org.cn",
        "+.pool.ntp.org",
        "time1.cloud.tencent.com",
        "stun.*.*",
        "stun.*.*.*",
        "swscan.apple.com",
        "mesu.apple.com",
        "music.163.com",
        "*.music.163.com",
        "*.126.net",
        "musicapi.taihe.com",
        "music.taihe.com",
        "songsearch.kugou.com",
        "trackercdn.kugou.com",
        "*.kuwo.cn",
        "api-jooxtt.sanook.com",
        "api.joox.com",
        "y.qq.com",
        "*.y.qq.com",
        "streamoc.music.tc.qq.com",
        "mobileoc.music.tc.qq.com",
        "isure.stream.qqmusic.qq.com",
        "dl.stream.qqmusic.qq.com",
        "aqqmusic.tc.qq.com",
        "amobile.music.tc.qq.com",
        "localhost.ptlogin2.qq.com",
        "*.msftconnecttest.com",
        "*.msftncsi.com",
        "*.xiami.com",
        "*.music.migu.cn",
        "music.migu.cn",
        "+.wotgame.cn",
        "+.wggames.cn",
        "+.wowsgame.cn",
        "+.wargaming.net",
        "*.*.*.srv.nintendo.net",
        "*.*.stun.playstation.net",
        "xbox.*.*.microsoft.com",
        "*.*.xboxlive.com",
        "*.ipv6.microsoft.com",
        "teredo.*.*.*",
        "teredo.*.*",
        "speedtest.cros.wr.pvp.net",
        "+.jjvip8.com",
        "www.douyu.com",
        "activityapi.huya.com",
        "activityapi.huya.com.w.cdngslb.com",
        "www.bilibili.com",
        "api.bilibili.com",
        "a.w.bilicdn1.com",
        "+.apt-agent.com"
      ];
      DEFAULT_NAMESERVERS = [
        "system",
        "223.5.5.5",
        "119.29.29.29",
        "180.184.1.1"
      ];
      DEFAULT_FALLBACK_DNS = [
        "quic://dns0.eu",
        "https://dns.cloudflare.com/dns-query",
        "https://dns.sb/dns-query",
        "tcp://208.67.222.222",
        "tcp://8.26.56.2"
      ];
    }
  });

  // src/builders/dns.ts
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function toStringList(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : void 0;
  }
  function mergeStringList(current, upstream) {
    const upstreamList = toStringList(upstream);
    if (!current && !upstreamList) return void 0;
    return [.../* @__PURE__ */ new Set([...current ?? [], ...upstreamList ?? []])];
  }
  function mergePolicyMap(current, upstream) {
    if (!isRecord(upstream)) return current;
    const inherited = {};
    for (const [domain, value] of Object.entries(upstream)) {
      if (typeof value === "string") {
        inherited[domain] = value;
      } else if (toStringList(value)) {
        inherited[domain] = value;
      }
    }
    return { ...current ?? {}, ...inherited };
  }
  function inheritPolicyFields(generated, upstream) {
    const inherited = {};
    for (const field of POLICY_FIELDS) {
      const merged = mergePolicyMap(generated[field], upstream[field]);
      if (merged !== void 0) inherited[field] = merged;
    }
    return inherited;
  }
  function inheritScalarFields(generated, upstream) {
    const inherited = {};
    for (const field of SCALAR_FIELDS) {
      const current = generated[field];
      const value = upstream[field];
      if (current === void 0 && typeof value === "string" && value.length > 0) {
        inherited[field] = value;
      }
    }
    return inherited;
  }
  function inheritListFields(generated, upstream) {
    const inherited = {};
    for (const field of LIST_FIELDS) {
      const merged = mergeStringList(generated[field], upstream[field]);
      if (merged !== void 0) inherited[field] = merged;
    }
    return inherited;
  }
  function inheritDnsFields(generated, upstream) {
    if (!isRecord(upstream)) return generated;
    return {
      ...generated,
      ...inheritPolicyFields(generated, upstream),
      ...inheritListFields(generated, upstream),
      ...inheritScalarFields(generated, upstream)
    };
  }
  function createBaseDnsConfig(mode, ipv6Enabled) {
    return {
      enable: true,
      ipv6: ipv6Enabled,
      "prefer-h3": true,
      "enhanced-mode": mode,
      nameserver: [...DEFAULT_NAMESERVERS],
      fallback: [...DEFAULT_FALLBACK_DNS],
      ...mode === "fake-ip" && { "fake-ip-filter": [...FAKE_IP_FILTER] }
    };
  }
  function buildDns({ fakeIPEnabled, ipv6Enabled, upstreamDns }) {
    const generated = createBaseDnsConfig(fakeIPEnabled ? "fake-ip" : "redir-host", ipv6Enabled);
    return inheritDnsFields(generated, upstreamDns);
  }
  var POLICY_FIELDS, LIST_FIELDS, SCALAR_FIELDS;
  var init_dns2 = __esm({
    "src/builders/dns.ts"() {
      "use strict";
      init_dns();
      POLICY_FIELDS = ["nameserver-policy", "proxy-server-nameserver-policy"];
      LIST_FIELDS = ["proxy-server-nameserver", "fake-ip-filter"];
      SCALAR_FIELDS = ["listen"];
    }
  });

  // src/builders/full-config.ts
  function buildFullConfig(flags) {
    return {
      "mixed-port": 7890,
      "redir-port": 7892,
      "tproxy-port": 7893,
      "routing-mark": 7894,
      "allow-lan": true,
      "bind-address": "*",
      ipv6: flags.ipv6Enabled,
      mode: "rule",
      "unified-delay": true,
      "tcp-concurrent": true,
      "log-level": "info",
      "geodata-loader": "standard",
      "external-controller": ":9999",
      "disable-keep-alive": !flags.keepAliveEnabled,
      profile: { "store-selected": true }
    };
  }
  var init_full_config = __esm({
    "src/builders/full-config.ts"() {
      "use strict";
    }
  });

  // src/builders/geox.ts
  var geoxUrl;
  var init_geox = __esm({
    "src/builders/geox.ts"() {
      "use strict";
      init_endpoints();
      geoxUrl = {
        geoip: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/geoip.dat`,
        geosite: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/geosite.dat`,
        mmdb: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/country.mmdb`,
        asn: `${CDN_URL}/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb`
      };
    }
  });

  // src/builders/rules.ts
  function buildRules({
    quicEnabled,
    hasTailscale,
    adblockSource
  }) {
    return [
      // 用户指定的直连条件优先于通用限制和分类，包括微信的 UDP 流量。
      ruleSet("CustomDirect", PROXY_GROUPS.CUSTOM_DIRECT, true),
      !quicEnabled ? "AND,((DST-PORT,443),(NETWORK,UDP)),REJECT" : null,
      hasTailscale ? `IP-CIDR,100.64.0.0/10,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
      hasTailscale ? `IP-CIDR,fd7a:115c:a1e0::/48,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
      hasTailscale ? `DOMAIN-SUFFIX,ts.net,${PROXY_GROUPS.TAILSCALE}` : null,
      `GEOIP,private,${PROXY_GROUPS.DIRECT},no-resolve`,
      adblockSource > 0 ? ruleSet("ADBlock", "REJECT") : null,
      adblockSource > 0 ? ruleSet("AdditionalFilter", "REJECT") : null,
      `GEOSITE,category-ai-!cn,${PROXY_GROUPS.AI}`,
      `GEOSITE,cn,${PROXY_GROUPS.DIRECT}`,
      `GEOIP,cn,${PROXY_GROUPS.DIRECT}`,
      `MATCH,${PROXY_GROUPS.FOREIGN}`
    ].filter(isNotNull);
  }
  var init_rules = __esm({
    "src/builders/rules.ts"() {
      "use strict";
      init_group_names();
      init_rule_sets();
      init_primitives();
    }
  });

  // src/builders/sniffer.ts
  var snifferConfig;
  var init_sniffer = __esm({
    "src/builders/sniffer.ts"() {
      "use strict";
      snifferConfig = {
        sniff: {
          TLS: {
            ports: [443, 8443]
          },
          HTTP: {
            ports: [80, 8080, 8880]
          },
          QUIC: {
            ports: [443, 8443]
          }
        },
        "override-destination": false,
        enable: true,
        "force-dns-mapping": false,
        "skip-domain": ["Mijia Cloud", "dlg.io.mi.com", "+.push.apple.com"]
      };
    }
  });

  // src/builders/tun.ts
  function buildTunConfig(tunEnabled, hasTailscale) {
    return {
      enable: tunEnabled,
      stack: "mips",
      device: "mihomo",
      "route-exclude-address": [
        !hasTailscale ? "100.64.0.0/10" : null,
        !hasTailscale ? "fd7a:115c:a1e0::/48" : null,
        "192.168.0.0/16"
      ].filter(isNotNull),
      "dns-hijack": ["any:53"],
      mtu: 9e3
    };
  }
  var init_tun = __esm({
    "src/builders/tun.ts"() {
      "use strict";
      init_primitives();
    }
  });

  // src/builders/config.ts
  function assembleConfig(config, { flags, nodes, proxyGroups }) {
    const { ADBlock, AdditionalFilter, ...baseRuleSets } = ruleSets;
    let adblockProvider;
    if (flags.adblockSource === 2) {
      adblockProvider = ADBlock;
    } else if (flags.adblockSource !== 0) {
      adblockProvider = adblockAlternatives[flags.adblockSource];
    }
    return {
      proxies: config.proxies,
      ...config.hosts !== void 0 && { hosts: config.hosts },
      ...flags.fullConfig && buildFullConfig(flags),
      "find-process-mode": "strict",
      "proxy-groups": proxyGroups,
      "rule-providers": {
        ...baseRuleSets,
        ...adblockProvider && { ADBlock: adblockProvider, AdditionalFilter }
      },
      rules: buildRules({
        quicEnabled: flags.quicEnabled,
        hasTailscale: nodes.hasTailscale,
        adblockSource: flags.adblockSource
      }),
      sniffer: snifferConfig,
      dns: buildDns({
        fakeIPEnabled: flags.fakeIPEnabled,
        ipv6Enabled: flags.ipv6Enabled,
        upstreamDns: config.dns
      }),
      tun: buildTunConfig(flags.tunEnabled, nodes.hasTailscale),
      "geodata-mode": true,
      "geox-url": geoxUrl
    };
  }
  var init_config = __esm({
    "src/builders/config.ts"() {
      "use strict";
      init_rule_sets();
      init_dns2();
      init_full_config();
      init_geox();
      init_rules();
      init_sniffer();
      init_tun();
    }
  });

  // src/catalog/icons.ts
  var QURE, SELF, ICONS;
  var init_icons = __esm({
    "src/catalog/icons.ts"() {
      "use strict";
      init_endpoints();
      QURE = `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color`;
      SELF = `${CDN_URL}/gh/powerfullz/override-rules@master/icons`;
      ICONS = {
        select: `${QURE}/Proxy.png`,
        direct: `${QURE}/Direct.png`,
        frontProxy: `${QURE}/Area.png`,
        aiService: `${QURE}/ChatGPT.png`,
        tailscale: `${SELF}/Tailscale.png`
      };
    }
  });

  // src/catalog/service-groups.ts
  var serviceGroups;
  var init_service_groups = __esm({
    "src/catalog/service-groups.ts"() {
      "use strict";
      init_group_names();
      init_icons();
      serviceGroups = [
        {
          name: PROXY_GROUPS.DIRECT,
          icon: ICONS.direct,
          proxies: () => ["DIRECT"]
        },
        {
          name: PROXY_GROUPS.CUSTOM_DIRECT,
          icon: ICONS.direct,
          proxies: () => [PROXY_GROUPS.DIRECT, PROXY_GROUPS.FOREIGN]
        },
        {
          name: PROXY_GROUPS.FOREIGN,
          icon: ICONS.select,
          proxies: (ctx) => ctx.lists.proxySelector
        },
        {
          name: PROXY_GROUPS.AI,
          icon: ICONS.aiService,
          proxies: (ctx) => ctx.lists.proxySelector
        }
      ];
    }
  });

  // src/domain/proxy-group.ts
  function normalizeNodeSource(candidates) {
    const proxies = [];
    const source = {};
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        proxies.push(candidate);
        continue;
      }
      if (candidate.proxies) proxies.push(...candidate.proxies);
      if (candidate["include-all"]) source["include-all"] = true;
      if (candidate["exclude-filter"] !== void 0) {
        source["exclude-filter"] = candidate["exclude-filter"];
      }
    }
    if (proxies.length > 0) source.proxies = proxies;
    if (source["include-all"] || proxies.length > 0) return source;
    return { ...source, proxies: ["DIRECT"] };
  }
  function selectGroup(name, icon, candidates, hidden = false) {
    return {
      name,
      icon,
      type: "select",
      ...hidden ? { hidden: true } : {},
      ...normalizeNodeSource(candidates)
    };
  }
  var init_proxy_group = __esm({
    "src/domain/proxy-group.ts"() {
      "use strict";
    }
  });

  // src/builders/proxy-groups.ts
  function buildProxyGroups(ctx) {
    const groups = serviceGroups.map((def) => selectGroup(def.name, def.icon, def.proxies(ctx)));
    if (ctx.nodes.hasFrontProxy) {
      groups.push(
        selectGroup(
          PROXY_GROUPS.FRONT_PROXY,
          ICONS.frontProxy,
          ctx.lists.frontProxySelector,
          true
        )
      );
    }
    if (ctx.nodes.hasTailscale) {
      groups.push(
        selectGroup(
          PROXY_GROUPS.TAILSCALE,
          ICONS.tailscale,
          ctx.nodes.tailscaleNodes.map((node) => node.name),
          true
        )
      );
    }
    groups.push(
      selectGroup(
        PROXY_GROUPS.GLOBAL,
        ICONS.select,
        groups.map((group) => group.name),
        true
      )
    );
    return groups;
  }
  var init_proxy_groups = __esm({
    "src/builders/proxy-groups.ts"() {
      "use strict";
      init_group_names();
      init_icons();
      init_service_groups();
      init_proxy_group();
    }
  });

  // src/main.ts
  var require_main = __commonJS({
    "src/main.ts"() {
      init_parse();
      init_classify();
      init_selectors();
      init_config();
      init_proxy_groups();
      function readRawArgs() {
        try {
          return $arguments;
        } catch {
          return {};
        }
      }
      function main(config) {
        if (!config.proxies || !Array.isArray(config.proxies)) {
          throw new Error("[powerfullz 的覆写脚本] 错误：Clash 配置中缺少有效的 proxies 字段");
        }
        const flags = buildFeatureFlags(readRawArgs());
        const nodes = analyzeNodes(config.proxies);
        const lists = buildBaseLists(nodes, flags.regexFilter);
        const proxyGroups = buildProxyGroups({ nodes, lists });
        return assembleConfig(config, { flags, nodes, proxyGroups });
      }
      globalThis.main = main;
    }
  });
  require_main();
})();
