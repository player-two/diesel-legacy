spider.define('frame', function() {

    var directives = spider.import('directives'),
        model = spider.import('model'),
        parser = spider.import('parser');

    return frame = {

        /*
        private storage for the templating engine is structured as follows:

        for each model property used by the template,
            an object literal is added to watches{} that stores the value of the property in shadow
            and an array of the node indices where that property is used

        for each node that contains a template expression,
            an object literal is added to bindings[] that stores a reference to the node
            and the node's original text value (before being parsed)
        */
           
        lists:[],
        nodes:[],
        watches:{},

        running:false,
        ups:1,

        addList:function(description, item, placeholder) {
            this.lists.push({
                description:description,
                item:item,
                placeholder:placeholder
            });
        },

        addNode:function(node, value) {
            this.nodes.push({
                node:node,
                value:value
            });
        },

        addWatch:function(type, property, nodeIndex) {
            if(!(property in this.watches)) {
                var value = model.read(property);
                if(typeof value === 'undefined') {
                    if(type === 'node') {
                        value = '';
                    }else if(type === 'list') {
                        value = [];
                    };
                    model.write(property, value);
                }else if(type === 'list') {
                    value = JSON.parse(JSON.stringify(value));
                };
                this.watches[property] = {
                    nodes:[],
                    shadow:value,
                    type:type
                };
            };
            this.watches[property].nodes.push(nodeIndex);
        },

        // deep comparison between two variables
        areEqual:function(a, b) {
            if(typeof a !== typeof b) {
                return false;
            };
            // a and b are the same type
            if(typeof a !== 'object') {
                return a === b;
            };
            // a and b are objects or arrays
            if(Array.isArray(a) && Array.isArray(b)) {
                // a and b are arrays
                if(a.length !== b.length) {
                    return false;
                };
                // arrays a and b have the same length
                for(var i = 0, ilen = a.length; i < ilen; i++) {
                    if(!this.areEqual(a[i], b[i])) {
                        return false;
                    };
                };
            }else if(!Array.isArray(a) && !Array.isArray(b)) {
                // a and b are objects
                for(var prop in a) {
                    if(!this.areEqual(a[prop], b[prop])) {
                        return false;
                    };
                };
                for(var prop in b) {
                    if(!this.areEqual(a[prop], b[prop])) {
                        return false;
                    };
                };
            }else{
                return false;
            };
            // a and b are equal!
            return true;
        },

        // iterate through all the properties in the watches array
        //   and update the nodes and lists corresponding to changed properties
        checkWatches:function() {
            var updatedNodes = [];
            for(var property in this.watches) {
                var currentValue = model.read(property);
                if(!this.areEqual(currentValue, this.watches[property].shadow)) {
                    if(this.watches[property].type === 'node') {
                        this.watches[property].shadow = currentValue;
                    }else if(this.watches[property].type === 'list') {
                        this.watches[property].shadow = JSON.parse(JSON.stringify(currentValue));
                    };
                    var nodeNumbers = this.watches[property].nodes;
                    for(var i = 0, ilen = nodeNumbers.length; i < ilen; i++) {
                        var nodeNumber = nodeNumbers[i];
                        if(!updatedNodes.hasOwnProperty(nodeNumber)) {
                            updatedNodes[nodeNumber] = true;
                            if(this.watches[property].type === 'node') {
                                this.updateNode(nodeNumber);
                            }else if(this.watches[property].type === 'list') {
                                this.updateList(nodeNumber);
                            };
                        };
                    };
                };
            };
        },

        create:function(containerElement) {
            var self = Object.create(this);
            self.container = containerElement;
            return self;
        },

        extractProperties:function(string) {
            var matches = string.match(/{{\s?[\w\.]+\s?}}/g);
            if(matches){
                for(var i = 0, ilen = matches.length; i < ilen; i++) {
                    matches[i] = matches[i].match(/[\w\.]+/)[0];
                };
                return matches;
            }else{
                return false;
            };
        },

        printList:function(description, template) {
            var data = description.split(' in ');
            var arr = model.read(data[1]);
            var fragment = document.createDocumentFragment();
            var numItems = arr.length;
            if(numItems > 0) {
                var regex = new RegExp('{{\\s?' + data[0] + '(\\.[\\w\\.]+)\\s?}}', 'g');
                var newHtml = '';
                for(var i = 0; i < numItems; i++) {
                    newHtml += template.replace(regex, function(match, sub){ 
                        return '{{' + data[1] + '.' + i + sub + '}}';
                    });
                };
                var temp = document.createElement('div');
                temp.innerHTML = parser.parse(newHtml);
                for(var i = 0; i < numItems; i++) {
                    fragment.appendChild(temp.childNodes[0]);
                };
            };
            return fragment;
        },
 
        registerLists:function() {
            var nodeList = this.container.querySelectorAll('[data-list]');
            for(var i = 0, ilen = nodeList.length; i < ilen; i++) {
                var description = nodeList[i].getAttribute('data-list'),
                    listIndex = this.lists.length,
                    property = description.split(' in ')[1];
                nodeList[i].insertAdjacentHTML('beforebegin', '<div style="display:none;">'+description+'</div>');
                this.addList(description, nodeList[i].outerHTML, nodeList[i].previousSibling);
                this.addWatch('list', property, listIndex);
                nodeList[i].parentNode.removeChild(nodeList[i]);
                this.updateList(listIndex);
            };
        },

        registerNode:function(node) {
            var nodeVal = node.nodeValue;
            var properties = this.extractProperties(nodeVal);
            if(properties) {
                var nodeIndex = this.nodes.length;
                this.addNode(node, nodeVal);
                for(var i = 0, ilen = properties.length; i < ilen; i++) {
                    this.addWatch('node', properties[i], nodeIndex);
                };
                this.updateNode(nodeIndex);
            };
        },
 
        reset:function() {
            this.watches = {};
            this.lists = [];
            this.nodes = [];
            this.searchForNodes(this.container);
            directives.bind(this.container);
            this.registerLists();
        },

        searchForNodes:function(element) {
            var nodeList = element.childNodes;
            for(var i = 0, ilen = nodeList.length; i < ilen; i++) {
                var type = nodeList[i].nodeType;
                if(type === 1) {
                    // node is an element node
                    var attrs = nodeList[i].attributes;
                    for(var j = 0, jlen = attrs.length; j < jlen; j++) {
                        this.registerNode(attrs.item(j));
                    };
                    if(!nodeList[i].hasAttribute('data-list')) {
                        this.searchForNodes(nodeList[i]);
                    };
                }else if(type === 3) {
                    // node is a text node
                    this.registerNode(nodeList[i]);
                };
            };
        },

        setContent:function(html) {
            this.stop();
            this.container.innerHTML = html;
            this.reset();
            this.start();
        },

        start:function() {
            if(Object.keys(this.watches).length > 0) {
                this.running = setInterval(
                    (function(self) {
                        return function() {
                            self.checkWatches();
                        };
                    }(this)),
                    1000/this.ups
                );
            };
        },

        stop:function() {
            if(this.running) {
                clearInterval(this.running);
                this.running = false;
            };
        },

        updateList:function(nodeIndex) {
            var listInfo = this.lists[nodeIndex],
                description = listInfo.description,
                fragment = this.printList(description, listInfo.item),
                placeholder = listInfo.placeholder,
                prevElement = placeholder.previousSibling;
            while(prevElement.nodeType === 1 && prevElement.hasAttribute('data-list') &&
              prevElement.getAttribute('data-list') === description) {
                prevElement.parentNode.removeChild(prevElement);
                prevElement = placeholder.previousSibling;
            };
            if(fragment.childNodes.length > 0) {
                directives.bind(fragment);
                placeholder.parentNode.insertBefore(fragment, placeholder);
            };
        },
 
        updateNode:function(nodeIndex) {
            this.nodes[nodeIndex].node.nodeValue = parser.parse(this.nodes[nodeIndex].value);
        }
    
    };

});
