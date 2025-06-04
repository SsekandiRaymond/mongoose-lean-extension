/** Removes mongoose __v field from query results when using .lean()
 * @abstract I mean, why would __v field be in query results yet mongoose is not tracking changes.
 *
 * @param schema mongoose  schema
 *
 * @example
 * const deversion = require("mongoose-lean-extension/plugins/deversion");
 * const mongoose = require("mongoose");
 * mongoose.plugin(deversion);
 *
 * ...
 *
 * await Model.find().lean() // Similar results as await Model.find().select("-__v").lean()
 *
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */

module.exports = function deversion(schema) {
    /** Mongo .find() or .findOne() query */
    schema.post(["find", "findOne"], function (result, next) {
        // Getting all query options to check for lean option
        const options = this?._mongooseOptions ?? this?.getOptions();

        // If lean option is not on the query just proceed
        // Similarly, if no document has been found (null for .findOne()), proceed
        if (!options?.lean || !result) return next();

        // .find() query results are always arrays but not .findOne()
        // Next line turns .findOne() query results to an array
        if (!Array.isArray(result)) result = [result];

        // Looping through results array to delete __v field if it exists
        result.forEach((record) => {
            if (Number.isInteger(record?.__v)) delete record.__v;
        });

        // Obvious, isn't it?
        next();
    });
};
