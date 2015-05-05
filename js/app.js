app = angular.module('homeshell', [
    'ngRoute', 'ScriptLazyLoad'
]);

app.config(['$routeProvider',
function($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'routes/main.html',
        controller: 'MainController'
    })
    .when('/login', {
        templateUrl: 'routes/login.html',
        controller: 'LoginController'
    })
    .otherwise({
        redirectTo: '/'
    });
}
]);

app.controller('RoomsController', function($scope, $http) {
    $scope.rooms = [];
    $scope.loading = true;
    $scope.getItems = function() {
        var req = {
            method: 'GET',
            url: 'http://localhost:8080/groups/',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }


        $http(req)
        .success(function(data, status) {
            console.log('SUCCESS');
            $scope.rooms = data.contents.groups;
            $scope.loading = false;
        })
        .error(function(data, status) {
            console.log(status);
            alert("Could not retrieve data from server");
        });
    };
});

app.controller('IndexAppliancesController', function($scope, $http) {
    $scope.appliances = [];
    $scope.loading = true;
    $scope.appliancesById = [];

    $scope.processAppliances = function(){
        var applianceCount = $scope.appliances.length;

        for(i = 0; i < applianceCount; i++){
            var appliance = $scope.appliances[i];
            var applianceId = appliance.id;
            console.log(appliance.status.ligada);
            $scope.appliancesById[applianceId] = {
                name: appliance.name,
                realstatus: appliance.status.ligada,
                status: $scope.lampStatus(appliance.status.ligada)
            };
        }
        console.log(JSON.stringify($scope.appliancesById));
        console.log('Great! Loaded ' + $scope.appliancesById.length  + ' appliances');
    }

    $scope.getItems = function() {
        var req = {
            method: 'GET',
            // url: 'http://localhost:8080/appliances/',
            // url: 'http://localhost/academico/hs-samples/sample_appliances_a.json',
            url: 'http://localhost/academico/home-shell-web/samples/sample_appliances_a.json',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }

        $http(req)
        .success(function(data, status) {
            console.log('SUCCESS');
            $scope.appliances = data.contents.appliances;
            $scope.processAppliances();
            $scope.loading = false;
        })
        .error(function(data, status) {
            console.log(status);
            alert("Could not retrieve data from server");
        });
    };

    $scope.lampStatus = function(status){
        if(status == 1){
            return 'ON';
        }else{
            return 'OFF';
        }
    }

    $scope.updateAppliance = function(lampId, lampData){
        console.log('Updating appliance');
        console.log('Data: ' + lampData.status.ligada);
        $scope.appliancesById[lampId].status = $scope.lampStatus(lampData.status.ligada);
        $scope.appliancesById[lampId].realstatus = lampData.status.ligada;
    }

    $scope.toggleStatus = function(status, lampId){
        console.log('ToggleStatus: ' + status);
        var oppositeService = '';
        if(status == 1){
            oppositeService = 'desligar';
        }else{
            oppositeService = 'ligar';
        }

        var serviceurl = 'http://localhost:8080/appliances/' + lampId + '/services/' + oppositeService + '/';
        console.log(serviceurl);
        var req = {
            method: 'POST',
            url: serviceurl
        }

        $http(req)
        .success(function(data, status) {
            console.log(JSON.stringify(data));
            if(data.status == 200){
                $scope.updateAppliance(lampId, data.contents.appliance);
            }else{
                alert(data.message);
            }
        })
        .error(function(data, status) {
            console.log(status);
            alert("Could not update appliance...");
        });
    }
});
