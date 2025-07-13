import { Schema } from "mongoose";
export interface MongooseLeanExtensionOptions {
    stringifyKeys?: string[];
    showVersion?: boolean;
    stringifyId?: boolean;
    rename?: string;
}

/**
 * @description
 * Mongoose plugin to extend `.lean()` query results for easier consumption.
 * Automatically stringifies ObjectId values, removes the `__v` field by default, renames `_id` and allows customization of returned document structure.
 *
 * @param {Schema} schema - The Mongoose schema to apply the plugin to.
 *
 * @augments .lean() - Supports options: { stringifyKeys: Array<string>, __v: boolean, _id: boolean, rename: string }
 * @param {boolean} [stringifyId=true] - If false, documents' `_id` remains an ObjectId; if true, `_id` is stringified to hex.
 * @param {boolean} [showVersion=false] - If true, includes the `__v` field in results; if false, removes it.
 * @param {Array<string>} [stringifyKeys=[]] - Array of dot-paths to ObjectId keys to convert to hex strings.
 * @param {string} [rename] - If provided, renames the `_id` field to the given string.
 *
 * @example
 * const mongooseLeanExtension = require("mongoose-lean-extension");
 * const mongoose = require("mongoose");
 * mongoose.plugin(mongooseLeanExtension); // Apply plugin globally
 *
 * const ContributorSchema = new Schema({
 *   username: { type: String, required: true },
 *   languages: [String],
 * });
 * const PackageSchema = new Schema({
 *   name: { type: String, required: true },
 *   contributors: [ContributorSchema],
 * }, { timestamps: true });
 * const Package = mongoose.model("Package", PackageSchema);
 *
 * // Usage: Stringify contributors._id in results
 * const packages = await Package.find().lean({ stringifyKeys: ["contributors._id"] });
 * console.dir(packages, { depth: null });
 *
 * // Example output:
 * [
 *   {
 *     _id: '683a2480b53cfe150c05c5a8',
 *     name: 'express',
 *     contributors: [
 *       {
 *         username: 'tjholowaychuk',
 *         languages: ['JavaScript', 'TypeScript'],
 *         _id: '683a2480b53cfe150c05c5a9'
 *       },
 *       // ...
 *     ],
 *     createdAt: '2025-05-30T21:34:56.981Z',
 *     updatedAt: '2025-05-30T21:34:56.981Z'
 *   },
 *   // ...
 * ]
 *
 * @remarks
 * - No need to manually convert ObjectIds to strings or handle the `__v` field.
 * - Results are ready for direct use in APIs, clients, or serialization.
 *
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 */
declare function mongooseLeanExtension(schema: Schema): void;
export default mongooseLeanExtension;

/** Removes mongoose __v field from query results when using .lean()/**
 * @module mongoose-lean-extension/plugins
 *
 * This module provides a set of Mongoose plugins that enhance the behavior of `.lean()` queries.
 * The plugins allow you to customize the shape and serialization of documents returned from lean queries,
 * making them more suitable for use in APIs and client applications.
 *
 * Plugins included:
 *
 * - `deversion`: Removes the internal Mongoose `__v` version key from lean query results.
 * - `stringifyKeys`: Converts specified ObjectId fields (other than `_id`) to their hex string representation in lean results.
 * - `stringifyId`: Converts the `_id` field from a BSON ObjectId to a hex string in lean results.
 * - `rename`: Renames the `_id` field to a custom key in lean results, as specified in the query options.
 *
 * Usage:
 *
 * ```js
 * const { deversion, stringifyKeys, stringifyId, rename } = require("mongoose-lean-extension/plugins");
 * const mongoose = require("mongoose");
 *
 * // Apply plugins to your schema
 * schema.plugin(deversion);
 * schema.plugin(stringifyKeys);
 * schema.plugin(stringifyId);
 * schema.plugin(rename);
 *
 * // Customize lean query results
 * Model.find().lean({ keys: ["contributors._id"], rename: "customId" });
 * ```
 *
 * These plugins are designed to be composable and can be applied individually or together to any Mongoose schema.
 * They only affect documents returned from `.lean()` queries, leaving hydrated Mongoose documents unchanged.
 *
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 * @see https://mongoosejs.com/docs/tutorials/lean.html
 *
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */
export function deversion(schema: Schema): void;

