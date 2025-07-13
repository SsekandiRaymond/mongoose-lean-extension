/** Turns the the _id field type in the document(s) from mongo's ObjectId to hex string
 *
 * @param schema mongoose  schema
 *
 * @example
 * const rename = require("mongoose-lean-extension/plugins/rename");
 * const mongoose = require("mongoose");
 *
 * const schema = new mongoose.Schema({ ... }).plugin(rename) // If you want to have ObjectId typed _id, then exclude the plugin
 * const model = mongoose.model("model", schema)
 *
 * model.findOne().lean() // You may parse false, .lean(false), to stop the plugin from stringifying the _id from BSON ObjectId
 *
 * @author Ssekandi Raymond
 * @link ssekandiraymond01@gmail.com
 */

module.exports = function rename(schema) {
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
                record[newKeyName] = record._id;
                delete record._id;
            }
        });

        next(); // next
    });
};
