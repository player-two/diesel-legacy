spider.define('view', function() {

    var directives = spider.import('directives'),
        frame = spider.import('frame'),
        model = spider.import('model'),

        cache = {},
        frames = {},
        settings = {
            viewRoot:'/views',
            transition:{
                tin:function(view) { view.style.display = 'block'; },
                out:function(view, callback) { view.style.display = 'none'; callback(); }
            }
        },

    config = function(settings, newSettings) {
        for(prop in newSettings) {
            if(typeof newSettings[prop] === 'object' && !Array.isArray(newSettings[prop])) {
                config(settings[prop], newSettings[prop]);
            }else{
                settings[prop] = newSettings[prop];
            };
        };
    },

    hide = function(callback) {
        settings.transition.out(frames['main'].container, callback);
    },

    init = function() {
        directives.bind(document.querySelectorAll('nav')[0]);
        var nodeList = document.querySelectorAll('[data-view]');
        for(var i = 0, ilen = nodeList.length; i < ilen; i++) {
            var id = nodeList[i].getAttribute('data-view');
            frames[id] = frame.create(nodeList[i]);
            if(id !== 'main') {
                frames[id].reset();
                frames[id].start();
            };
        };
    },

    load = function(url) {
        if(url in cache) {
            show(cache[url]);
        }else{
            // get the template from the server
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if(request.readyState === 4) {
                    cache[url] = request.responseText;
                    show(request.responseText);
                };
            };
            request.open('GET', '/views' + url + '.html', true);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send();
        };
    },
    
    show = function(html) {
        frames['main'].setContent(html);
        settings.transition.tin(frames['main'].container);
    };

    return {
        config:function(newSettings) {
            config(settings, newSettings);
        },
        hide:hide,
        init:init,
        load:load
    };

});

