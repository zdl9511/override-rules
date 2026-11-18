/**
 * 参数默认值的唯一来源。
 *
 * 若需修改脚本的默认行为（例如默认开启 IPv6），只需调整此处的取值。
 */
export const ARG_DEFAULTS = {
    /** 启用 IPv6 支持。 */
    ipv6Enabled: false,
    /** 输出完整内核配置。 */
    fullConfig: false,
    /** 启用 TCP keep-alive。 */
    keepAliveEnabled: false,
    /** 使用 fake-ip 增强模式。 */
    fakeIPEnabled: true,
    /** 允许 QUIC（UDP 443）流量。 */
    quicEnabled: false,
    /** 使用动态原始节点候选。 */
    regexFilter: false,
    /** 启用 TUN 模式。 */
    tunEnabled: false,
    /** 去广告规则来源：0=关闭，1=adrules.top，2=217heidai，3=AWAvenue。 */
    adblockSource: 3,
} as const;
