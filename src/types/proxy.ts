/** 代理节点、策略组与节点候选相关的类型定义。 */

/** 除 name 外的上游节点字段原样透传。 */
export interface ProxyNode {
    name: string;
    type?: string;
    server?: string;
    port?: number;
    [key: string]: unknown;
}

export interface ProxyGroup {
    name: string;
    icon?: string;
    type: "select";
    proxies?: string[];
    "include-all"?: boolean;
    "exclude-filter"?: string;
    hidden?: boolean;
}

export type ProxyGroupNodeSource = Pick<ProxyGroup, "proxies" | "include-all" | "exclude-filter">;
export type ProxyGroupCandidate = string | ProxyGroupNodeSource;

export interface BaseLists {
    proxySelector: ProxyGroupCandidate[];
    frontProxySelector: string[];
}

export interface NodeAnalysis {
    /** 普通出口，包括落地节点，保留订阅原始顺序。 */
    proxyNodes: ProxyNode[];
    /** 可作为链式代理前置的节点，排除落地和 Tailscale。 */
    frontProxyNodes: ProxyNode[];
    hasFrontProxy: boolean;
    tailscaleNodes: ProxyNode[];
    hasTailscale: boolean;
}

export interface GroupBuildContext {
    nodes: NodeAnalysis;
    lists: BaseLists;
}
