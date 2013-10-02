spider.define('model', function() {
    
    var model = {};
    
    model.read = function(string) {
        var obj = model;
        var keys = string.split('.');
        for(var i = 0, ilen = keys.length; i < ilen; i++) {
            if(typeof obj !== 'undefined') {
                obj = obj[keys[i]];
            };
        };
        return obj;
    };

    model.write = function(string, value) {
        var obj = model;
        var keys = string.split('.');
        for(var i = 1, ilen = keys.length; i < ilen; i++) {
            var key = keys.shift();
            if(typeof obj[key] !== 'object') {
                obj[key] = {};
            };
            obj = obj[key];
        };
        obj[keys.shift()] = value;
    };
    
    return model;
    
});

