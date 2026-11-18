/** 选择策略组工厂：字段顺序与空候选补 DIRECT 集中管理。 */

import type { ProxyGroup, ProxyGroupCandidate, ProxyGroupNodeSource } from "../types/proxy";

function normalizeNodeSource(candidates: ProxyGroupCandidate[]): ProxyGroupNodeSource {
    const proxies: string[] = [];
    const source: ProxyGroupNodeSource = {};
    for (const candidate of candidates) {
        if (typeof candidate === "string") {
            proxies.push(candidate);
            continue;
        }
        if (candidate.proxies) proxies.push(...candidate.proxies);
        if (candidate["include-all"]) source["include-all"] = true;
        if (candidate["exclude-filter"] !== undefined) {
            source["exclude-filter"] = candidate["exclude-filter"];
        }
    }
    if (proxies.length > 0) source.proxies = proxies;
    if (source["include-all"] || proxies.length > 0) return source;
    return { ...source, proxies: ["DIRECT"] };
}

export function selectGroup(
    name: string,
    icon: string,
    candidates: ProxyGroupCandidate[],
    hidden = false
): ProxyGroup {
    return {
        name,
        icon,
        type: "select",
        ...(hidden ? { hidden: true } : {}),
        ...normalizeNodeSource(candidates),
    };
}
