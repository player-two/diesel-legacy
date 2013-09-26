module.define('templater', function(){

    var directives = module.import('directives'),
        model = module.import('model'),
        parser = module.import('parser'),

        /*
        private storage for the templating engine is structured as follows:

        for each model property used by the template,
            an object literal is added to watches{} that stores the value of the property in shadow
            and an array of the node indices where that property is used

        for each node that contains a template expression,
            an object literal is added to bindings[] that stores a reference to the node
            and the node's original text value (before being parsed)
        */
           
        root = {
            watches:{},
            bindings:[],
        },
        view = {
            watches:{},
            bindings:[],
        },



    updateNode = function(nodeIndex, scope) {
        scope.bindings[nodeIndex].node.nodeValue = parser.parse(scope.bindings[nodeIndex].nodeVal);
    },
    
    extractExpressions = function(string) {
        var matches = string.match(/{{\s?[\w\.]+\s?}}/g);
        if(matches){
            for(var i = 0; i < matches.length; i++) {
                matches[i] = matches[i].match(/[\w\.]+/)[0];
            };
            return matches;
        }else{
            return false;
        };
    },
    
    registerBinding = function(property, nodeIndex, scope) {
        var value = model.read(property);
        if(typeof value === 'undefined') {
            value = '';
            model.write(property, value);
        };
        if(typeof scope.watches[property] === 'undefined') {
            scope.watches[property] = {
                nodes:[],
                shadow:value
            };
        };
        scope.watches[property].nodes.push(nodeIndex);
    },
    
    checkAndBindNode = function(node, scope) {
        var nodeVal = node.nodeValue;
        var expressions = extractExpressions(nodeVal);
        if(expressions) {
            var nodeIndex = scope.bindings.length;
            for(var i = 0, ilen = expressions.length; i < ilen; i++) {
                registerBinding(expressions[i], nodeIndex, scope);
            };
            scope.bindings[nodeIndex] = {
                'node':node,
                'nodeVal':nodeVal
            };
            updateNode(nodeIndex, scope);
        };
    },
    
    searchChildren = function(container, scope) {
        var nodeList = container.childNodes;
        for(var i = 0; i < nodeList.length; i++) {
            var type = nodeList[i].nodeType;
            if(type === 1) {    // node is an element node
                var attrs = nodeList[i].attributes;
                for(var j = 0; j < attrs.length; j++) {
                    checkAndBindNode(attrs.item(j), scope);
                };
                searchChildren(nodeList[i], scope);
            }else if(type === 3) {      // node is a text node
                checkAndBindNode(nodeList[i], scope);
            };
        };
    },

    printList = function(description, template) {
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
    
    updateList = function(nodeIndex, scope) {
        var listInfo = scope.bindings[nodeIndex],
            description = listInfo.description,
            fragment = printList(description, listInfo.template),
            placeholder = listInfo.placeholder,
            listElement = placeholder.previousSibling;

        listElement.parentNode.removeChild(listElement);
        if(fragment.childNodes.length > 0) {
            directives.bind(fragment);
            placeholder.parentNode.insertBefore(fragment, placeholder);
        };
    },
    
    registerLists = function(container, scope) {
        var nodeList = container.querySelectorAll('[data-list]');
        for(var i = 0; i < nodeList.length; i++) {
            var description = nodeList[i].getAttribute('data-list');
            var modelProperty = description.split(' in ')[1];
            if(typeof scope.watches[modelProperty] === 'undefined') {
                scope.watches[modelProperty] = {
                    nodes:[],
                    shadow:description
                };
            };
            if(typeof model.read(modelProperty) === 'undefined') {
                model.write(modelProperty, []);
            };
            var nodeIndex = scope.bindings.length;
            scope.watches[modelProperty].nodes.push(nodeIndex);
            nodeList[i].insertAdjacentHTML('beforebegin', '<div style="display:none;">'+description+'</div>');
            // '<!-- ' + description + ' -->'
            scope.bindings[nodeIndex] = {
                template:nodeList[i].outerHTML,
                placeholder:nodeList[i].previousSibling,
                description:description
            };
            nodeList[i].parentNode.removeChild(nodeList[i]);
            updateList(nodeIndex, scope);
        };
    };

    // check for changes in the model every 200 milliseconds and update the current views if necessary
    var findChanges = setInterval(function() {
        var scopes = [root, view];
        var updatedNodes = [];
        for(var i = 0, ilen = scopes.length; i < ilen; i++) {
            var scope = scopes[i];
            for(var property in scope.watches) {
                var currentValue = model.read(property);
                if(currentValue !== scope.watches[property].shadow) {
                    console.log(property, scope);
                    scope.watches[property].shadow = currentValue;
                    var nodeNumbers = scope.watches[property].nodes;
                    for(var j = 0, jlen = nodeNumbers.length; j < jlen; j++) {
                        var nodeNumber = nodeNumbers[j];
                        if(typeof updatedNodes[nodeNumber] === 'undefined') {
                            updatedNodes[nodeNumber] = true;
                            if('node' in scope.bindings[nodeNumber]) {
                                updateNode(nodeNumber, scope);
                            }else{
                                updateList(nodeNumber, scope);
                            };
                        };
                    };
                };
            };
        };
    }, 2500);

    return {
        initialize:function(container) {
            // clear all watches and bindings
            reset();
            var scope = container.hasAttribute('data-view') ? view : root;
            // expand all list directives
            registerLists(container, scope);
            // parse the template
            searchChildren(container, scope);
        }
    };

});

