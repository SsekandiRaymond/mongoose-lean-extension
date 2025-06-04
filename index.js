const applyStringifyAtPath = require("./util/stringifyPaths");

/**
 * @description Extends mongoose .lean() functionality to provide ready-to-use query results.
 *
 * @param schema mongoose  schema
 *
 * @augments .lean() .lean({ fields: [ ], __v: false, _id: true })
 * @param _id If set to false, documents' _id will remain ObjectId typed. Synonymous with, Should documents' _id be hex stringified or not? @default true
 * @param __v If set to true, __v field will appear in documents in results. Synonymous with, should we show the __v field or not? @default false
 * @param fields An array of mongo-like string paths pointing to ObjectId fields to convert to hex strings @default []
 *
 *
 * @example
 * const mongooseLeanExtension = require("mongoose-lean-extension");
 * const mongoose = require("mongoose");
 * mongoose.plugin(mongooseLeanExtension); // Apply plugin to all mongoose schemas
 *
 * const ContributorSchema = new Schema({
 *     username: { type: String, required: true },
 *     languages: [String],
 * });
 * const PackageSchema = new Schema(
 *     {
 *         name: { type: String, required: true },
 *         contributors: [ContributorSchema],
 *     },
 *     { timestamps: true }
 * );
 * const Package = mongoose.model("Package", PackageSchema);
 *
 * const packages = await Package.find().lean({ fields: ["contributors._id"] }); // If "contributors._id" is needed as ObjectId, just pass no parameter in .lean()
 * console.dir(packages, { depth: null });
 *
 * @description Example output results 👇👇👇👇👇
 * @example
 *   [
 *     {
 *       _id: '683a2480b53cfe150c05c5a8',
 *       name: 'express',
 *       contributors: [
 *           {
 *               username: 'tjholowaychuk',
 *               languages: [ 'JavaScript', 'TypeScript' ],
 *               _id: '683a2480b53cfe150c05c5a9'
 *           },
 *           {
 *               username: 'dougwilson',
 *               languages: [ 'JavaScript' ],
 *               _id: '683a2480b53cfe150c05c5aa'
 *           }
 *       ],
 *       createdAt: 2025-05-30T21:34:56.981Z,
 *       updatedAt: 2025-05-30T21:34:56.981Z
 *       },
 *       {
 *           _id: '683a2480b53cfe150c05c5ab',
 *           name: 'react',
 *           contributors: [
 *               {
 *                   username: 'gaearon',
 *                   languages: [ 'JavaScript', 'TypeScript' ],
 *                   _id: '683a2480b53cfe150c05c5ac'
 *               },
 *               {
 *                   username: 'bvaughn',
 *                   languages: [ 'JavaScript' ],
 *                   _id: '683a2480b53cfe150c05c5ad'
 *               }
 *           ],
 *           createdAt: 2025-05-30T21:34:56.983Z,
 *           updatedAt: 2025-05-30T21:34:56.983Z
 *       }
 *  ]
 *
 * @abstract You do not have to deal with converting _id to hex strings at any level or even the mongoose __v field. Data is 100% ready to use out of the box
 *
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */

module.exports = function mongooseLeanExtension(schema) {
    // Attach a post hook to both 'find' and 'findOne' query methods
    schema.post(["find", "findOne"], function (result, next) {
        try {
            // Retrieve Mongoose query options to check for lean
            const options = this?._mongooseOptions ?? this?.getOptions();

            // If lean is not used or no result was returned (null or undefined), skip processing
            if (!options?.lean || !result) return next();

            // Extract the custom 'fields' array, __v and _id booleans from lean options
            const { fields = [], __v = false, _id = true } = options.lean;

            //
            //
            // If fields array has been passed, stringify the ObjectIds in those paths
            if (Array.isArray(fields) && fields?.length) {
                // Normalize result into an array, ensures .findOne results are processed like an array
                const docs = Array.isArray(result) ? result : [result];

                // Loop through each document returned by the query
                for (const doc of docs) {
                    // For each field path (e.g. 'contributors._id'), apply the ObjectId stringifier
                    for (const path of fields) {
                        applyStringifyAtPath(doc, path);
                    }
                }
            }

            // .find() query results are always arrays but not .findOne()
            // Next line turns .findOne() query results to an array
            if (!Array.isArray(result)) result = [result];

            //
            //
            // For deversion; if __v is true, mongoose __v will be included in the query results
            if (!__v) {
                // Looping through results array to delete __v field if it exists
                result.forEach((record) => {
                    if (Number.isInteger(record?.__v)) delete record.__v;
                });
            }

            //
            //
            // For stringifying _id; if _id is false, mongo's index field _id will not be stringified rather remain with type ObjectId
            if (_id) {
                // Looping through results array to (hex) stringify the _id field from ObjectId
                result.forEach((record) => {
                    record._id = record?._id?.toString();
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
