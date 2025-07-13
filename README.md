# [MONGOOSE LEAN EXTENSION](https://github.com/SsekandiRaymond/mongoose-lean-extension)

A powerful Mongoose plugin that **extends the functionality of `.lean()`** queries to eliminate common post-processing steps — like stringifying ObjectIds, renaming `_id` key to something else, and removing internal Mongoose metadata like `__v`.

---

> `mongoose-lean-extension@1.0.0` is here. Welcome this major version update. 0 -> 1

### Breaking Changes:

> Read through this README for complete overview
> Visit my GitHub repo for the source code
> Typescript support
> My contact are everywhere in this source code

---

## Overview

Mongoose’s `.lean()` is a great performance optimization, returning plain JavaScript objects instead of full Mongoose documents. But it comes with annoyances:

-   ObjectId keys are still BSON types (`ObjectId`) that require manual conversion.
-   The `__v` version key is often unnecessarily present in results.
-   Deeply nested ObjectIds in subdocuments aren't stringified without additional effort.

**`mongoose-lean-extension` solves these problems** by automating the transformation of `.lean()` results. It enables:

-   Auto-stringification of top-level `_id` fields
-   Auto-removal of the `__v` field
-   Optional stringification of nested ObjectId fields via path expressions (e.g. `contributors._id`)

---

## Installation

```bash
npm i mongoose-lean-extension
```

## 🔧 Usage

### Global Plugin (Recommended)

```javascript
const mongooseLeanExtension = require("mongoose-lean-extension");
const mongoose = require("mongoose");

// Apply plugin globally to all schemas
mongoose.plugin(mongooseLeanExtension);
```

### Per-Schema Usage

```javascript
const mongooseLeanExtension = require("mongoose-lean-extension");

const schema = new mongoose.Schema({
    /* ... */
});
schema.plugin(mongooseLeanExtension);
```

### `IMPORTANT NOTICE`

-   All plugins are attached to the schema before it is compiled to create a model

    > ⚡ `mongoose-lean-extension` introduces negligible latency (<2ms per 100 documents) on average `.lean()` queries.

-   For how utility function in stringifyKeys
    > See [`util/stringifyPaths.js`](./util/stringifyPaths.js)

## Configuration Options

The plugin is configured via the .lean() query method.

```javascript
Model.find().lean({
    stringifyId: true, // (default: true) — Convert `_id` to string
    showVersion: false, // (default: false) — Remove `__v` from results
    stringifyKeys: ["nested._id"], // (optional) — Array of mongo-like paths [dot-paths] to nested ObjectId fields to stringify
    rename: "key", // Renames `_id` to `key`
});
```

## Option Details

| Option          | Type     | Default   | Description                                                                             |
| --------------- | -------- | --------- | --------------------------------------------------------------------------------------- |
| `stringifyId`   | boolean  | true      | If true, stringifies the document `_id`. If false, leaves as ObjectId.                  |
| `showVersion`   | boolean  | false     | If false, removes the `__v` field from results if they exist otherwise, leaves them.    |
| `stringifyKeys` | string[] | []        | Mongo-like (Dot-separated) paths to any nested ObjectId fields to convert into strings. |
| `rename`        | string   | undefined | Renames `_id` to provided string value.                                                 |

## Example

```javascript
const mongooseLeanExtension = require("mongoose-lean-extension");
const mongoose = require("mongoose");

mongoose.plugin(mongooseLeanExtension);

const ContributorSchema = new mongoose.Schema({
    username: { type: String, required: true },
    languages: [String],
});

const PackageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contributors: [ContributorSchema], // This will have ObjectId _id for each of the nested document, Perfect for nested stringification
    },
    { timestamps: true }
);

const Package = mongoose.model("Package", PackageSchema);

/**
 * await Package.insertMany([
 *    {
 *        name: "express",
 *        contributors: [
 *            {
 *              username: "tjholowaychuk",
 *              languages: ["JavaScript", "TypeScript"],
 *            },
 *            {
 *              username: "dougwilson",
 *              languages: ["JavaScript"],
 *            },
 *        ],
 *    },
 *    {
 *      name: "react",
 *      contributors: [
 *          {
 *             username: "gaearon",
 *             languages: ["JavaScript", "TypeScript"],
 *          },
 *          {
 *            username: "bvaughn",
 *            languages: ["JavaScript"],
 *          },
 *      ],
 *    }
 * ])
 */

const packages = await Package.find().lean({
    stringifyKeys: ["contributors._id"],
});

console.dir(packages, { depth: null });
```

**Output**

```json
[
  {
    "_id": "683a2480b53cfe150c05c5a8",
    "name": "express",
    "contributors": [
      {
        "username": "tjholowaychuk",
        "languages": ["JavaScript", "TypeScript"],
        "_id": "683a2480b53cfe150c05c5a9"
      },
      ...
    ],
    "createdAt": "2025-05-30T21:34:56.981Z",
    "updatedAt": "2025-05-30T21:34:56.981Z"
  },
  ...
]
```

## How It Works

-   Under the hood, the plugin attaches a post-query middleware on find and findOne:

-   If the query uses .lean(), it inspects custom plugin options from lean({...}).

-   `_id` fields are converted to .toString() if enabled.

-   `__v` is stripped if disabled.

Nested ObjectIds are stringified recursively using a safe traversal method.

##### Custom Path Stringification

The helper function `applyStringifyAtPath(object, path)` walks through nested objects and arrays to convert specific paths like:

```js
stringifyKeys: ["contributors._id", "authors.contact._id"];
```

## Plugin Architecture

This package consists of a modular design that allows importing specific plugins if needed.

#### Included Plugins

