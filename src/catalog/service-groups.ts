/** 四个面向用户的分流策略；节点选择辅助组由构建层隐藏。 */

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
        name: PROXY_GROUPS.FOREIGN,
        icon: ICONS.select,
        proxies: (ctx) => ctx.lists.defaultSelector,
    },
    {
        name: PROXY_GROUPS.AI,
        icon: ICONS.aiService,
        proxies: (ctx) => ctx.lists.defaultProxies,
    },
    {
        name: PROXY_GROUPS.CUSTOM_DIRECT,
        icon: ICONS.direct,
        proxies: () => [PROXY_GROUPS.DIRECT, PROXY_GROUPS.FOREIGN],
    },
];