/** Turns the the _id field type in the document(s) from mongo's ObjectId (if it is) to hex string
 * @module mongoose-lean-extension/plugins
 *
 * This module provides a set of Mongoose plugins that enhance the behavior of `.lean()` queries.
 * The plugins allow you to customize the shape and serialization of documents returned from lean queries,
 * making them more suitable for use in APIs and client applications.
 *
 * Plugins included:
 *
 * - `deversion`: Removes the internal Mongoose `__v` version key from lean query results.
 * - `stringifyKeys`: Converts specified ObjectId fields (other than `_id`) to their hex string representation in lean results.
 * - `stringifyId`: Converts the `_id` field from a BSON ObjectId to a hex string in lean results.
 * - `rename`: Renames the `_id` field to a custom key in lean results, as specified in the query options.
 *
 * Usage:
 *
 * ```js
 * const { deversion, stringifyKeys, stringifyId, rename } = require("mongoose-lean-extension/plugins");
 * const mongoose = require("mongoose");
 *
 * // Apply plugins to your schema
 * schema.plugin(deversion);
 * schema.plugin(stringifyKeys);
 * schema.plugin(stringifyId);
 * schema.plugin(rename);
 *
 * // Customize lean query results
 * Model.find().lean({ keys: ["contributors._id"], rename: "customId" });
 * ```
 *
 * These plugins are designed to be composable and can be applied individually or together to any Mongoose schema.
 * They only affect documents returned from `.lean()` queries, leaving hydrated Mongoose documents unchanged.
 *
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 * @see https://mongoosejs.com/docs/tutorials/lean.html
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */
export function stringifyId(schema: Schema): void;

/** Converts other specified ObjectId keys to hex strings other than the _id field
 * @param schema Mongoose schema
 * @module mongoose-lean-extension/plugins
 *
 * This module provides a set of Mongoose plugins that enhance the behavior of `.lean()` queries.
 * The plugins allow you to customize the shape and serialization of documents returned from lean queries,
 * making them more suitable for use in APIs and client applications.
 *
 * Plugins included:
 *
 * - `deversion`: Removes the internal Mongoose `__v` version key from lean query results.
 * - `stringifyKeys`: Converts specified ObjectId fields (other than `_id`) to their hex string representation in lean results.
 * - `stringifyId`: Converts the `_id` field from a BSON ObjectId to a hex string in lean results.
 * - `rename`: Renames the `_id` field to a custom key in lean results, as specified in the query options.
 *
 * Usage:
 *
 * ```js
 * const { deversion, stringifyKeys, stringifyId, rename } = require("mongoose-lean-extension/plugins");
 * const mongoose = require("mongoose");
 *
 * // Apply plugins to your schema
 * schema.plugin(deversion);
 * schema.plugin(stringifyKeys);
 * schema.plugin(stringifyId);
 * schema.plugin(rename);
 *
 * // Customize lean query results
 * Model.find().lean({ keys: ["contributors._id"], rename: "customId" });
 * ```
 *
 * These plugins are designed to be composable and can be applied individually or together to any Mongoose schema.
 * They only affect documents returned from `.lean()` queries, leaving hydrated Mongoose documents unchanged.
 *
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 * @see https://mongoosejs.com/docs/tutorials/lean.html
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */
export function stringifyKeys(schema: Schema): void;

/** Renames the _id field to a custom key in query results when using .lean()
 * @param schema Mongoose schema
 * @module mongoose-lean-extension/plugins
 *
 * This module provides a set of Mongoose plugins that enhance the behavior of `.lean()` queries.
 * The plugins allow you to customize the shape and serialization of documents returned from lean queries,
 * making them more suitable for use in APIs and client applications.
 *
 * Plugins included:
 *
 * - `deversion`: Removes the internal Mongoose `__v` version key from lean query results.
 * - `stringifyKeys`: Converts specified ObjectId fields (other than `_id`) to their hex string representation in lean results.
 * - `stringifyId`: Converts the `_id` field from a BSON ObjectId to a hex string in lean results.
 * - `rename`: Renames the `_id` field to a custom key in lean results, as specified in the query options.
 *
 * Usage:
 *
 * ```js
 * const { deversion, stringifyKeys, stringifyId, rename } = require("mongoose-lean-extension/plugins");
 * const mongoose = require("mongoose");
 *
 * // Apply plugins to your schema
 * schema.plugin(deversion);
 * schema.plugin(stringifyKeys);
 * schema.plugin(stringifyId);
 * schema.plugin(rename);
 *
 * // Customize lean query results
 * Model.find().lean({ keys: ["contributors._id"], rename: "customId" });
 * ```
 *
 * These plugins are designed to be composable and can be applied individually or together to any Mongoose schema.
 * They only affect documents returned from `.lean()` queries, leaving hydrated Mongoose documents unchanged.
 *
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 * @see https://mongoosejs.com/docs/tutorials/lean.html
 * @author Ssekandi Raymond
 * @contact ssekandiraymond01@gmail.com
 */
export function rename(schema: Schema): void;

// Augment Mongoose to support custom `.lean()` options.
declare module "mongoose" {
    // Match full generic signature of Mongoose v7+/v8+ Query type
    interface Query<
        ResultType,
        DocType,
        THelpers = {},
        RawDocType = unknown,
        QueryOp = "find",
        TDocOverrides = Record<string, never>
    > {
        // Overloaded `.lean()` method with extended options.
        lean<T extends boolean = true>(
            val?: T extends false
                ? false
                : {
                      stringifyKeys?: string[];
                      showVersion?: boolean;
                      stringifyId?: boolean;
                      rename?: string;
                  }
        ): Query<
            T extends false ? DocType : ResultType,
            DocType,
            THelpers,
            RawDocType,
            QueryOp,
            TDocOverrides
        >;
    }
}
