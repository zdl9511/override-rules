/** 原始节点候选与链式代理前置候选；不再生成地区或测速选择层。 */

import { buildNodeExcludeFilter } from "../utils/regex";
import type { BaseLists, NodeAnalysis, ProxyGroupCandidate } from "../types/proxy";

export function buildBaseLists(nodes: NodeAnalysis, regexFilter: boolean): BaseLists {
    let proxySelector: ProxyGroupCandidate[] = nodes.proxyNodes.map((node) => node.name);
    if (regexFilter && nodes.proxyNodes.length > 0) {
        const excludeFilter = buildNodeExcludeFilter(nodes.tailscaleNodes);
        proxySelector = [
            {
                "include-all": true,
                ...(excludeFilter ? { "exclude-filter": excludeFilter } : {}),
            },
        ];
    }

    return {
        proxySelector,
        // 前置候选排除所有经「前置代理」拨号的节点，避免链式循环。
        frontProxySelector: ["DIRECT", ...nodes.frontProxyNodes.map((node) => node.name)],
    };
}
