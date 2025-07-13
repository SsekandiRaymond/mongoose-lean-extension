const mongoose = require("mongoose");
const applyStringifyAtPath = require("./util/stringifyPaths");

module.exports = function mongooseLeanExtension(schema) {
    // Attach a post hook to both 'find' and 'findOne' query methods
    schema.post(["find", "findOne"], function (result, next) {
        try {
            // Retrieve Mongoose query options to check for lean
            const options = this?._mongooseOptions ?? this?.getOptions();
            // If lean is not used or no result was returned (null or undefined), skip processing
            if (!options?.lean || !result) return next();
            // Extract the custom 'stringifyKeys' array, __v and _id booleans from lean options
            const {
                stringifyKeys = [],
                showVersion = false,
                stringifyId = true,
                rename,
            } = options.lean;
            // If stringifyKeys array has been passed, stringify the ObjectIds in those paths
            if (Array.isArray(stringifyKeys) && stringifyKeys?.length) {
                // Normalize result into an array, ensures .findOne results are processed like an array
                const docs = Array.isArray(result) ? result : [result];

                // Loop through each document returned by the query
                for (const doc of docs) {
                    // For each field path (e.g. 'contributors._id'), apply the ObjectId stringifier
                    for (const path of stringifyKeys) {
                        applyStringifyAtPath(doc, path);
                    }
                }
            }
            // .find() query results are always arrays but not .findOne()
            // Next line turns .findOne() query results to an array
            if (!Array.isArray(result)) result = [result];
            // For deversion; if showVersion is true, mongoose __v will be included in the query results
            if (!showVersion) {
                // Looping through results array to delete __v field if it exists
                result.forEach((record) => {
                    if (Number.isInteger(record?.__v)) delete record.__v;
                });
            }
            // For stringifying _id; if stringifyId is false, mongo's index field _id will not be stringified rather remain with type ObjectId
            if (stringifyId || rename) {
                result.forEach((record) => {
                    const id = record?._id;
                    if (id && id instanceof mongoose.Types.ObjectId) {
                        record._id = id.toString();
                    }
                    // For naming _id field something else
                    // If rename string is provided, mongo's index field _id will be renamed to the given value
                    if (rename) {
                        record[rename] = record._id;
                        delete record._id;
                    }
                });
            }
            // Signal successful completion of this middleware / plugin
            next();
        } catch (error) {
            // Signal incompletion of this middleware with an error
            next(error);
        }
    });
};
