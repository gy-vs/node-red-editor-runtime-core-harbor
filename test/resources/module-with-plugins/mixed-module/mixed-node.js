module.exports = function(RED) {
    function MixedNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("mixed-test-node", MixedNode);
}
