const mongoose = require("mongoose");
const mongooseLeanExtension = require("../index");
const applyStringifyAtPath = require("../util/stringifyPaths");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

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

describe("mongooseLeanExtension plugin", () => {
    beforeEach(async () => {
        await Package.deleteMany({});
        await Package.insertMany([
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
        result.forEach((pkg) => {
            expect(typeof pkg._id).toBe("string");
            expect(pkg).not.toHaveProperty("__v");
        });
    });

    test("should preserve ObjectId _id if stringifyId is false", async () => {
        const result = await Package.find().lean({ stringifyId: false });
        result.forEach((pkg) => {
            expect(mongoose.isValidObjectId(pkg._id)).toBe(true);
        });
    });

    test("should include __v if showVersion is true", async () => {
        const result = await Package.find().lean({ showVersion: true });
        result.forEach((pkg) => {
            expect(pkg).toHaveProperty("__v");
        });
    });

    test("should stringify nested ObjectId fields using stringifyKeys", async () => {
        const result = await Package.find().lean({ stringifyKeys: ["contributors._id"] });
        result.forEach((pkg) => {
            pkg.contributors.forEach((contributor) => {
                expect(typeof contributor._id).toBe("string");
            });
        });
    });

    test("should not throw when stringifyKeys array is empty", async () => {
        const result = await Package.find().lean({ stringifyKeys: [] });
        expect(result.length).toBeGreaterThan(0);
    });

    test("should work with .findOne and apply all options", async () => {
        const result = await Package.findOne({ name: "express" }).lean({
            stringifyId: true,
            stringifyKeys: ["contributors._id"],
            showVersion: false,
        });

        expect(typeof result._id).toBe("string");
        expect(result).not.toHaveProperty("__v");

        result.contributors.forEach((c) => {
            expect(typeof c._id).toBe("string");
        });
    });

    test("should rename _id field if rename is specified", async () => {
        const result = await Package.find().lean({ rename: "uid" });
        result.forEach((pkg) => {
            expect(pkg).not.toHaveProperty("_id");
            expect(pkg).toHaveProperty("uid");
            expect(typeof pkg.uid).toBe("string");
        });
    });
});

describe("applyStringifyAtPath utility", () => {
    test("should stringify nested ObjectId fields", () => {
        const mockId = new mongoose.Types.ObjectId();
        const doc = {
            contributors: [{ _id: mockId }, { _id: new mongoose.Types.ObjectId() }],
        };

        applyStringifyAtPath(doc, "contributors._id");

        doc.contributors.forEach((c, i) => {
            expect(typeof c._id).toBe("string");
        });
        expect(doc.contributors[0]._id).toBe(mockId.toHexString());
    });

    test("should not throw if nested field is missing", () => {
        const doc = { contributors: [{}] };
        expect(() => applyStringifyAtPath(doc, "contributors._id")).not.toThrow();
        expect(typeof doc.contributors[0]._id).toBe("undefined");
    });

    test("should not crash if document is not structured", () => {
        const doc = null;
        expect(() => applyStringifyAtPath(doc, "contributors._id")).not.toThrow();
    });
});
