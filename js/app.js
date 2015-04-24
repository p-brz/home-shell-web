app = angular.module('homeshell', [
  'ngRoute', 'ScriptLazyLoad'
]);

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'routes/main.html',
        controller: 'MainController'
      }).
      otherwise({
        redirectTo: '/'
      });
  }
]);
