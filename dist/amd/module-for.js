define(
  ["./test-context","./isolated-container","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var testContext = __dependency1__["default"] || __dependency1__;
    var isolatedContainer = __dependency2__["default"] || __dependency2__;
    var QUnit = window.QUnit;

    __exports__["default"] = function moduleFor(fullName, description, callbacks, delegate) {
      callbacks = callbacks || { };

      var needs = [fullName].concat(callbacks.needs || []);
      var container = isolatedContainer(needs);

      callbacks.subject = callbacks.subject || defaultSubject;

      callbacks.setup    = callbacks.setup    || function() { };
      callbacks.teardown = callbacks.teardown || function() { };

      function factory() {
        return container.lookupFactory(fullName);
      }

      function subject(options) {
        return callbacks.subject(factory(), options);
      }

      testContext.set({
        container: container,
        subject: subject,
        factory: factory,
        __setup_properties__: callbacks
      });

      if (delegate) {
        delegate(container, testContext.get());
      }

      var context = testContext.get();
      var _callbacks = {
        setup: function(){
          Ember.$('<div id="ember-testing"/>').appendTo(document.body);
          buildContextVariables(context);
          callbacks.setup.call(context, container);
        },

        teardown: function(){
          Ember.run(function(){
            container.destroy();
          });
          Ember.$('#ember-testing').empty();
          callbacks.teardown(container);
        }
      };

      QUnit.module(description || fullName, _callbacks);
    }

    function defaultSubject(factory, options) {
      return factory.create(options);
    }

    // allow arbitrary named factories, like rspec let
    function buildContextVariables(context) {
      var cache = { };
      var callbacks = context.__setup_properties__;
      var factory = context.factory;
      var container = context.container;

      Ember.keys(callbacks).filter(function(key){
        // ignore the default setup/teardown keys
        return key !== 'setup' && key !== 'teardown';
      }).forEach(function(key){
        context[key] = function(options) {
          if (cache[key]) {
            return cache[key];
          }

          var result = callbacks[key](factory(), options, container);
          cache[key] = result;
          return result;
        };
      });
    }
  });