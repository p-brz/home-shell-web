angular.module('homeshell').controller("LoginController", function(){
    this.title = 'Title';
    this.console = console;

    this.onLoadFunction = function(){
        console.log("loaded!");
        DashgumSidebar();
    }
});
