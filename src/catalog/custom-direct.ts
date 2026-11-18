/**
 * 自定义直连清单：每行只填写匹配条件，出口统一由「自定义直连」策略控制。
 * DOMAIN-SUFFIX 包含该域名及子域名；单个 IPv4 使用 /32，IPv6 使用 IP-CIDR6。
 * 修改后运行 npm run artifacts，并将生成的覆写重新载入客户端。
 */
export const CUSTOM_DIRECT_RULES: readonly string[] = [
    // 域名
    "DOMAIN-SUFFIX,423down.com",
    "DOMAIN-SUFFIX,951199.xyz",
    "DOMAIN-SUFFIX,admin.pandarobot.chat",
    "DOMAIN-SUFFIX,chengmo.cc.cd",
    "DOMAIN-SUFFIX,codexcn.com",
    "DOMAIN-SUFFIX,elysia.h-e.top",
    "DOMAIN-SUFFIX,gitee.com",
    "DOMAIN-SUFFIX,hybgzs.com",
    "DOMAIN-SUFFIX,lianxininc.com",
    "DOMAIN-SUFFIX,lydgcloud.com",
    "DOMAIN-SUFFIX,mpyit.com",
    "DOMAIN-SUFFIX,new.qqwang.net",
    "DOMAIN-SUFFIX,new.sharedchat.cc",
    "DOMAIN-SUFFIX,oracle.com",
    "DOMAIN-SUFFIX,pi.dev",
    "DOMAIN-SUFFIX,quanshengscm.com",
    "DOMAIN-SUFFIX,workflow.lydgcloud.com",

    // IP 或网段
    "IP-CIDR,112.233.242.97/32",
    "IP-CIDR,116.204.85.57/32",
    "IP-CIDR,120.46.144.218/32",
    "IP-CIDR,161.118.206.171/32",
    "IP-CIDR,172.16.0.2/32",
    "IP-CIDR,43.108.58.112/32",

    // Windows 微信新旧版本的主进程
    "PROCESS-NAME,WeChat.exe",
    "PROCESS-NAME,Weixin.exe",
];
