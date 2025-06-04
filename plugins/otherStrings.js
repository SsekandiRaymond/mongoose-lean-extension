const applyStringifyAtPath = require("../util/stringifyPaths");

/** Converts other specified ObjectId fields to hex strings other than the _id field
 *
 * @param schema mongoose  schema
 *
 * @example
 * const stringify_fields = require("mongoose-lean-extension/plugins/otherStrings");
 * const mongoose = require("mongoose");
 * mongoose.plugin(stringify_fields) // Applies plugin to all schemas
 *
 * ...
 *
 * Model.find({}).lean({ fields: ["contributors._id"] }).then(console.log).catch(console.error)
 *
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */

module.exports = function stringify_fields(schema) {
    // Attach a post hook to both 'find' and 'findOne' query methods
    schema.post(["find", "findOne"], function (result, next) {
        try {
            // Retrieve Mongoose query options to check for lean
            const options = this?._mongooseOptions ?? this?.getOptions();

            // If lean is not used or no result was returned (null or undefined), skip processing
            if (!options?.lean || !result) return next();

            // Extract the custom 'fields' array from lean options otherwise parse an empty array
            const fields = options.lean?.fields ?? [];

            // If fields is not a valid array, skip processing
            if (!Array.isArray(fields) || fields.length === 0) return next();

            // Normalize result into an array — ensures .findOne results are processed like an array
            const docs = Array.isArray(result) ? result : [result];

            // Loop through each document returned by the query
            for (const doc of docs) {
                // For each field path (e.g. 'contributors._id'), apply the ObjectId stringifier
                for (const path of fields) {
                    applyStringifyAtPath(doc, path);
                }
            }

            // Signal completion of this middleware
            next();
        } catch (error) {
            next(error);
        }
    });
};
