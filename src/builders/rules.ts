/** 自定义直连优先，其后按内网、AI、国内、其余流量分流。 */

import { PROXY_GROUPS } from "../catalog/group-names";
import { ruleSet } from "../catalog/rule-sets";
import { isNotNull } from "../utils/primitives";
import type { AdblockSource } from "../types/args";

interface BuildRulesInput {
    quicEnabled: boolean;
    hasTailscale: boolean;
    adblockSource: AdblockSource;
}

export function buildRules({
    quicEnabled,
    hasTailscale,
    adblockSource,
}: BuildRulesInput): string[] {
    return [
        // 用户指定的直连条件优先于通用限制和分类，包括微信的 UDP 流量。
        ruleSet("CustomDirect", PROXY_GROUPS.CUSTOM_DIRECT, true),
        !quicEnabled ? "AND,((DST-PORT,443),(NETWORK,UDP)),REJECT" : null,
        hasTailscale ? `IP-CIDR,100.64.0.0/10,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
        hasTailscale ? `IP-CIDR,fd7a:115c:a1e0::/48,${PROXY_GROUPS.TAILSCALE},no-resolve` : null,
        hasTailscale ? `DOMAIN-SUFFIX,ts.net,${PROXY_GROUPS.TAILSCALE}` : null,
        `GEOIP,private,${PROXY_GROUPS.DIRECT},no-resolve`,
        adblockSource > 0 ? ruleSet("ADBlock", "REJECT") : null,
        adblockSource > 0 ? ruleSet("AdditionalFilter", "REJECT") : null,
        `GEOSITE,category-ai-!cn,${PROXY_GROUPS.AI}`,
        `GEOSITE,cn,${PROXY_GROUPS.DIRECT}`,
        `GEOIP,cn,${PROXY_GROUPS.DIRECT}`,
        `MATCH,${PROXY_GROUPS.FOREIGN}`,
    ].filter(isNotNull);
}
