/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var path = require("path");

var NR_TEST_UTILS = require("nr-test-utils");

var registry = NR_TEST_UTILS.require("@node-red/registry/lib/registry");
var registryPlugins = NR_TEST_UTILS.require("@node-red/registry/lib/plugins");
var loader = NR_TEST_UTILS.require("@node-red/registry/lib/loader");
var localfilesystem = NR_TEST_UTILS.require("@node-red/registry/lib/localfilesystem");
var registryApi = NR_TEST_UTILS.require("@node-red/registry");
var runtimeUtil = NR_TEST_UTILS.require("@node-red/util");

var resourcesBaseDir = path.resolve(path.join(__dirname,"..","..","..","..","..",
    "test","resources","module-with-plugins"));
var resourcesDir = path.join(resourcesBaseDir,"mixed-module");

describe("red/nodes/registry - module providing both nodes and plugins", function() {
    var settings;
    before(function() {
        settings = {
            available: function() { return false; },
            get: function() { return undefined; },
            set: function() {},
            version: runtimeUtil.version && runtimeUtil.version.version || "4.0.9",
            nodesDir: [ resourcesDir ]
        };
        var log = {
            info: function() {}, warn: function() {}, error: function() {},
            debug: function() {}, trace: function() {}, _: function(s) { return s; }
        };
        var runtime = {
            settings: settings,
            log: log,
            version: settings.version,
            nodes: registryApi,
            plugins: registryPlugins,
            events: runtimeUtil.events,
            util: runtimeUtil,
            hooks: { trigger: function() { return Promise.resolve(true); } },
            library: { addExamplesDir: function() {}, register: function() {} }
        };
        registryPlugins.init(settings);
        registry.init(settings, loader);
        loader.init(runtime);
        localfilesystem.init(settings);
    });

    it("loads the mixed module from disk", function() {
        this.timeout(20000);
        return loader.load();
    });

    it("exposes the node via getNodeList (/nodes)", function() {
        var nodeList = registry.getNodeList();
        var nodeSet = nodeList.find(function(n) { return n.id === "mixed-module/mixed-node"; });
        should.exist(nodeSet);
        nodeSet.types.should.containEql("mixed-test-node");
        nodeSet.module.should.eql("mixed-module");
    });

    it("exposes the plugin via getPluginList (/plugins)", function() {
        var pluginList = registryPlugins.getPluginList();
        var pluginSet = pluginList.find(function(p) { return p.id === "mixed-module/mixed-plugin"; });
        should.exist(pluginSet);
        pluginSet.plugins.should.have.a.lengthOf(1);
        pluginSet.plugins[0].id.should.eql("mixed-test-plugin");
        pluginSet.module.should.eql("mixed-module");
    });

    it("returns both sets from getModuleInfo for the same module", function() {
        var info = registry.getModuleInfo("mixed-module");
        should.exist(info);
        info.should.have.a.property("nodes");
        info.should.have.a.property("plugins");
        info.nodes.should.have.a.lengthOf(1);
        info.plugins.should.have.a.lengthOf(1);
        info.nodes[0].id.should.eql("mixed-module/mixed-node");
        info.plugins[0].id.should.eql("mixed-module/mixed-plugin");
        info.version.should.eql("1.0.0");
    });

    it("keeps the two admin API views consistent for the module", function() {
        // The module reported by /nodes and /plugins must refer to the same
        // installed module and getModuleInfo must contain both sets.
        var nodeList = registry.getNodeList();
        var pluginList = registryPlugins.getPluginList();
        var nodeSet = nodeList.find(function(n) { return n.module === "mixed-module"; });
        var pluginSet = pluginList.find(function(p) { return p.module === "mixed-module"; });
        should.exist(nodeSet);
        should.exist(pluginSet);
        var info = registry.getModuleInfo("mixed-module");
        info.nodes.map(function(n){return n.id;}).should.containEql(nodeSet.id);
        info.plugins.map(function(p){return p.id;}).should.containEql(pluginSet.id);
    });
});
