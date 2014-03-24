# Base Model

**model.extend()**
This function extends a model onto a another

Params:

* `constructor` Required. The object you are extending [object]
* `options` Required. The options for the object [object]
* `options.collection` Optional/Required if no superConstructor supplied. The datastore collection name to use [string]
* `options.validations` Optional. The key/value pairs for validation rules [object]
* `options.exclude` Optional. The array of names of which keys to exclude from .output() function calls [array]
* `options.indexes` Optional. The array of names of which keys to register as datastore indexes [array]
* `superConstructor` Optional. The super constructor to base the model off [object]

**model.update(arguments)**

Updates the data model with the arguments passed. It will only update parameters that are defined in model schema.

Example:

```javascript
new PostModel().update({
  title: req.params.title,
  author: req.user._id,
  body: req.params.body
});
```

Typically a model is created with this function being called by default. So passing an object argument to the `new PostModel(params)` will accomplish the same thing.

**model.save(function(err, model))**

Having an `_id` in your object will attempt to update an existing object, otherwise a new object is created in the datastore.

Example:

```javascript
new PostModel({
  title: req.params.title,
  author: req.user._id,
  body: req.params.body
}).save(function(err, model) {
  if(err) {
    return res.resp.handleError(500, 'An internal error occurred');
  }

  res.resp.data(model.output());
  res.resp.send();
});
```

**model.output()**

Returns the desired output after parsing out any `exclude`'d params and excluding anything with a double-underscore `__` prefixing it as well.

**model.getById(id, function(err, model))**

This function queries the datastore for an object with the specified `id` and returns an error or model or null if no model is found.

Example:

```javascript
new PostModel().getById(id, function(err, model) {
  if(err) {
    return res.resp.handleError(500, 'An error occurred getting the PostModel');
  }

  if(!model) {
    return res.resp.handleError(404, 'PostModel not found');
  }

  // else do something with the model.
});
```

**getBy`field_name`(value, function(err, models))**

The functions get created when you extend the BaseModel. It looks at whatever field names are in your model and creates a function for that field name. It will ignore fields that start with an underscore.
