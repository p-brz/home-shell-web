angular.module('homeshell').controller("MainController", function(){
    this.title = 'Title';
    this.console = console;
    this.document = document;
    this.onLoadFunction = function(){
        console.log("loaded!");
        DashgumSidebar();
    }
});
