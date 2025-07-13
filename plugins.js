const mongoose = require("mongoose");
const applyStringifyAtPath = require("./util/stringifyPaths.js");

module.exports.deversion = function (schema) {
    /** Mongo .find() or .findOne() query */
    schema.post(["find", "findOne"], function (result, next) {
        // Getting all query options to check for lean option
        const options = this?._mongooseOptions ?? this?.getOptions?.();

        // If lean option is not on the query just proceed
        // Similarly, if no document has been found (null for .findOne()), proceed
        if (!options?.lean || !result) return next();

        // .find() query results are always arrays but not .findOne()
        // Next line turns .findOne() query results to an array
        if (!Array.isArray(result)) result = [result];

        // Looping through results array to delete __v field if it exists
        result.forEach((record) => {
            if (Number.isInteger(record?.__v)) {
                delete record?.__v;
            }
        });
        // Obvious, isn't it?
        next();
    });
};

module.exports.stringifyKeys = function (schema) {
    // Attach a post hook to both 'find' and 'findOne' query methods
    schema.post(["find", "findOne"], function (result, next) {
        try {
            // Retrieve Mongoose query options to check for lean
            const options = this?._mongooseOptions ?? this?.getOptions?.();

            // If lean is not used or no result was returned (null or undefined), skip processing
            if (!options?.lean || !result) return next();

            // Extract the custom 'stringifyKeys' array from lean options otherwise parse an empty array
            const keys = options.lean?.stringifyKeys ?? [];

            // If keys is not a valid array, skip processing
            if (!Array.isArray(keys) || keys.length === 0) return next();

            // Normalize result into an array — ensures .findOne results are processed like an array
            const docs = Array.isArray(result) ? result : [result];

            // Loop through each document returned by the query
            for (const doc of docs) {
                // For each field path (e.g. 'contributors._id'), apply the ObjectId stringifier
                for (const path of keys) {
                    applyStringifyAtPath(doc, path);
                }
            }

            // Signal completion of this plugin middleware
            next();
        } catch (error) {
            next(error);
        }
    });
};

module.exports.stringifyId = function (schema) {
    /** Mongo .find() or .findOne() query */
    schema.post(["find", "findOne"], function (result, next) {
        // Getting all query options to check for lean option
        const options = this?._mongooseOptions ?? this?.getOptions?.();

        // If lean option is not the query just proceed
        // Similarly, if no document has been found (null for .findOne()), proceed
        if (!options?.lean || !result) return next();

        // .find() query results are always arrays but not .findOne()
        // Next line turns .findOne() results to an array
        if (!Array.isArray(result)) result = [result];

        // Looping through results array to (hex) stringify the _id field from ObjectId
        result.forEach((record) => {
            if (record?._id && record._id instanceof mongoose.Types.ObjectId) {
                record._id = record._id.toString();
            }
        });

        // Obvious, isn't it?
        next();
    });
};

module.exports.rename = function (schema) {
    /** Mongo .find() or .findOne() query */
    schema.post(["find", "findOne"], function (result, next) {
        // Getting all query options to check for lean option
        const options = this?._mongooseOptions ?? this?.getOptions();

        // If lean option is not the query just proceed
        // Similarly, if no document has been found (null for .findOne()), proceed
        if (!options?.lean || !result) return next(); // See you next time when you want to name _id something else

        const newKeyName = options.lean?.rename;
        if (!newKeyName) return next(); // Bye bye

        // .find() query results are always arrays but not .findOne()
        // Next line turns .findOne() results to an array
        if (!Array.isArray(result)) result = [result];

        // Looping through results array to (hex) stringify the _id field from ObjectId
        result.forEach((record) => {
            if (record?._id) {
                record[newKeyName] = record._id.toString();
                delete record._id;
            }
        });

        next(); // next
    });
};
