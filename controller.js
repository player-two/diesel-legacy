module.define('controller', function() {

    var model = module.import('model'),
        
        controller, name,
        registry = {},
        services = {},

    getArgs = function(constructor) {
        var argString = constructor.toString().match(/\(.*\)/)[0].slice(1, -1);
        if(argString === ''){
            return [];
        }else{
            var argArray = argString.split(',');
            for(var i = 0, ilen = argArray.length; i < ilen; i++) {
                argArray[i] = argArray[i].trim()
            };
            return argArray;
        };
    },
    
    createObject = function(constructor) {
        var argArray = getArgs(constructor);
        for(var i = 0, ilen = argArray.length; i < ilen; i++) {
            if(argArray[i] === 'model') {
                argArray[i] = model;
            }else{
                argArray[i] = services[argArray[i]];
            };
        };
        var newObj = {};
        constructor.apply(newObj, argArray);
        return newObj;
    },

    build = function(url) {
        if(url in registry && name !== registry[url].name) {
            name = registry[url].name;
            controller = createObject(registry[url].constructor);
        };
    };

    mediator.listen('controllerAction', function(fn, args) {
        controller[fn].apply(controller, args);
    });

    return {
        build:build,
        createService:function(name, constructor) {
            services[name] = createObject(constructor);
        },
        register:function(name, routes, constructor) {
            for(var i = 0, ilen = routes.length; i < ilen; i++) {
                registry[routes[i]] = {
                    constructor:constructor,
                    name:name
                };
            };
        }
    };

});

