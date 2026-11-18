/** 保留订阅顺序，仅区分普通出口、链式代理前置候选与 Tailscale。 */

import { PROXY_GROUPS } from "../catalog/group-names";
import type { NodeAnalysis, ProxyNode } from "../types/proxy";

export function analyzeNodes(nodes: ProxyNode[]): NodeAnalysis {
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
        hasTailscale: tailscaleNodes.length > 0,
    };
}
