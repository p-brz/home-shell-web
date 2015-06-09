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

    $scope.example_control = null;


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
                appliance_status : appliance.status,
                realstatus: appliance.status.ligada,
                status: $scope.lampStatus(appliance.status.ligada),
                viewStatus : appliance.status.ligada == 1,
                type : appliance.type,
                package : appliance.package
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
            $scope.uiSchemes = data.schemes;

            scheme = data.schemes["com.homeshell.lamp.defaultlamp"];
            console.log("scheme example: ", scheme);
            $scope.example_control = scheme.controls[0];
            console.log("example control: ", $scope.example_control);
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

    $scope.getMainControl = function(appliance){
        scheme = $scope.getScheme(appliance);
        if(scheme && scheme.controls.length > 0){
            for(control in scheme.controls){
                if(control.mainControl){
                    return control;
                }
            }

            //Se não encontrou nenhum controle marcado como principal, utiliza o primeiro
            return scheme.controls[0];
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
        $scope.currentAppliance = $scope.appliancesById[applianceId];
    }
});

app.directive('applianceDetail', [function ($compile) {
   return {
     restrict: 'E',
    scope: {
      appliance: '=appliance',
      scheme: '='
    },
    templateUrl : 'templates/appliance-detail-template.html'
   };
 }]);

app.directive('applianceControl', function ($compile,  $templateRequest) {
    this.templates = {
      "toggle"      : "control-toggle-template.html",
      "range"       : "control-range-template.html",
      "enumeration" : "control-enumeration-template.html",
      "digit"       : "control-digit-template.html",
      "action"      : "control-action-template.html",
    };

    this.getTemplateUrlForControl = function(controlType){
        if(templates[controlType]){
          return "templates/" + templates[controlType];
        }
        return null;
    }

    return {
        restrict: 'E',
        scope: {
          appliance: '=',
          control: '='
        },
        link: function(scope, element){
            console.log("applianceControl directive. Control: '", scope.control,"'");
            console.log("applianceControl directive. Appliance: '", scope.appliance,"'");
            if(!scope.control){
              return;
            }
            controlType = scope.control.type;
            var templateUrl = getTemplateUrlForControl(controlType);
            if(!templateUrl){
                console.log("Could not render control of type '" + controlType + "'");
                return;
            }
            console.log("render control: ", scope.control, " with template: ", templateUrl);
            $templateRequest(templateUrl).then(function(template) {
               // template is the HTML template as a string
               template =
                    "<label for='toggle-power'> {{control.label}}</label>"
                    + "<br/>"
                    + template;
               //Modifica element para que seu conteúdo seja o de template, então
               //compila seu conteúdo aplicando o escopo atual
               $compile(element.html(template).contents())(scope);
            }, function() {
               // An error has occurred here
               console.log("failed to load template: ", templateUrl);
            });
        }
   };
 });

 app.directive('selectpickerNg', function ($timeout) {
 return {
     restrict: 'A',
     link: function(scope, element, attrs){
       //Timeout espera até elemento estar renderizado (http://stackoverflow.com/a/22541080)
        $timeout(function(){
          //Ativa selectpicker neste elemento
          $(element).selectpicker()
        });
     }
 }
 });
