const mongoose = require("mongoose");
const mongooseLeanExtension = require("../index");
const applyStringifyAtPath = require("../util/stringifyPaths");

// Setting-up in-memory MongoDB for testing
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

// Defining reusable test schemas and models
const ContributorSchema = new mongoose.Schema({
    username: String,
    languages: [String],
});
const PackageSchema = new mongoose.Schema(
    {
        name: String,
        contributors: [ContributorSchema],
    },
    { timestamps: true }
);

PackageSchema.plugin(mongooseLeanExtension);
const Package = mongoose.model("Package", PackageSchema);

// Testing mongooseLeanExtension
describe("mongooseLeanExtension plugin", () => {
    let savedPackages;

    beforeEach(async () => {
        await Package.deleteMany({});
        savedPackages = await Package.create([
            {
                name: "express",
                contributors: [
                    { username: "tjholowaychuk", languages: ["JavaScript"] },
                    { username: "dougwilson", languages: ["JavaScript"] },
                ],
            },
            {
                name: "react",
                contributors: [{ username: "gaearon", languages: ["JavaScript", "TypeScript"] }],
            },
        ]);
    });

    test("should stringify top-level _id by default and remove __v", async () => {
        const result = await Package.find().lean();
        expect(result).toBeInstanceOf(Array);
        result.forEach((pkg) => {
            expect(typeof pkg._id).toBe("string"); // _id stringified
            expect(pkg).not.toHaveProperty("__v"); // __v removed
        });
    });

    test("should preserve ObjectId _id if _id option is false", async () => {
        const result = await Package.find().lean({ _id: false });
        result.forEach((pkg) => {
            expect(mongoose.isValidObjectId(pkg._id)).toBe(true); // _id remains ObjectId
        });
    });

    test("should include __v if __v option is true", async () => {
        const result = await Package.find().lean({ __v: true });
        result.forEach((pkg) => {
            expect(pkg).toHaveProperty("__v"); // __v is present
        });
    });

    test("should stringify nested ObjectId fields using 'fields' option", async () => {
        const packages = await Package.find().lean({ fields: ["contributors._id"] });
        packages.forEach((pkg) => {
            pkg.contributors.forEach((contributor) => {
                expect(typeof contributor._id).toBe("string");
            });
        });
    });

    test("should not throw when fields array is empty", async () => {
        const packages = await Package.find().lean({ fields: [] });
        expect(packages.length).toBeGreaterThan(0);
    });

    test("should work with .findOne and apply all options", async () => {
        const pkg = await Package.findOne({ name: "express" }).lean({
            fields: ["contributors._id"],
            _id: true,
            __v: false,
        });
        expect(typeof pkg._id).toBe("string");
        expect(pkg).not.toHaveProperty("__v");
        pkg.contributors.forEach((c) => {
            expect(typeof c._id).toBe("string");
        });
    });
});

// applyStringifyAtPath test
describe("applyStringifyAtPath", () => {
    test("should stringify nested ObjectId fields", () => {
        const mockObjectId = new mongoose.Types.ObjectId();
        const doc = {
            contributors: [{ _id: mockObjectId }, { _id: new mongoose.Types.ObjectId() }],
        };

        applyStringifyAtPath(doc, "contributors._id");

        expect(typeof doc.contributors[0]._id).toBe("string");
        expect(doc.contributors[0]._id).toBe(mockObjectId.toHexString());
    });

    test("should not fail on missing path", () => {
        const doc = { contributors: [{}] };
        expect(() => applyStringifyAtPath(doc, "contributors._id")).not.toThrow();
    });
});
