/**
 * 正则匹配相关的工具函数。
 */

import type { ProxyNode } from "../types/proxy";

/** 正则表达式中需要转义的元字符。 */
const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** 转义节点名称中的正则元字符，使其只按字面量匹配。 */
function escapeRegExp(value: string): string {
    return value.replace(REGEXP_SPECIAL_CHARS, "\\$&");
}

/**
 * 构造 `exclude-filter`，从 `include-all` 的动态节点中排除指定的节点名称。
 * 使用完整的锚定分组，避免节点名中的特殊字符导致误匹配。
 * @returns 无有效节点名时返回 `undefined`，表示无需排除。
 */
export function buildNodeExcludeFilter(nodes: ProxyNode[]): string | undefined {
    const names = [...new Set(nodes.map((node) => node.name).filter(Boolean))];
    if (names.length === 0) return undefined;

    return `^(?:${names.map(escapeRegExp).join("|")})$`;
}
