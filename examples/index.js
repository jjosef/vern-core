/**
 * Created by alextypefoo on 3/24/14.
 */
 var vern = require('../lib'); // replace with 'vern-core'

 new vern().then(function($vern) {
   function MyController($vern) {
     var $scope = new $vern.controller();

     return $scope;
   }

   function MyModel() {
     this.name = null;

     return this.update(arguments[0]);
   }

   $vern.models.MyModel = new $vern.model().extend(MyModel, {
     collection: 'my_models',
     indexes: [],
     exclude: [],
     validations: {},
     validation_exceptions: {},
     non_editable: []
   }, null);

   $vern.controllers.my_controller = new MyController($vern).init({
     model: $vern.models.MyModel,
     publicRoute: '/my_controller',
     //publicPostRoute: '/homepage',
     //publicDeleteRoute: '/homepage',
   });
 }).fail(function(err) {
   console.log(err);
   console.log(err.stack);
   // you could have email or push notifications here.
   //
   // or exit
   process.exit(1);
 });
