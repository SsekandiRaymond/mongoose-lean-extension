const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const stringify_fields = require("../plugins/otherStrings");

describe("stringify_fields plugin", () => {
    let mongo;
    let PackageModel;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await mongoose.connect(uri);

        const ContributorSchema = new mongoose.Schema({
            username: String,
            _id: mongoose.Schema.Types.ObjectId,
        });

        const PackageSchema = new mongoose.Schema({
            name: String,
            contributors: [ContributorSchema],
        });

        PackageSchema.plugin(stringify_fields);
        PackageModel = mongoose.model("Package", PackageSchema);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    beforeEach(async () => {
        await PackageModel.deleteMany({});
    });

    test("should stringify ObjectIds at given nested paths", async () => {
        const pkg = await PackageModel.create({
            name: "express",
            contributors: [
                { username: "tjholowaychuk", _id: new mongoose.Types.ObjectId() },
                { username: "dougwilson", _id: new mongoose.Types.ObjectId() },
            ],
        });

        const result = await PackageModel.find().lean({
            fields: ["contributors._id"],
        });

        expect(Array.isArray(result)).toBe(true);
        for (const contributor of result[0].contributors) {
            expect(typeof contributor._id).toBe("string");
            expect(mongoose.Types.ObjectId.isValid(contributor._id)).toBe(true);
        }
    });

    test("should not stringify if fields option is missing", async () => {
        const pkg = await PackageModel.create({
            name: "react",
            contributors: [{ username: "gaearon", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find().lean();
        expect(typeof result[0].contributors[0]._id).toBe("object");
        expect(result[0].contributors[0]._id.constructor.name).toBe("ObjectId");
    });

    test("should not stringify if .lean() is not used", async () => {
        const pkg = await PackageModel.create({
            name: "vue",
            contributors: [{ username: "evan", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find();
        expect(typeof result[0].contributors[0]._id).toBe("object");
        expect(result[0].contributors[0]._id.constructor.name).toBe("ObjectId");
    });

    test("should handle .findOne() with null result gracefully", async () => {
        const result = await PackageModel.findOne({ name: "nonexistent" }).lean({
            fields: ["contributors._id"],
        });

        expect(result).toBeNull(); // Should not crash
    });

    test("should handle empty fields array safely", async () => {
        const pkg = await PackageModel.create({
            name: "angular",
            contributors: [{ username: "misko", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find().lean({ fields: [] });
        expect(typeof result[0].contributors[0]._id).toBe("object");
        expect(result[0].contributors[0]._id.constructor.name).toBe("ObjectId");
    });
});
