module.define('mfw', function() {

    // initialize all the modules and destroy their constructors' container
    var model = module.import('model'),
        view = module.import('view'),
        controller = module.import('controller'),
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

    mediator.listen('navigate', navigate);

    return {
        config:{
            router:function(newSettings) {
                config(settings, newSettings);
            },
            view:view.config
        },
        controller:controller.register,
        init:function() {
            model[settings.auth.property] = false;
            view.initRoot();
            navigate(location.pathname);
        },
        navigate:navigate,
        service:controller.createService
    };

});

