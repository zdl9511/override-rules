/** 可见策略按此顺序输出，国外与 AI 共用订阅原始节点候选。 */

import { PROXY_GROUPS } from "./group-names";
import { ICONS } from "./icons";
import type { GroupBuildContext, ProxyGroupCandidate } from "../types/proxy";

interface ServiceGroupDef {
    name: string;
    icon: string;
    proxies: (ctx: GroupBuildContext) => ProxyGroupCandidate[];
}

export const serviceGroups: ServiceGroupDef[] = [
    {
        name: PROXY_GROUPS.DIRECT,
        icon: ICONS.direct,
        proxies: () => ["DIRECT"],
    },
    {
        name: PROXY_GROUPS.CUSTOM_DIRECT,
        icon: ICONS.direct,
        proxies: () => [PROXY_GROUPS.DIRECT, PROXY_GROUPS.FOREIGN],
    },
    {
        name: PROXY_GROUPS.FOREIGN,
        icon: ICONS.select,
        proxies: (ctx) => ctx.lists.proxySelector,
    },
    {
        name: PROXY_GROUPS.AI,
        icon: ICONS.aiService,
        proxies: (ctx) => ctx.lists.proxySelector,
    },
];
