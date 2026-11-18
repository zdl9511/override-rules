/** 四个分流策略直接引用原始节点；仅按需保留链式代理和 Tailscale 路由组。 */

import { PROXY_GROUPS } from "../catalog/group-names";
import { ICONS } from "../catalog/icons";
import { serviceGroups } from "../catalog/service-groups";
import { selectGroup } from "../domain/proxy-group";
import type { GroupBuildContext, ProxyGroup } from "../types/proxy";

export function buildProxyGroups(ctx: GroupBuildContext): ProxyGroup[] {
    const groups = serviceGroups.map((def) => selectGroup(def.name, def.icon, def.proxies(ctx)));

    if (ctx.nodes.hasFrontProxy) {
        groups.push(
            selectGroup(
                PROXY_GROUPS.FRONT_PROXY,
                ICONS.frontProxy,
                ctx.lists.frontProxySelector,
                true
            )
        );
    }
    if (ctx.nodes.hasTailscale) {
        groups.push(
            selectGroup(
                PROXY_GROUPS.TAILSCALE,
                ICONS.tailscale,
                ctx.nodes.tailscaleNodes.map((node) => node.name),
                true
            )
        );
    }
    return groups;
}
