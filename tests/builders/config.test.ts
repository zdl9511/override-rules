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
    const nodes = analyzeNodes(proxies, flags.countryThreshold);
    const lists = buildBaseLists({
        landing: nodes.landing,
        landingNodes: nodes.landingNodes,
        lowCostNodes: nodes.lowCostNodes,
        nonLandingNodes: nodes.nonLandingNodes,
        tailscaleNodes: nodes.tailscaleNodes,
        regexFilter: flags.regexFilter,
        regions: nodes.regionLayout,
    });
    const proxyGroups = buildProxyGroups({ flags, nodes, lists });
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
    it("只展示直连、国外、AI、自定义直连四个策略", () => {
        for (const args of [{}, { regex: "true" }, { adblock: "0" }] satisfies ScriptArgs[]) {
            for (const config of [CONFIG, { proxies: [{ name: "NodeA" }] }, { proxies: [] }]) {
                const result = run(args, config);
                assert.deepEqual(
                    result["proxy-groups"]?.filter((item) => !item.hidden).map((item) => item.name),
                    ["直连", "国外", "AI", "自定义直连"]
                );
                assert.deepEqual(group(result, PROXY_GROUPS.DIRECT)?.proxies, ["DIRECT"]);
                assert.deepEqual(group(result, PROXY_GROUPS.CUSTOM_DIRECT)?.proxies, [
                    "直连",
                    "国外",
                ]);
            }
        }
    });

    it("隐藏 GLOBAL 组并保留全局模式的出口候选", () => {
        const result = run({}, CONFIG);
        const groups = result["proxy-groups"] ?? [];
        const global = groups.at(-1);
        assert.equal(global?.name, PROXY_GROUPS.GLOBAL);
        assert.equal(global?.hidden, true);
        assert.equal(global?.["include-all"], true);
        assert.deepEqual(
            global?.proxies,
            groups.slice(0, -1).map((item) => item.name)
        );
    });

    it("保留上游 proxies 与 hosts", () => {
        const result = run({}, CONFIG);
        assert.deepEqual(result.proxies, CONFIG.proxies);
        assert.deepEqual(result.hosts, CONFIG.hosts);
        assert.ok(!("hosts" in run({}, { proxies: [{ name: "NodeA" }] })));
    });

    it("full 两种模式都开启按需进程识别", () => {
        for (const full of ["true", "false"]) {
            const result = run({ full }, CONFIG);
            assert.equal(result["find-process-mode"], "strict");
            assert.equal(result["mixed-port"], full === "true" ? 7890 : undefined);
        }
        assert.equal(run({}, CONFIG)["mixed-port"], undefined);
    });

    it("自定义清单内嵌于配置，关闭广告也始终有效", () => {
        const providers = run({ adblock: "0" }, CONFIG)["rule-providers"] ?? {};
        assert.deepEqual(Object.keys(providers), ["CustomDirect"]);
        assert.deepEqual(providers.CustomDirect, {
            type: "inline",
            behavior: "classical",
            payload: CUSTOM_DIRECT_RULES,
        });
    });

    it("没有地区组时国外与 AI 可以直接选节点", () => {
        const result = run({}, { proxies: [{ name: "NodeA" }, { name: "NodeB" }] });
        for (const name of [PROXY_GROUPS.FOREIGN, PROXY_GROUPS.AI]) {
            assert.deepEqual(group(result, name)?.proxies, ["NodeA", "NodeB", "DIRECT"]);
        }
        assert.deepEqual(group(result, PROXY_GROUPS.AUTO)?.proxies, ["NodeA", "NodeB"]);
        assert.deepEqual(group(result, PROXY_GROUPS.FALLBACK)?.proxies, ["NodeA", "NodeB"]);
        assert.equal(group(result, PROXY_GROUPS.MANUAL), undefined);
    });

    it("分组模式保留隐藏的测速、地区、低倍率候选", () => {
        const result = run(
            {},
            { proxies: [...(CONFIG.proxies ?? []), { name: "香港 0.2x 大流量" }] }
        );
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, [
            "国外",
            "香港节点",
            "美国节点",
            "低倍率节点",
            "手动选择",
            "香港01",
            "香港02",
            "美国01",
            "美国02",
            "香港 0.2x 大流量",
            "DIRECT",
        ]);
        for (const name of [
            "香港节点",
            "美国节点",
            "低倍率节点",
            "自动选择",
            "故障转移",
            "手动选择",
        ]) {
            assert.equal(group(result, name)?.hidden, true);
        }
    });

    it("空订阅时每个组都有可用候选", () => {
        const result = run({}, { proxies: [] });
        for (const item of result["proxy-groups"] ?? []) {
            assert.ok(item["include-all"] === true || (item.proxies?.length ?? 0) > 0, item.name);
        }
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["DIRECT"]);
    });

    it("全落地时前置代理仅包含 DIRECT", () => {
        const result = run({}, { proxies: [{ name: "落地A", "dialer-proxy": "前置代理" }] });
        assert.deepEqual(group(result, PROXY_GROUPS.LANDING)?.proxies, ["落地A"]);
        assert.deepEqual(group(result, PROXY_GROUPS.FRONT_PROXY)?.proxies, ["DIRECT"]);
        assert.deepEqual(group(result, PROXY_GROUPS.FOREIGN)?.proxies, ["落地节点", "DIRECT"]);
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["落地节点", "DIRECT"]);
        assert.equal(group(result, PROXY_GROUPS.LANDING)?.hidden, true);
        assert.equal(group(result, PROXY_GROUPS.FRONT_PROXY)?.hidden, true);
    });

    it("regex 展平时国外和 AI 排除落地、Tailscale 节点", () => {
        const result = run(
            { regex: "true" },
            {
                proxies: [
                    { name: "香港01" },
                    { name: "落地A", "dialer-proxy": "前置代理" },
                    { name: "Tailscale出口", type: "tailscale" },
                ],
            }
        );
        for (const name of [PROXY_GROUPS.FOREIGN, PROXY_GROUPS.AI]) {
            assert.equal(group(result, name)?.["include-all"], true);
            assert.equal(group(result, name)?.["exclude-filter"], "^(?:落地A|Tailscale出口)$");
        }
        assert.deepEqual(group(result, PROXY_GROUPS.FRONT_PROXY)?.proxies, ["DIRECT", "香港01"]);
        assert.deepEqual(group(result, PROXY_GROUPS.TAILSCALE)?.proxies, ["Tailscale出口"]);
        assert.equal(group(result, PROXY_GROUPS.TAILSCALE)?.hidden, true);
    });

    it("分组模式的手动、地区和低倍率组排除 Tailscale", () => {
        for (const regex of ["true", "false"]) {
            const result = run(
                { regex },
                {
                    proxies: [
                        ...(CONFIG.proxies ?? []),
                        { name: "美国-Tailscale 低倍率", type: "tailscale" },
                    ],
                }
            );
            const manual = group(result, PROXY_GROUPS.MANUAL);
            for (const name of [PROXY_GROUPS.FOREIGN, PROXY_GROUPS.AI]) {
                const policy = group(result, name);
                if (regex === "true") {
                    assert.equal(policy?.["include-all"], true);
                    assert.equal(policy?.["exclude-filter"], "^(?:美国-Tailscale 低倍率)$");
                } else {
                    assert.ok(policy?.proxies?.includes("香港01"));
                    assert.ok(policy?.proxies?.includes("美国01"));
                    assert.ok(!policy?.proxies?.includes("美国-Tailscale 低倍率"));
                }
            }
            if (regex === "true") {
                assert.equal(manual?.["include-all"], true);
                assert.equal(manual?.["exclude-filter"], "^(?:美国-Tailscale 低倍率)$");
                assert.equal(
                    group(result, "美国节点")?.["exclude-filter"],
                    "美属|亚美尼亚|圣多美|普林西比|^(?:美国-Tailscale 低倍率)$"
                );
                assert.equal(
                    group(result, PROXY_GROUPS.LOW_COST)?.["exclude-filter"],
                    "^(?:美国-Tailscale 低倍率)$"
                );
            } else {
                assert.deepEqual(
                    manual?.proxies,
                    CONFIG.proxies?.map((item) => item.name)
                );
            }
        }
    });

    it("展平模式下 Tailscale 不进入普通节点候选", () => {
        const result = run(
            {},
            { proxies: [{ name: "香港01" }, { name: "Tailscale出口", type: "tailscale" }] }
        );
        assert.deepEqual(group(result, PROXY_GROUPS.FOREIGN)?.proxies, ["香港01", "DIRECT"]);
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["香港01", "DIRECT"]);
    });

    it("只剩一个达标地区时 AI 不引用未生成的地区组", () => {
        const result = run({}, { proxies: [{ name: "台湾01" }, { name: "台湾02" }] });
        assert.equal(group(result, "台湾节点"), undefined);
        assert.deepEqual(group(result, PROXY_GROUPS.AI)?.proxies, ["台湾01", "台湾02", "DIRECT"]);
    });

    it("保留 Geo 数据源与广告来源选项，广告直接 REJECT", () => {
        for (const adblock of ["1", "2", "3"]) {
            const result = run({ adblock }, CONFIG);
            const provider = result["rule-providers"]?.ADBlock;
            assert.equal(provider?.type, "http");
            if (provider?.type !== "http") throw new Error("缺少广告规则源");
            if (adblock === "1")
                assert.equal(provider.url, "https://adrules.top/adrules-mihomo.mrs");
            if (adblock === "2") assert.equal(provider, ruleSets.ADBlock);
            if (adblock === "3") assert.match(provider.url, /AWAvenue-Ads-Rule/);
            assert.ok(result["rules"]?.includes("RULE-SET,ADBlock,REJECT"));
            assert.equal(result["geodata-mode"], true);
            assert.ok(result["geox-url"]?.geoip);
        }
    });

    it("所有节点候选与规则出口均存在，引用的策略组没有循环", () => {
        for (const regex of ["true", "false"]) {
            const result = run(
                { regex },
                {
                    proxies: [
                        ...(CONFIG.proxies ?? []),
                        { name: "落地A", "dialer-proxy": "前置代理" },
                        { name: "Tailscale出口", type: "tailscale" },
                    ],
                }
            );
            const groups = new Map(result["proxy-groups"]?.map((item) => [item.name, item]));
            const names = new Set([
                ...groups.keys(),
                ...(result.proxies ?? []).map((item) => item.name),
                "DIRECT",
                "REJECT",
            ]);
            for (const item of groups.values()) {
                for (const candidate of item.proxies ?? [])
                    assert.ok(names.has(candidate), candidate);
            }
            for (const rule of result.rules ?? []) {
                const parts = rule.split(",");
                const target = parts.at(-1) === "no-resolve" ? parts.at(-2) : parts.at(-1);
                assert.ok(target && names.has(target), rule);
            }
            function visit(name: string, path: string[]): void {
                assert.ok(!path.includes(name), [...path, name].join(" → "));
                for (const candidate of groups.get(name)?.proxies ?? []) {
                    if (groups.has(candidate)) visit(candidate, [...path, name]);
                }
            }
            for (const name of groups.keys()) visit(name, []);
        }
    });
});
