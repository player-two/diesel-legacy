module.define('directives', function(){

    var model = module.import('model'),
    
    actions = {
    
        nav:function(attr) {
            mediator.emit('navigate', attr);
        },
        
        model:function(attr) {
            var value;
            if(event.target.getAttribute('type') === 'checkbox') {
                value = 'checked';
            }else{
                value = 'value';
            };
            model.write(attr, event.target[value]);
        },
        
        click:function(attr) {
            var char = attr.indexOf('('),
                fn = attr.slice(0, char),
                argString = attr.slice(char + 1, -1),
                args = argString.split(',');

            for(i = 0; i < args.length; i++) {
                args[i] = args[i].trim();
            };
            mediator.emit('controllerAction', fn, args);
        }

    };
    
    return {
        
        bind:function(container) {
            for(var directive in actions) {
                var nodeList = container.querySelectorAll('[data-' + directive + ']');
                for(var i = 0; i < nodeList.length; i++) {
                    var eventType;
                    if(directive === 'model') {
                        // initailize the value of the node
                        var property = nodeList[i].getAttribute('data-' + directive),
                            value = model.read(property);
                        if(typeof value !== 'undefined') {
                            nodeList[i].value = value;
                        };
                        // determine the right event type
                        if(nodeList[i].getAttribute('type') === 'checkbox') {
                            eventType = 'click';
                        }else if(nodeList[i].tagName.toLowerCase() === 'select') {
                            eventType = 'change';
                        }else{
                            eventType = 'input';
                        };
                    }else{
                        eventType = 'click';
                    };
                    (function(directive, eventType) {
                        nodeList[i].addEventListener(eventType, function(event) {
                            // do i need to pass event?
                            actions[directive](event.target.getAttribute('data-' + directive));
                        }, false);
                    }(directive, eventType));
                };
            };
        }

    };
    
});

