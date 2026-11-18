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

import { buildFeatureFlags } from "./args/parse";
import { analyzeNodes } from "./analysis/classify";
import { buildBaseLists } from "./builders/selectors";
import { assembleConfig } from "./builders/config";
import { buildProxyGroups } from "./builders/proxy-groups";
import type { ScriptArgs } from "./types/args";
import type { ClashConfig } from "./types/clash";

declare const $arguments: ScriptArgs;

/** 读取脚本环境传入的参数；未检测到时返回空对象以使用默认值。 */
function readRawArgs(): ScriptArgs {
    try {
        return $arguments;
    } catch {
        return {};
    }
}

/**
 * 覆写脚本入口。
 *
 * 流程：解析参数 → 识别链式代理和 Tailscale → 构建原始节点候选 → 构建代理组 → 组装最终配置。
 * @param config - 上游订阅配置
 */
function main(config: ClashConfig): ClashConfig {
    if (!config.proxies || !Array.isArray(config.proxies)) {
        throw new Error("[powerfullz 的覆写脚本] 错误：Clash 配置中缺少有效的 proxies 字段");
    }

    const flags = buildFeatureFlags(readRawArgs());
    const nodes = analyzeNodes(config.proxies);
    const lists = buildBaseLists(nodes, flags.regexFilter);
    const proxyGroups = buildProxyGroups({ nodes, lists });

    return assembleConfig(config, { flags, nodes, proxyGroups });
}

(globalThis as Record<string, unknown>).main = main;
