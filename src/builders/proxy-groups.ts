/** 四个可见分流策略直接引用原始节点；内核入口及必要路由组隐藏。 */

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
    // 内核会自动补建 GLOBAL；显式设置 hidden，避免客户端追加到可见策略中。
    groups.push(
        selectGroup(
            PROXY_GROUPS.GLOBAL,
            ICONS.select,
            groups.map((group) => group.name),
            true
        )
    );
    return groups;
}
