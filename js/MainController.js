angular.module('homeshell').controller("MainController", function(){
    this.title = 'Title';
    this.console = console;
    
    this.onLoadFunction = function(){
        console.log("loaded!");
        DashgumSidebar();
    }
});
