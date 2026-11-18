/**
 * 脚本参数与功能开关相关的类型定义。
 */

/** Substore/Clash 覆写脚本从 URL hash 接收的原始字符串参数。 */
export interface ScriptArgs {
    ipv6?: string;
    full?: string;
    keepalive?: string;
    fakeip?: string;
    quic?: string;
    regex?: string;
    tun?: string;
    adblock?: string;
}

/** 去广告规则来源：0=关闭，1=adrules.top，2=217heidai，3=AWAvenue。 */
export type AdblockSource = 0 | 1 | 2 | 3;

/** 解析后的功能开关集合，下游模块无需再关心参数来源或缺失情况。 */
export interface FeatureFlags {
    ipv6Enabled: boolean;
    fullConfig: boolean;
    keepAliveEnabled: boolean;
    fakeIPEnabled: boolean;
    quicEnabled: boolean;
    regexFilter: boolean;
    tunEnabled: boolean;
    adblockSource: AdblockSource;
}
