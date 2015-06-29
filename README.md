#Copyright Notice

Vern is copyright 2014 uh-sem-blee, Co. Built by typefoo.

## Documentation

The best method for utilizing Vern is by using the [vern-cli](http://www.vern.io) module

However, if you're interested in using Vern as a low level API builder, continue reading.

## Install

`npm install vern-core`

## Contributing

Contributing to vern-core can be done via your own forked repository

* [Fork the repo](https://github.com/uh-sem-blee/vern-core/fork)
* Clone the repo to your local machine

```
git clone <your-forked-repo-url>
```

* Add the master source to your remote list for pulling updates easily

```
git remote add core git@github.com:uh-sem-blee/vern-core.git
```

* When you need to update perform a `git pull core master`
* Create issues with the following formats:

```
[feature] _component_name_ _short_description_
[documentation] _component_name_ _sub_component_name_
[bug] _component_name_ _short_description_
```

* When committing ensure your messages correspond with your issue. This practice ensures commits are made with relevant information and can easily be tracked.

```
git commit -m "#_issue_number_ _component_name_ _description_of_commit_"
```

* Once you believe your issue is resolved, perform a pull request from your forked repo page.
* We will review your request and integrate the necessary pieces into core.

## Structures

Vern at its core is just an API builder platform with a simple Model -> Controller setup.

### Controllers & Models

You can setup controllers with `vern-core` by doing the following:

```js
var vern = require('vern-core');

new vern().then(function($vern) {
  $vern.loadControllers('./controllers'); // or /path/to/your/controller files
  $vern.loadModels('./models'); // or /path/to/your/model/files
}).fail(function(err) {
  console.log(err);
  console.log(err.stack);
  // you could have email or push notifications here.
  //
  // or exit
  process.exit(1);
});
```

If you want to manually setup controllers do the following:

```js
var vern = require('vern-core');

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
```
