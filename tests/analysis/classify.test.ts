import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeNodes } from "../../src/analysis/classify";
import type { ProxyNode } from "../../src/types/proxy";

const PROXIES: ProxyNode[] = [
    { name: "新加坡 01" },
    { name: "落地A", "dialer-proxy": "前置代理" },
    { name: "香港 0.2x 大流量" },
    { name: "Tailscale出口", type: "tailscale" },
    { name: "美国 01" },
];

describe("analyzeNodes", () => {
    it("普通出口包括落地节点，名称和订阅顺序保持原样", () => {
        assert.deepEqual(
            analyzeNodes(PROXIES).proxyNodes.map((node) => node.name),
            ["新加坡 01", "落地A", "香港 0.2x 大流量", "美国 01"]
        );
    });

    it("仅前置候选排除落地节点和 Tailscale", () => {
        const result = analyzeNodes(PROXIES);
        assert.equal(result.hasFrontProxy, true);
        assert.deepEqual(
            result.frontProxyNodes.map((node) => node.name),
            ["新加坡 01", "香港 0.2x 大流量", "美国 01"]
        );
        assert.equal(result.hasTailscale, true);
        assert.deepEqual(result.tailscaleNodes, [PROXIES[3]]);
    });

    it("空订阅与普通订阅均不需要前置路由组", () => {
        assert.equal(analyzeNodes([]).hasFrontProxy, false);
        assert.equal(analyzeNodes([{ name: "NodeA" }]).hasFrontProxy, false);
        assert.equal(analyzeNodes([]).hasTailscale, false);
    });

    it("全落地时仍保留原始出口，前置候选为空", () => {
        const nodes: ProxyNode[] = [
            { name: "落地A", "dialer-proxy": "前置代理" },
            { name: "落地B", "dialer-proxy": "前置代理" },
        ];
        const result = analyzeNodes(nodes);
        assert.deepEqual(result.proxyNodes, nodes);
        assert.deepEqual(result.frontProxyNodes, []);
        assert.equal(result.hasFrontProxy, true);
    });
});
