serverUrl = "http://localhost:8081"
useSamples = false

app = angular.module('homeshell', [
    'ngRoute'
    , 'frapontillo.bootstrap-switch' //angular-bootstrap-switch
    , 'ui.bootstrap-slider' //angular-bootstrap-slider
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
        //var serverUrl = 'http://192.168.0.3:8080';
        //var serverUrl = 'http://10.5.28.194:8080';
        var req = {
            method: 'GET',
            url: !useSamples ? serverUrl + '/groups/' : 'samples/sample_groups.json',
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

app.controller('IndexAppliancesController', function($scope, $http, CloneService) {
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
        // $scope.getSchemes();
    }

    $scope.processAppliances = function(){
        var applianceCount = $scope.appliances.length;

        for(i = 0; i < applianceCount; i++){
            var appliance = $scope.appliances[i];
            var applianceId = appliance.id;
            console.log(appliance.status.ligada);
            $scope.appliancesById[applianceId] = {
                id : appliance.id,
                name: appliance.name,
                type : appliance.type,
                package : appliance.package,

                view_status : CloneService.cloneObject(appliance.status),
                real_status : CloneService.cloneObject(appliance.status),

                //Deprecated
                realstatus: appliance.status.ligada,
                status: $scope.lampStatus(appliance.status.ligada),
                viewStatus : appliance.status.ligada == 1
            };
        }

        console.log(JSON.stringify($scope.appliancesById));
        console.log('Great! Loaded ' + $scope.appliancesById.length  + ' appliances');
    }

    $scope.getItems = function() {
        console.log("get items");
        var req = {
            method: 'GET',
            url: !useSamples ? serverUrl + '/appliances/' : 'samples/sample_appliances_a.json',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }

        $http(req)
        .success(function(data, status) {
            console.log('SUCCESS');
            console.log(data.contents);
            // $scope.appliances = data.contents.appliances;
            $scope.getSchemes(data.contents.appliances);
            // $scope.processAppliances();
        })
        .error(function(data, status) {
            console.log(status);
            alert("Could not retrieve data from server when trying to get appliances");
        });
    };


    $scope.getSchemes = function(appliances) {
        $scope.loading = true;
        //var serverUrl = 'http://10.5.28.194:8080';
        var req = {
            method: 'GET',
            url: !useSamples ? serverUrl + '/appliances/schemes/' : 'samples/sample_ui-schemes.json',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }

        $http(req)
        .success(function(data, status) {
            $scope.uiSchemes = data.contents.schemes;

            $scope.appliances = appliances;
            $scope.processAppliances();
            $scope.loading = false;
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

app.directive('applianceControl', ["$compile", "$templateRequest", "ApplianceService",
function ($compile,  $templateRequest, applianceService) {
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
            scope.applianceService = applianceService;

            if(!scope.control){
                return;
            }
            controlType = scope.control.type;
            var templateUrl = getTemplateUrlForControl(controlType);
            if(!templateUrl){
                console.log("Could not render control of type '" + controlType + "'");
                return;
              }
              controlType = scope.control.type;
              var templateUrl = getTemplateUrlForControl(controlType);
              if(!templateUrl){
                  console.log("Could not render control of type '" + controlType + "'");
                  return;
              }
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
   }
]);

app.directive('selectpickerNg', function ($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel){
            //Timeout espera até elemento estar renderizado (http://stackoverflow.com/a/22541080)
            $timeout(function(){
                //Ativa selectpicker neste elemento
                $(element).selectpicker()
            });
            //model to view
            ngModel.$formatters.push(function(val) {
                $timeout(function(){
                    $(element).selectpicker('render');
                });
                //$(element).selectpicker('val', 'Mustard');
                return val;
            });
        }
    }
});

app.directive('selectcontrolConverter', function ($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            //view to model
            ngModel.$parsers.push(function(val) {
                console.log("selectcontrol - value from view:" + val);
                return val;
            });
            //model to view
            ngModel.$formatters.push(function(val) {
                console.log("selectcontrol - value from model:" + val);
                return val;
            });
        }
    }
});

app.directive('toggleControl', function ($timeout) {
return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel){
      //Timeout espera até elemento estar renderizado (http://stackoverflow.com/a/22541080)
       $timeout(function(){
          $(element).bootstrapSwitch();
          // When the checkbox switch is clicked, set its value into the ngModel
          element.on('switchChange.bootstrapSwitch', function (e) {
             // $setViewValue --> $viewValue --> $parsers --> $modelValue
             console.log("[toggleControl] change view");
             ngModel.$setViewValue(e.target.checked);
          });
       });

      //format text going to user (model to view)
      ngModel.$formatters.push(function(value) {
          trueValue = scope.$eval(attrs.ngTrueValue);
          console.log("[toggleControl] from model to view: " + value + " with type " + typeof(value));
          console.log("[toggleControl] true value: " + trueValue + " with type " + typeof(trueValue));
          $timeout(function(){
            $(element).bootstrapSwitch('state', value === trueValue);
          });
          return value;
      });
    }
}
});



app.factory("CloneService", function(){
    return {
        //
        cloneObject : function (obj) {
            if (null == obj || "object" != typeof obj) return obj;
            var copy = obj.constructor();
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
            }
            return copy;
        }
    };
})

