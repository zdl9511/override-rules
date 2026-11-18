import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFeatureFlags } from "../../src/args/parse";
import { analyzeNodes } from "../../src/analysis/classify";
import { buildBaseLists } from "../../src/builders/selectors";
import { assembleConfig } from "../../src/builders/config";
import { buildProxyGroups } from "../../src/builders/proxy-groups";
import { CUSTOM_DIRECT_RULES } from "../../src/catalog/custom-direct";
import { PROXY_GROUPS } from "../../src/catalog/group-names";
import { ruleSets } from "../../src/catalog/rule-sets";
import type { ClashConfig } from "../../src/types/clash";
import type { ProxyGroup } from "../../src/types/proxy";
import type { ScriptArgs } from "../../src/types/args";

function run(args: ScriptArgs, config: ClashConfig): ClashConfig {
    const flags = buildFeatureFlags(args);
    const proxies = config.proxies ?? [];
    const nodes = analyzeNodes(proxies);
    const lists = buildBaseLists(nodes, flags.regexFilter);
    const proxyGroups = buildProxyGroups({ nodes, lists });
    return assembleConfig(config, { flags, nodes, proxyGroups });
}

function group(config: ClashConfig, name: string): ProxyGroup | undefined {
    return config["proxy-groups"]?.find((item) => item.name === name);
}

const CONFIG: ClashConfig = {
    proxies: [{ name: "香港01" }, { name: "香港02" }, { name: "美国01" }, { name: "美国02" }],
    hosts: { "example.com": ["1.2.3.4"] },
};

