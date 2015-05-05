angular.module.controller('RoomsController', function($scope, $http) {
    $scope.rooms = [];
    $scope.getItems = function() {
        $http({method : 'GET', url : 'http://localhost:8080/groups/'})
        .success(function(data, status) {
            $scope.rooms = data.contents.groups;
        })
        .error(function(data, status) {
            alert("Could not retrieve data from server");
        });
    };
});