| Plugin        | File       | Purpose                                          |
| ------------- | ---------- | ------------------------------------------------ |
| stringifyId   | plugins.js | Converts top-level `_id` fields                  |
| rename        | plugins.js | Renames top-level `_id` to provided string value |
| deversion     | plugins.js | Removes `__v` fields                             |
| stringifyKeys | plugins.js | Stringifies custom ObjectId paths                |
| main          | index.js   | All-in-one plugin (recommended)                  |

`Example: Using Only deversion`

```js
const { deversion } = require("mongoose-lean-extension/plugins");
mongoose.plugin(deversion);
```

`Example: Selective Composition`

```js
const { stringifyId } = require("mongoose-lean-extension/plugins.js");
const { stringifyKeys } = require("mongoose-lean-extension/plugins.js");
const { deversion } = require("mongoose-lean-extension/plugins.js");
const { rename } = require("mongoose-lean-extension/plugins.js");

const schema = new mongoose.Schema({...});
schema.plugin(stringifyKeys);
schema.plugin(stringifyId);
schema.plugin(deversion);
schema.plugin(rename);
```

### Testing

Unit tests are written using Jest.

```bash
$ npm run test

> mongoose-lean-extension@0.1.3 test
> jest --coverage

 PASS  __tests__/index.test.js
 PASS  __tests__/plugins.test.js (5.995 s)
------------------------------|---------|----------|---------|---------|-------------------
File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------------|---------|----------|---------|---------|-------------------
All files                     |   95.91 |    86.66 |     100 |   97.64 |
 Mongoose Lean Extension      |   95.23 |    84.81 |     100 |   97.22 |
  index.js                    |   93.33 |    87.09 |     100 |   96.29 | 61
  plugins.js                  |   96.29 |    83.33 |     100 |   97.77 | 59
 Mongoose Lean Extension/util |     100 |      100 |     100 |     100 |
  stringifyPaths.js           |     100 |      100 |     100 |     100 |
------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        6.591 s
Ran all test suites.
```

Includes tests using `mongodb-memory-server` for in-memory database mocking.

### Advanced

#### How to Preserve `_id` as ObjectId?

```js
Model.find().lean({ _id: false }); // Disables stringification of `_id`
```

Or; do not use the all-in-one plugin at "global level" rather use the purpose-specific at "schema level"

#### How to Keep `__v`?

```js
Model.find().lean({ __v: true }); // Keeps __v field in results
```

Or; do not use the all-in-one plugin at "global level" rather use the purpose-specific at "schema level"

#### How to Keep nested ObjectId fields?

```js
Model.find().lean(); // Keeps nested ObjectIds
```

Or; do not use the plugin

## Extras

```js
async function __run_() {
    await mongoose.connect("mongodb://localhost:27017/trials");

    const User = mongoose.model("User", new Schema({ name: String, age: Number }));
    const Car = mongoose.model(
        "Car",
        new Schema({
            model: String,
            owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        })
    );

    const ContributorSchema = new Schema({
        username: { type: String, required: true },
        languages: [String],
    });
    const PackageSchema = new Schema(
        {
            name: { type: String, required: true },
            contributors: [ContributorSchema],
        },
        { timestamps: true }
    );

    /** First time? Un-comment the lines below and run the code.
     * After initial run comment them again (or delete)
     */

    // await Car.deleteMany({});
    // await User.deleteMany({});

    // await Promise.allSettled([
    //     User.create({ name: "Ariella", age: 2 }),
    //     User.create({ name: "Arianna", age: 33 }),
    // ]);

    // await Promise.allSettled([
    //     Car.create({
    //         model: "BMW",
    //         owner: Types.ObjectId.createFromHexString("6839968512bb0d7b0d62e23e"),
    //     }),
    //     Car.create({
    //         model: "Rover",
    //         owner: Types.ObjectId.createFromHexString("6839968512bb0d7b0d62e23e"),
    //     }),
    //     Car.create({
    //         model: "Toyota",
    //         owner: Types.ObjectId.createFromHexString("6839968512bb0d7b0d62e23f"),
    //     }),
    // ]);

    const users = await User.find().lean();
    console.log(users);

    const cars = await Car.find().populate("owner").lean(); // if "stringifyId" plugin is used on mongoose "global level" that is, mongoose.plugin(stringifyId) and .populate("field") is on the query, both car._id and car.owner._id will be hex strings however, if it is used on schema level, for example, CarSchema.plugin(stringifyId) only: car._id will be hex string but car.owner._id will be ObjectId... if UserSchema.plugin(stringifyId): car.owner._id will be hex string but car._id will be ObjectId.
    console.log(cars);

    /** cars.owner might be null in case you do not assign the right object ids as new ones are created everytime a document is recorded. Check "owner" property assigned value for await Promise.allSettled([ ... ]) for Car.create({}) */

    await mongoose.disconnect();
}

__run_().catch(console.error);
```

## ✅ Compatibility

-   ✅ Mongoose 8.x
-   ✅ MongoDB >= 4.x

### Contributing

Pull requests are welcome! Feel free to open issues or suggestions on improvements, use cases, or performance enhancements.

### Feedback

If this plugin saves you time or solves your pain, please consider starring the repo and sharing it with the Mongoose community!

`Let me know if you'd like this split into multiple files (e.g. for GitHub pages) or want me to generate a live demo repo or documentation website from it.`

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors

1. [Ssekandi](https://github.com/SsekandiRaymond) - Author

### 😏 Gotcha Section {Ignore if you are in a bad mood}

-   Aaah nothing much, just weekly downloads reduce when I do not update this package.
-   Anyways, I added the rename functionality because I found it a little awkward to use `_id` in my data for React Native's `FlatList` keyExtractor prop.
