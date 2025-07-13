// Helper function that stringifies ObjectIds at a specified dot-separated path in an object
module.exports = function applyStringifyAtPath(obj, path) {
    const parts = path.split(".");

    // Define an inner recursive function to traverse and transform nested paths
    function recurse(current, remainingParts) {
        if (!current) return;

        const [key, ...rest] = remainingParts;

        // If current is an array, recursively apply to each item (handles arrays like contributors[])
        if (Array.isArray(current)) {
            for (const item of current) {
                recurse(item, remainingParts);
            }
            return;
        }

        // If this is the last part of the path, we expect an ObjectId to convert
        if (rest.length === 0) {
            if (
                current[key] &&
                typeof current[key] === "object" &&
                typeof current[key]?.toHexString === "function"
            ) {
                current[key] = current[key].toHexString();
            }
        } else {
            recurse(current[key], rest);
        }
    }

    // Start recursion from the object with the full path parts
    recurse(obj, parts);
};
