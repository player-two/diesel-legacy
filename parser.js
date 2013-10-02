spider.define('parser', function(model){

    var model = spider.import('model'),
    
    parse = function(templateString) {
        return templateString.replace(/{{\s?([\w\.]+)\s?}}/g, replacer);
    },

    replacer = function(match, modelProperty, nodeType) {
        return model.read(modelProperty);
    };

    return {
        parse:parse
    };

});

