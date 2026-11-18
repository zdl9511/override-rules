/** 代理组图标的集中定义。 */

import { CDN_URL } from "./endpoints";

const QURE = `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color`;
const SELF = `${CDN_URL}/gh/powerfullz/override-rules@master/icons`;

export const ICONS = {
    select: `${QURE}/Proxy.png`,
    direct: `${QURE}/Direct.png`,
    frontProxy: `${QURE}/Area.png`,
    aiService: `${QURE}/ChatGPT.png`,
    tailscale: `${SELF}/Tailscale.png`,
} as const;
