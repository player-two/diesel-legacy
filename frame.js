module.define('frame', function() {

    return frame = {

        bindings:[],
        watches:{},

        addBinding:function(node, expression) {
            this.bindings.push({
                node:node
            });
        },

        addWatch:function(type, property, value, firstNode) {
            this.watches[property] = {
                nodes:[firstNode],
                shadow:value,
                type:type
            },
        },

        checkWatches:function() {
            var updatedNodes = [];
            for(var property in this.watches) {
                var currentValue = model.read(property);
                if(currentValue !== this.watches[property].shadow) {
                    this.watches[property].shadow = currentValue;
                    var nodeNumbers = this.watches[property].nodes;
                    for(var j = 0, jlen = nodeNumbers.length; j < jlen; j++) {
                        var nodeNumber = nodeNumbers[j];
                        if(typeof updatedNodes[nodeNumber] === 'undefined') {
                            updatedNodes[nodeNumber] = true;
                            //if('node' in this.bindings[nodeNumber]) {
                            updateNode(nodeNumber, scope);
                        };
                    };
                };
            };
        },

        create:function() {
            var self = Object.create(this);
            // self.prop = val;
            return self;
        },

        reset:function() {
            this.watches = {};
            this.bindings = [];
        };
        
    };

});
