spider.execute('diesel');

spider.define('diesel', function() {

    var model = spider.import('model'),
        view = spider.import('view'),
        controller = spider.import('controller'),
        settings = {
            auth:{
                views:[],
                redirect:'/',
                property:'auth'
            },
            mobile:false
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

    init = function() {
        document.addEventListener('DOMContentLoaded', function() {
            // start async call for auth checker
            model[settings.auth.property] = false;
            view.init();
            navigate(location.pathname);
        });
    },

    // navigate is put in the core because it is considered a state change
    // that affects all components of the framework
    navigate = function(url) {
        view.hide(function() {
            // check to see if the view requires user authentication
            if(url === '/') {
                url = '/home';
            }else if(settings.auth.views.indexOf(url) !== -1 && !model[settings.auth.property]) {
                url = settings.auth.redirect;
            };
            // change the url and add it to the browser history
            if(!settings.mobile) {
                history.pushState({}, '', url);
            };
            // create the controller for the new view if one exists
            controller.build(url);
            // check the cache and load the view
            view.load(url);
        });
    };

    onpopstate = function(event) {
        if(event.state !== null) {
            navigate(location.pathname);
        };
    };

    window.diesel = {
        config:{
            router:function(newSettings) {
                config(settings, newSettings);
            },
            view:view.config
        },
        controller:controller.register,
        init:init,
        navigate:navigate,
        service:controller.createService
    };

});

