# mongoose-lean-extension

A powerful Mongoose plugin that **extends the functionality of `.lean()`** queries to eliminate common post-processing steps — like stringifying ObjectIds and removing internal Mongoose metadata like `__v`.

---

## 🚀 Overview

Mongoose’s `.lean()` is a great performance optimization, returning plain JavaScript objects instead of full Mongoose documents. But it comes with annoyances:

-   ObjectId fields are still BSON types (`ObjectId`) that require manual conversion.
-   The `__v` version key is often unnecessarily present in results.
-   Deeply nested ObjectIds in subdocuments aren't stringified without additional effort.

**`mongoose-lean-extension` solves these problems** by automating the transformation of `.lean()` results. It enables:

-   Auto-stringification of top-level `_id` fields
-   Auto-removal of the `__v` field
-   Optional stringification of nested ObjectId fields via path expressions (e.g. `contributors._id`)

---

## 📦 Installation

```bash
npm i mongoose-lean-extension
```

## 🔧 Usage

### Global Plugin (Recommended)

```javascript
import mongooseLeanExtension from "mongoose-lean-extension";
import mongoose from "mongoose";

// Apply plugin globally to all schemas
mongoose.plugin(mongooseLeanExtension);
```

### Per-Schema Usage

```javascript
import mongooseLeanExtension from "mongoose-lean-extension";

const schema = new mongoose.Schema({
    /* ... */
});
schema.plugin(mongooseLeanExtension);
```

### `IMPORTANT NOTICE`

-   All plugins are attached to the schema before it is compiled to create a model

## ⚙️ Configuration Options

The plugin is configured via the .lean() query method.

```javascript
Model.find().lean({
    _id: true, // (default: true) — Convert `_id` to string
    __v: false, // (default: false) — Remove `__v` from results
    fields: ["nested._id"], // (optional) — Array of mongo-like paths [dot-paths] to nested ObjectId fields to stringify
});
```

## Option Details

| Option | Type     | Default | Description                                                                             |
| ------ | -------- | ------- | --------------------------------------------------------------------------------------- |
| \_id   | boolean  | true    | If true, stringifies the document `_id`. If false, leaves as ObjectId.                  |
| \_\_v  | boolean  | false   | If false, removes the `__v` field from results if they exist otherwise, leaves them.    |
| fields | string[] | []      | Mongo-like (Dot-separated) paths to any nested ObjectId fields to convert into strings. |

## 🧪 Example

```javascript
import mongooseLeanExtension from "mongoose-lean-extension";
import mongoose from "mongoose";

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
    fields: ["contributors._id"],
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

-   \_id fields are converted to .toString() if enabled.

-   \_\_v is stripped if disabled.

Nested ObjectIds are stringified recursively using a safe traversal method.

##### Custom Path Stringification

The helper function `applyStringifyAtPath(object, path)` walks through nested objects and arrays to convert specific paths like:

```js
fields: ["contributors._id", "authors.contact._id"];
```

## 🧩 Plugin Architecture

This package consists of a modular design that allows importing specific plugins if needed.

#### Included Plugins

| Plugin           | File                    | Purpose                           |
| ---------------- | ----------------------- | --------------------------------- |
| stringify        | plugins/stringify.js    | Converts top-level \_id fields    |
| deversion        | plugins/deversion.js    | Removes \_\_v fields              |
| stringify_fields | plugins/otherStrings.js | Stringifies custom ObjectId paths |
| main             | index.js                | All-in-one plugin (recommended)   |

`Example: Using Only deversion`

```js
import deversion from "mongoose-lean-extension/plugins/deversion";
mongoose.plugin(deversion);
```

`Example: Selective Composition`

```js
import stringify from "mongoose-lean-extension/plugins/stringify";
import stringify_fields from "mongoose-lean-extension/plugins/otherStrings";
import deversion from "mongoose-lean-extension/plugins/deversion";

const schema = new mongoose.Schema({...});
schema.plugin(stringify);
schema.plugin(stringify_fields);
schema.plugin(deversion);
```

### 🧪 Testing

Unit tests are written using Jest.

```bash
$ npm test

> mongoose-lean-extension@0.1.0 test
> jest --coverage

 PASS  __tests__/deversion.test.js
 PASS  __tests__/otherStrings.test.js
 PASS  __tests__/index.test.js
 PASS  __tests__/stringify.test.js
---------------------------------|---------|----------|---------|---------|-------------------
File                             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------------|---------|----------|---------|---------|-------------------
All files                        |   93.33 |    86.36 |     100 |   96.87 |
 Mongoose Lean Extension         |   91.66 |    86.95 |     100 |   95.23 |
  index.js                       |   91.66 |    86.95 |     100 |   95.23 | 139
 Mongoose Lean Extension/plugins |   94.59 |    84.37 |     100 |   96.66 |
  deversion.js                   |    90.9 |       80 |     100 |     100 | 23,31
  otherStrings.js                |   93.75 |    85.71 |     100 |   92.85 | 50
  stringify.js                   |     100 |     87.5 |     100 |     100 | 22
 Mongoose Lean Extension/util    |   92.85 |     90.9 |     100 |     100 |
  stringifyPaths.js              |   92.85 |     90.9 |     100 |     100 | 9
---------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        5.313 s

Ran all test suites.
```

Includes tests using `mongodb-memory-server` for in-memory database mocking.

### 🧠 Advanced

#### How to Preserve \_id as ObjectId?

```js
Model.find().lean({ \_id: false }); // Disables stringification of \_id
```

Or; do not use the all-in-one plugin at "global level" rather use the purpose-specific at "schema level"

#### How to Keep \_\_v?

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

    const cars = await Car.find().populate("owner").lean(); // if "stringify" plugin is used on mongoose "global level" that is, mongoose.plugin(stringify) and .populate("field") is on the query, both car._id and car.owner._id will be hex strings however, if it is used on schema level, for example, CarSchema.plugin(stringify) only: car._id will be hex string but car.owner._id will be ObjectId... if UserSchema.plugin(stringify): car.owner._id will be hex string but car._id will be ObjectId.
    console.log(cars);

    /** cars.owner might be null in case you do not assign the right object ids as new ones are created everytime a document is recorded. Check "owner" property assigned value for await Promise.allSettled([ ... ]) for Car.create({}) */

    await mongoose.disconnect();
}

__run_().catch(console.error);
```

## ✅ Compatibility

-   ✅ Mongoose 8.x
-   ✅ MongoDB >= 4.x

### 🌟 Contributing

Pull requests are welcome! Feel free to open issues or suggestions on improvements, use cases, or performance enhancements.

### 💬 Feedback

If this plugin saves you time or solves your pain, please consider starring the repo and sharing it with the Mongoose community!

`Let me know if you'd like this split into multiple files (e.g. for GitHub pages) or want me to generate a live demo repo or documentation website from it.`

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🫠 Contributors

1. [Ssekandi](https://github.com/SsekandiRaymond) - Author
