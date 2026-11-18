/** 代理组的展示名称与地区命名辅助函数。 */

const NODE_SUFFIX = "节点";

export const PROXY_GROUPS = {
    DIRECT: "直连",
    FOREIGN: "国外",
    AI: "AI",
    CUSTOM_DIRECT: "自定义直连",
    MANUAL: "手动选择",
    AUTO: "自动选择",
    FALLBACK: "故障转移",
    LANDING: "落地节点",
    LOW_COST: "低倍率节点",
    FRONT_PROXY: "前置代理",
    TAILSCALE: "Tailscale",
    GLOBAL: "GLOBAL",
} as const;

export function countryGroupName(country: string): string {
    return `${country}${NODE_SUFFIX}`;
}
