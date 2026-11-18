import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRules } from "../../src/builders/rules";
import { CUSTOM_DIRECT_RULES } from "../../src/catalog/custom-direct";
import { ruleSets } from "../../src/catalog/rule-sets";

describe("buildRules", () => {
    it("自定义直连优先于 QUIC、广告、AI 和国内分类", () => {
        const rules = buildRules({ quicEnabled: false, hasTailscale: true, adblockSource: 3 });
        assert.equal(rules[0], "RULE-SET,CustomDirect,自定义直连,no-resolve");
        assert.equal(rules[1], "AND,((DST-PORT,443),(NETWORK,UDP)),REJECT");
    });

    it("启用 QUIC 时不插入 UDP 443 拦截规则", () => {
        const rules = buildRules({ quicEnabled: true, hasTailscale: false, adblockSource: 0 });
        assert.ok(!rules.some((rule) => rule.startsWith("AND,")));
    });

    it("Tailscale 分流只在存在对应节点时生成", () => {
        for (const hasTailscale of [true, false]) {
            const rules = buildRules({ quicEnabled: true, hasTailscale, adblockSource: 0 });
            const expected = [
                "IP-CIDR,100.64.0.0/10,Tailscale,no-resolve",
                "IP-CIDR,fd7a:115c:a1e0::/48,Tailscale,no-resolve",
                "DOMAIN-SUFFIX,ts.net,Tailscale",
            ];
            for (const rule of expected) assert.equal(rules.includes(rule), hasTailscale);
        }
    });

    it("精简分流按内网、AI、国内域名、国内 IP、国外的顺序匹配", () => {
        assert.deepEqual(buildRules({ quicEnabled: true, hasTailscale: false, adblockSource: 0 }), [
            "RULE-SET,CustomDirect,自定义直连,no-resolve",
            "GEOIP,private,直连,no-resolve",
            "GEOSITE,category-ai-!cn,AI",
            "GEOSITE,cn,直连",
            "GEOIP,cn,直连",
            "MATCH,国外",
        ]);
    });

    it("引用的规则集均已注册，关闭广告时只保留自定义规则集", () => {
        for (const adblockSource of [0, 1, 2, 3] as const) {
            const rules = buildRules({ quicEnabled: true, hasTailscale: false, adblockSource });
            const providerRules = rules.filter((rule) => rule.startsWith("RULE-SET,"));
            for (const rule of providerRules) {
                const key = rule.split(",")[1];
                assert.ok(key in ruleSets, key);
            }
            assert.equal(providerRules.length, adblockSource === 0 ? 1 : 3);
            assert.equal(rules.includes("RULE-SET,ADBlock,REJECT"), adblockSource > 0);
            assert.equal(rules.includes("RULE-SET,AdditionalFilter,REJECT"), adblockSource > 0);
        }
    });
});

describe("自定义直连清单", () => {
    it("包含用户提供的全部去重域名", () => {
        const expected = [
            "423down.com",
            "951199.xyz",
            "admin.pandarobot.chat",
            "chengmo.cc.cd",
            "codexcn.com",
            "elysia.h-e.top",
            "gitee.com",
            "hybgzs.com",
            "lianxininc.com",
            "lydgcloud.com",
            "mpyit.com",
            "new.qqwang.net",
            "new.sharedchat.cc",
            "oracle.com",
            "pi.dev",
            "quanshengscm.com",
            "workflow.lydgcloud.com",
        ];
        assert.deepEqual(
            CUSTOM_DIRECT_RULES.filter((rule) => rule.startsWith("DOMAIN-SUFFIX,")),
            expected.map((domain) => `DOMAIN-SUFFIX,${domain}`)
        );
        assert.equal(new Set(CUSTOM_DIRECT_RULES).size, CUSTOM_DIRECT_RULES.length);
    });

    it("保留六个指定 IP，并将单个 IPv4 写为 /32", () => {
        assert.deepEqual(
            CUSTOM_DIRECT_RULES.filter((rule) => rule.startsWith("IP-CIDR,")),
            [
                "IP-CIDR,112.233.242.97/32",
                "IP-CIDR,116.204.85.57/32",
                "IP-CIDR,120.46.144.218/32",
                "IP-CIDR,161.118.206.171/32",
                "IP-CIDR,172.16.0.2/32",
                "IP-CIDR,43.108.58.112/32",
            ]
        );
    });

    it("覆盖 Windows 微信新旧版本主进程", () => {
        assert.ok(CUSTOM_DIRECT_RULES.includes("PROCESS-NAME,Weixin.exe"));
        assert.ok(CUSTOM_DIRECT_RULES.includes("PROCESS-NAME,WeChat.exe"));
    });
});
