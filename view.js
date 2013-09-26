module.define('view', function() {

    var directives = module.import('directives'),
        model = module.import('model'),
        templater = module.import('templater'),

        cache = {},
        settings = {
            viewRoot:'/views',
            transition:{
                tin:function(view) { view.style.display = 'block'; },
                out:function(view, callback) { view.style.display = 'none'; callback(); }
            }
        },
        viewElement = document.querySelector('[data-view]'),

    config = function(settings, newSettings) {
        for(prop in newSettings) {
            if(typeof newSettings[prop] === 'object' && !Array.isArray(newSettings[prop])) {
                config(settings[prop], newSettings[prop]);
            }else{
                settings[prop] = newSettings[prop];
            };
        };
    },

    prepare = function(htmlTemplate) {
        viewElement.innerHTML = htmlTemplate;
        templater.initialize(viewElement);
        directives.bind(viewElement);
        settings.transition.tin(viewElement);
    },

    load = function(url) {
        if(url in cache) {
            prepare(cache[url]);
        }else{
            // get the template from the server
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if(request.readyState === 4) {
                    cache[url] = request.responseText;
                    prepare(request.responseText);
                };
            };
            request.open('GET', '/views' + url + '.html', true);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send();
        };
    };

    return {
        config:function(newSettings) {
            config(settings, newSettings);
        },
        hide:function(callback) {
            settings.transition.out(viewElement, callback);
        },
        initRoot:function() {
            templater.initialize(document.body);
            directives.bind(document.body);
        },
        load:load
    };

});

