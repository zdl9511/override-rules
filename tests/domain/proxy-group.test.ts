import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectGroup } from "../../src/domain/proxy-group";

describe("selectGroup", () => {
    it("保留字段顺序和节点顺序", () => {
        const group = selectGroup("国外", "icon", ["NodeB", "NodeA"]);
        assert.deepEqual(Object.keys(group), ["name", "icon", "type", "proxies"]);
        assert.deepEqual(group.proxies, ["NodeB", "NodeA"]);
    });

    it("hidden 仅在指定时输出，位于节点来源之前", () => {
        assert.equal(selectGroup("n", "i", ["a"]).hidden, undefined);
        const hidden = selectGroup("n", "i", ["a"], true);
        assert.equal(hidden.hidden, true);
        assert.deepEqual(Object.keys(hidden), ["name", "icon", "type", "hidden", "proxies"]);
    });

    it("空候选补 DIRECT，动态来源保留 include-all 和排除条件", () => {
        assert.deepEqual(selectGroup("n", "i", []).proxies, ["DIRECT"]);
        const dynamic = selectGroup("n", "i", [{ "include-all": true, "exclude-filter": "tail" }]);
        assert.equal(dynamic.proxies, undefined);
        assert.deepEqual(Object.keys(dynamic), [
            "name",
            "icon",
            "type",
            "include-all",
            "exclude-filter",
        ]);
        assert.equal(dynamic["exclude-filter"], "tail");
    });
});
