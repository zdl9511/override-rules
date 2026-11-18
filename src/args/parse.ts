/**
 * URL 参数解析：将原始字符串参数转换为类型安全的 `FeatureFlags`。
 */

import { parseBool, parseNumber } from "../utils/primitives";
import { ARG_DEFAULTS } from "./schema";
import type { AdblockSource, FeatureFlags, ScriptArgs } from "../types/args";

/**
 * 解析 `adblock` 参数。
 * - `0`：关闭去广告规则
 * - `1`：adrules.top
 * - `2`：217heidai
 * - `3`：AWAvenue（默认）
 * - 非法值回退为默认值。
 */
function parseAdblockSource(args: ScriptArgs): AdblockSource {
    const raw = parseNumber(args.adblock, ARG_DEFAULTS.adblockSource);
    return raw === 0 || raw === 1 || raw === 2 || raw === 3 ? raw : ARG_DEFAULTS.adblockSource;
}

/**
 * 解析传入的脚本参数，并转换为内部使用的功能开关。
 * @param args - 从脚本环境（如 Substore）传入的原始参数对象
 */
export function buildFeatureFlags(args: ScriptArgs): FeatureFlags {
    return {
        ipv6Enabled: parseBool(args.ipv6, ARG_DEFAULTS.ipv6Enabled),
        fullConfig: parseBool(args.full, ARG_DEFAULTS.fullConfig),
        keepAliveEnabled: parseBool(args.keepalive, ARG_DEFAULTS.keepAliveEnabled),
        fakeIPEnabled: parseBool(args.fakeip, ARG_DEFAULTS.fakeIPEnabled),
        quicEnabled: parseBool(args.quic, ARG_DEFAULTS.quicEnabled),
        regexFilter: parseBool(args.regex, ARG_DEFAULTS.regexFilter),
        tunEnabled: parseBool(args.tun, ARG_DEFAULTS.tunEnabled),
        adblockSource: parseAdblockSource(args),
    };
}