app.factory("ApplianceService", function($http, CloneService){

    var updateApplianceStatus = function(appliance, responseData){
        if(responseData){
            var applianceResponse = responseData.contents.appliance;
            appliance.view_status = CloneService.cloneObject(applianceResponse.status);
            appliance.real_status = CloneService.cloneObject(applianceResponse.status);
        }
    }

     return {
         serverAddress : serverUrl,

         onChangeControl : function(appliance, control){
            if(this.needUpdate(appliance, control)){
                this.requestApplianceUpdate(appliance, control);
            }
        },

         requestApplianceUpdate : function(appliance, control){
           var requestUrl = this.serverAddress + '/event/' + appliance.id + "/";
           var eventData = this.makeEvent(appliance, control);

           console.log("POST " + requestUrl);
           console.log("POST data: " + eventData);
           var req = {
               method: 'POST',
               url: requestUrl,
               data : eventData,
               timeout : 5000
           }

           $http(req)
           .success(function(data, status) {
               console.log(JSON.stringify(data));
               if(data.status == 200){
                   updateApplianceStatus(appliance, data);
               }else{
                   alert(data.message);
               }
           })
           .error(function(data, status) {
               appliance.view_status = CloneService.cloneObject(appliance.real_status);

               alert("Could not update appliance...");
           });
         },

         makeEvent : function(appliance, control){
             statusToChange = control['bind-status'];
             changedValue = appliance.view_status[statusToChange];

             callbackKey = "*";
             if(control.type == "toggle"){
                var trueValue = control.params.hasOwnProperty('true-value')
                                      ? control.params['true-value'] : true;
                console.log("changedValue: " + changedValue + "; true-value: " + trueValue);
                callbackKey = (changedValue === trueValue) ? "on" : "off";
             }
             eventData = {
                control_id : control.id,
                callback_key: callbackKey
            }

            if(typeof(changedValue) !== "undefined"){
                eventData.value = changedValue;
            }

            return eventData;
        },

        needUpdate: function(appliance, control){
            console.log("needUpdate ENTER");
            if(control.type == "action"){
                return true;
            }
            statusToChange = control['bind-status'];
            viewStatus = appliance.view_status[statusToChange];
            realStatus = appliance.real_status[statusToChange];
            console.log("view status: " + viewStatus + "; real status: " + realStatus);
            console.log("view status: " + viewStatus + "; real status: " + realStatus);
            console.log(": " + viewStatus + " !== " + realStatus + " ? " + (viewStatus !== realStatus));
            return viewStatus !== realStatus;
        }
    };
});
