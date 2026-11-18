/** Rule Provider 注册表；规则引用的名称受 RuleSetKey 约束。 */

import { CUSTOM_DIRECT_RULES } from "./custom-direct";
import { CDN_URL } from "./endpoints";
import type { RuleProvider } from "../types/clash";

export const ruleSets = {
    CustomDirect: {
        type: "inline",
        behavior: "classical",
        payload: CUSTOM_DIRECT_RULES,
    },
    ADBlock: {
        type: "http",
        behavior: "domain",
        format: "yaml",
        interval: 86400,
        url: `${CDN_URL}/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.yaml`,
        path: "./ruleset/ADBlock.yaml",
    },
    AdditionalFilter: {
        type: "http",
        behavior: "classical",
        format: "text",
        interval: 86400,
        url: `${CDN_URL}/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list`,
        path: "./ruleset/AdditionalFilter.list",
    },
} satisfies Record<string, RuleProvider>;

/** 1=adrules.top，3=AWAvenue；2 使用 ruleSets.ADBlock。 */
export const adblockAlternatives = {
    1: {
        type: "http",
        behavior: "domain",
        format: "mrs",
        interval: 86400,
        url: "https://adrules.top/adrules-mihomo.mrs",
        path: "./ruleset/ADBlock.mrs",
    },
    3: {
        type: "http",
        behavior: "domain",
        format: "mrs",
        interval: 86400,
        url: `${CDN_URL}/gh/TG-Twilight/AWAvenue-Ads-Rule@main/Filters/AWAvenue-Ads-Rule-Clash.mrs`,
        path: "./ruleset/ADBlock.mrs",
    },
} satisfies Record<1 | 3, RuleProvider>;

export type RuleSetKey = keyof typeof ruleSets;

/** noResolve 避免仅为判断 IP 清单而提前解析域名。 */
export function ruleSet(key: RuleSetKey, target: string, noResolve = false): string {
    return `RULE-SET,${key},${target}${noResolve ? ",no-resolve" : ""}`;
}
