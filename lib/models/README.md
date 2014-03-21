# Base Model

**.extend()**
This function extends a model onto a another

Params:

* `constructor` The object you are extending with [object]
* `options` The options for the object [object]
* `options.collection` The collection to use [string]
* `options.validations` The key/value pairs for validation rules [object]
* `options.exclude` The array of names of which keys to exclude from output [array]
* `options.indexes` The array of names of which keys to register as indexes [array]
* `superConstructor` The super constructor to base the model off [object]

**.update()**

This is the basic update function. An `_id` is required to perform this task.

**.save()**

This is the basic save function. It validates data types and creates an `_id` for the object before saving it to the database

**.getbyid()**

This function queries the database for an object with a matching `_id` to the one given.

**getBy[field_name]()**

The functions get created when you extend the model. It looks at whatever field names are in your model and creates a function for that field name

