(function(ng){
  var app = ng.module('ScriptLazyLoad', []);

  app.directive('script', function() {
    return {
      restrict: 'E',
      scope: false,
      link: function(scope, elem, attr) {

        if ('lazyLoad' in attr || attr.type=='text/javascript-lazy') {
          var code = elem.text();
          var f = new Function(code);
          f();
        }
      }
    };
  });
}(angular));