describe("assembleConfig", () => {
    it("只生成直连、自定义直连、国外、AI，顺序固定", () => {
        const result = run({}, CONFIG);
        assert.deepEqual(
            result["proxy-groups"]?.map((item) => item.name),
            ["直连", "自定义直连", "国外", "AI"]
        );
        assert.deepEqual(group(result, PROXY_GROUPS.DIRECT)?.proxies, ["DIRECT"]);
        assert.deepEqual(group(result, PROXY_GROUPS.CUSTOM_DIRECT)?.proxies, ["直连", "国外"]);
        assert.ok(result["proxy-groups"]?.every((item) => item.type === "select" && !item.hidden));
    });

    it("国外和 AI 只显示原始节点，保留名称及订阅顺序", () => {
        const proxies = [
            { name: "新加坡 02" },
            { name: "落地A", "dialer-proxy": "前置代理" },
            { name: "香港 0.2x" },
            { name: "美国 01" },
        ];
        const result = run({}, { proxies });
        for (const name of [PROXY_GROUPS.FOREIGN, PROXY_GROUPS.AI]) {
            assert.deepEqual(
                group(result, name)?.proxies,
                proxies.map((node) => node.name)
            );
        }
        assert.deepEqual(group(result, PROXY_GROUPS.FRONT_PROXY)?.proxies, [
            "DIRECT",
            "新加坡 02",
            "香港 0.2x",
            "美国 01",
        ]);
        assert.equal(group(result, PROXY_GROUPS.FRONT_PROXY)?.hidden, true);
    });

    it("regex 模式直接载入节点，仅排除 Tailscale，保留落地出口", () => {
        const result = run(
            { regex: "true" },
            {
                proxies: [
                    { name: "NodeA" },
                    { name: "落地A", "dialer-proxy": "前置代理" },
                    { name: "Tailscale出口", type: "tailscale" },
                ],
            }
        );
        for (const name of [PROXY_GROUPS.FOREIGN, PROXY_GROUPS.AI]) {
            const policy = group(result, name);
            assert.equal(policy?.["include-all"], true);
            assert.equal(policy?.["exclude-filter"], "^(?:Tailscale出口)$");
            assert.equal(policy?.proxies, undefined);
        }
        assert.deepEqual(group(result, PROXY_GROUPS.FRONT_PROXY)?.proxies, ["DIRECT", "NodeA"]);
    });

    it("空订阅和仅 Tailscale 订阅的普通策略均补 DIRECT", () => {
        for (const regex of ["true", "false"]) {
            for (const proxies of [[], [{ name: "Tailscale出口", type: "tailscale" }]]) {
                const result = run({ regex }, { proxies });
                assert.deepEqual(group(result, PROXY_GROUPS.FOREIGN)?.proxies, ["DIRECT"]);
                assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["DIRECT"]);
            }
        }
    });

    it("全落地时每个出口原样列出，前置仅 DIRECT", () => {
        const proxies = [
            { name: "落地A", "dialer-proxy": "前置代理" },
            { name: "落地B", "dialer-proxy": "前置代理" },
        ];
        const result = run({}, { proxies });
        assert.deepEqual(group(result, PROXY_GROUPS.FOREIGN)?.proxies, ["落地A", "落地B"]);
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["落地A", "落地B"]);
        assert.deepEqual(group(result, PROXY_GROUPS.FRONT_PROXY)?.proxies, ["DIRECT"]);
    });

    it("Tailscale 仅用于隐藏的定向路由组", () => {
        const result = run(
            {},
            { proxies: [{ name: "NodeA" }, { name: "Tailscale出口", type: "tailscale" }] }
        );
        assert.deepEqual(group(result, PROXY_GROUPS.FOREIGN)?.proxies, ["NodeA"]);
        assert.deepEqual(group(result, PROXY_GROUPS.TAILSCALE)?.proxies, ["Tailscale出口"]);
        assert.equal(group(result, PROXY_GROUPS.TAILSCALE)?.hidden, true);
    });

    it("保留上游 proxies 与 hosts", () => {
        const result = run({}, CONFIG);
        assert.deepEqual(result.proxies, CONFIG.proxies);
        assert.deepEqual(result.hosts, CONFIG.hosts);
        assert.ok(!("hosts" in run({}, { proxies: [] })));
    });

    it("full 两种模式都开启按需进程识别", () => {
        for (const full of ["true", "false"]) {
            const result = run({ full }, CONFIG);
            assert.equal(result["find-process-mode"], "strict");
            assert.equal(result["mixed-port"], full === "true" ? 7890 : undefined);
        }
    });

    it("关闭广告时自定义清单仍完整内嵌", () => {
        const providers = run({ adblock: "0" }, CONFIG)["rule-providers"] ?? {};
        assert.deepEqual(Object.keys(providers), ["CustomDirect"]);
        assert.deepEqual(providers.CustomDirect, {
            type: "inline",
            behavior: "classical",
            payload: CUSTOM_DIRECT_RULES,
        });
    });

    it("保留三种广告来源，广告直接 REJECT", () => {
        for (const adblock of ["1", "2", "3"]) {
            const result = run({ adblock }, CONFIG);
            const provider = result["rule-providers"]?.ADBlock;
            assert.equal(provider?.type, "http");
            if (provider?.type !== "http") throw new Error("缺少广告规则源");
            if (adblock === "1")
                assert.equal(provider.url, "https://adrules.top/adrules-mihomo.mrs");
            if (adblock === "2") assert.equal(provider, ruleSets.ADBlock);
            if (adblock === "3") assert.match(provider.url, /AWAvenue-Ads-Rule/);
            assert.ok(result.rules?.includes("RULE-SET,ADBlock,REJECT"));
        }
    });

    it("策略和链式拨号引用均有效且没有循环", () => {
        const result = run(
            {},
            {
                proxies: [
                    ...(CONFIG.proxies ?? []),
                    { name: "落地A", "dialer-proxy": "前置代理" },
                    { name: "Tailscale出口", type: "tailscale" },
                ],
            }
        );
        const groups = new Map(result["proxy-groups"]?.map((item) => [item.name, item]));
        const nodes = new Map(result.proxies?.map((item) => [item.name, item]));
        const names = new Set([...groups.keys(), ...nodes.keys(), "DIRECT", "REJECT"]);
        function visit(name: string, path: string[]): void {
            assert.ok(names.has(name), name);
            assert.ok(!path.includes(name), [...path, name].join(" → "));
            const dialer = nodes.get(name)?.["dialer-proxy"];
            const targets =
                groups.get(name)?.proxies ?? (typeof dialer === "string" ? [dialer] : []);
            for (const candidate of targets) visit(candidate, [...path, name]);
        }
        for (const name of groups.keys()) visit(name, []);
        for (const rule of result.rules ?? []) {
            const parts = rule.split(",");
            const target = parts.at(-1) === "no-resolve" ? parts.at(-2) : parts.at(-1);
            assert.ok(target && names.has(target), rule);
        }
    });
});
