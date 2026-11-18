import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { analyzeNodes } from "../../src/analysis/classify";
import { buildBaseLists } from "../../src/builders/selectors";

describe("buildBaseLists", () => {
    it("原始节点直接成为候选，不插入策略组或 DIRECT", () => {
        const nodes = analyzeNodes([
            { name: "美国 02" },
            { name: "新加坡 01" },
            { name: "香港 0.2x" },
        ]);
        assert.deepEqual(buildBaseLists(nodes, false).proxySelector, [
            "美国 02",
            "新加坡 01",
            "香港 0.2x",
        ]);
    });

    it("动态节点候选只排除 Tailscale，保留落地节点", () => {
        const nodes = analyzeNodes([
            { name: "落地A", "dialer-proxy": "前置代理" },
            { name: "NodeA" },
            { name: "Tailscale(A.1)", type: "tailscale" },
        ]);
        const lists = buildBaseLists(nodes, true);
        assert.deepEqual(lists.proxySelector, [
            {
                "include-all": true,
                "exclude-filter": "^(?:Tailscale\\(A\\.1\\))$",
            },
        ]);
        assert.deepEqual(lists.frontProxySelector, ["DIRECT", "NodeA"]);
    });

    it("没有 Tailscale 时动态候选无需过滤名称", () => {
        assert.deepEqual(buildBaseLists(analyzeNodes([{ name: "NodeA" }]), true).proxySelector, [
            { "include-all": true },
        ]);
    });

    it("空订阅保留空候选，交给策略组工厂补 DIRECT", () => {
        for (const regex of [true, false]) {
            assert.deepEqual(buildBaseLists(analyzeNodes([]), regex), {
                proxySelector: [],
                frontProxySelector: ["DIRECT"],
            });
        }
    });

    it("全落地时普通候选不为空，前置候选只有 DIRECT", () => {
        const nodes = analyzeNodes([{ name: "落地A", "dialer-proxy": "前置代理" }]);
        assert.deepEqual(buildBaseLists(nodes, false), {
            proxySelector: ["落地A"],
            frontProxySelector: ["DIRECT"],
        });
    });
});
