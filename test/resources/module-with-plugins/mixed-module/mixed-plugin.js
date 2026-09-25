module.exports = function(RED) {
    RED.plugins.registerPlugin("mixed-test-plugin", {
        type: "mixed-test-plugin-type",
        onadd: function() {}
    })
}
