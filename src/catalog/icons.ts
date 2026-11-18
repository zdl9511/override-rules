/** 代理组图标的集中定义。 */

import { CDN_URL } from "./endpoints";

const QURE = `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color`;
const SELF = `${CDN_URL}/gh/powerfullz/override-rules@master/icons`;
const STASH = `${CDN_URL}/gh/shindgewongxj/WHATSINStash@master/icon`;

export const ICONS = {
    select: `${QURE}/Proxy.png`,
    direct: `${QURE}/Direct.png`,
    manual: `${STASH}/select.png`,
    frontProxy: `${QURE}/Area.png`,
    landing: `${QURE}/Airport.png`,
    aiService: `${QURE}/ChatGPT.png`,
    tailscale: `${SELF}/Tailscale.png`,
    auto: `${QURE}/Auto.png`,
    fallback: `${QURE}/Available_1.png`,
    lowCost: `${QURE}/Lab.png`,
    global: `${QURE}/Global.png`,
} as const;
