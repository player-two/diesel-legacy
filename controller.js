spider.define('controller', function() {

    var model = spider.import('model'),
        
        controller, name,
        registry = {},
        services = {},

    build = function(url) {
        if(url in registry && name !== registry[url].name) {
            name = registry[url].name;
            controller = createObject(registry[url].constructor);
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
    };
    
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

