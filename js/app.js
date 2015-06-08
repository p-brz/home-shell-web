app = angular.module('homeshell', [
    'ngRoute',
    'frapontillo.bootstrap-switch' //angular-bootstrap-switch
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
            //url: 'http://localhost:8080/groups/',
            url: 'samples/sample_groups.json',
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
    $scope.log = function(msg){console.log(msg);};

    $scope.appliances = [];
    $scope.loading = true;
    $scope.appliancesById = [];
    //Lista de schemes
    $scope.uiSchemes = [];
    //Appliance q está selecionada
    $scope.currentAppliance = null;

    $scope.setup = function(){
        $scope.getItems();
        $scope.getSchemes();
    }

    $scope.processAppliances = function(){
        var applianceCount = $scope.appliances.length;

        for(i = 0; i < applianceCount; i++){
            var appliance = $scope.appliances[i];
            var applianceId = appliance.id;
            console.log(appliance.status.ligada);
            $scope.appliancesById[applianceId] = {
                name: appliance.name,
                realstatus: appliance.status.ligada,
                status: $scope.lampStatus(appliance.status.ligada),
                viewStatus : appliance.status.ligada == 1
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
            url: 'samples/sample_appliances_a.json',
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


    $scope.getSchemes = function() {
        var req = {
            method: 'GET',
            // url: 'http://localhost:8080/appliances/',
            // url: 'http://localhost/academico/hs-samples/sample_appliances_a.json',
            url: 'samples/sample_ui-schemes.json',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }

        $http(req)
        .success(function(data, status) {
            console.log('GOT schemes');
            $scope.uiSchemes = data.schemes;
        })
        .error(function(data, status) {
            console.log("Failed to get schemes", status);
            alert("Could not retrieve scheme data from server");
        });
    };

    $scope.getScheme = function(appliance){
        if(appliance){
            var schemeName = appliance.package + "." + appliance.type;
            return $scope.uiSchemes[schemeName];
        }
        return null;
    }

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
            realStatus = $scope.appliancesById[lampId].realstatus;
            $scope.appliancesById[lampId].viewStatus = (realStatus == 1);
        });
    }

    $scope.jsonStringify = function(object){
        return JSON.stringify(object);
    }
    $scope.setCurrentAppliance = function(applianceId){
        console.log("show");
        $scope.currentAppliance = $scope.appliancesById[applianceId];
        console.log("end show. Appliance id: ", applianceId);
    }
});

//exemplo
app.directive('childDirective', function ($http, $templateCache, $compile, $parse) {
return {
    restrict: 'E',
    scope: [],
    compile: function (iElement, iAttrs, transclude) {
        iElement.append('child directive<br />');
    }
}
});

app.directive('applianceDetail', [function ($compile) {
   return {
     restrict: 'E',
    scope: {
      appliance: '=appliance'
    },
    templateUrl : 'templates/appliance-detail-template.html'
   };
 }]);

app.directive('applianceControl', [function ($compile) {
   return {
     restrict: 'E',
     //link:function(scope, element, attrs) {
    //   var tag = '<input bs-switch type="checkbox" switch-size="small" switch-label-width="0"'
    //     + 'ng-model="appliancesById[appliance.id].viewStatus"'
    //     + 'ng-change="toggleStatus(appliancesById[appliance.id].viewStatus ? 1 : 0, appliance.id);"'
    //     + '>'
    //   element.append(tag);
    //   $compile(tag)(scope);
    // }
    scope: {
      appliance: '=appliance'
    },
    template : function(element, attrs){
      return '<input bs-switch type="checkbox" ng-model="appliance.viewStatus"/>';
    }
    //compile: function (element, attrs) {
    //    var x = '<input bs-switch ng-model="">';
    //    element.append(x);
    //}
    //, link: function(scope, element, attrs, controllers) {
    //  console.log("link, scope: ", scope, "\n Element: ", element );
    //},
   };
 }]);
