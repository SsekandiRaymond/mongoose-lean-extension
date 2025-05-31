// Helper function that stringifies ObjectIds at a specified dot-separated path in an object
module.exports = function applyStringifyAtPath(obj, path) {
    // Split the path string into parts (e.g. 'contributors._id' => ['contributors', '_id'])
    const parts = path.split(".");

    // Define an inner recursive function to traverse and transform nested paths
    function recurse(current, remainingParts) {
        // Exit early if current object is null or undefined
        if (!current) return;

        // Destructure the next key and the rest of the path
        const [key, ...rest] = remainingParts;

        // If current is an array, recursively apply to each item (handles arrays like contributors[])
        if (Array.isArray(current)) {
            for (const item of current) {
                recurse(item, remainingParts); // Don't advance parts — apply same path to each array element
            }
            return;
        }

        // If this is the last part of the path, we expect an ObjectId to convert
        if (rest.length === 0) {
            // Check if the field exists and is an ObjectId (has .toHexString)
            if (
                current[key] &&
                typeof current[key] === "object" &&
                typeof current[key].toHexString === "function"
            ) {
                // Convert ObjectId to string
                current[key] = current[key].toHexString();
            }
        } else {
            // Otherwise, continue recursing into the nested object
            recurse(current[key], rest);
        }
    }

    // Start recursion from the top-level object with the full path parts
    recurse(obj, parts);
};
