const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { rename, deversion, stringifyId, stringifyKeys } = require("../plugins");

describe("rename plugin", () => {
    let mongo;
    let TestModel;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    beforeEach(async () => {
        // Reset model to avoid overwrite errors
        delete mongoose.models.RenameTest;

        const TestSchema = new mongoose.Schema({
            name: String,
        });

        TestSchema.plugin(rename);
        TestModel = mongoose.model("RenameTest", TestSchema);

        await TestModel.deleteMany({});
    });

    test("should rename _id to custom key in lean results", async () => {
        const doc = await TestModel.create({ name: "Alpha" });

        const result = await TestModel.find().lean({ rename: "customId" });

        expect(result[0]._id).toBeUndefined();
        expect(typeof result[0].customId).toBe("string");
        expect(result[0].customId).toBe(doc._id.toString());
    });

    test("should not rename _id if rename option is missing", async () => {
        const doc = await TestModel.create({ name: "Beta" });

        const result = await TestModel.find().lean();

        expect(result[0]._id).toBeDefined();
        expect(result[0]._id.toString()).toBe(doc._id.toString());
    });

    test("should not fail if result is null from .findOne()", async () => {
        const result = await TestModel.findOne({ name: "DoesNotExist" }).lean({
            rename: "renamedId",
        });

        expect(result).toBeNull(); // Gracefully handles no result
    });

    test("should rename _id in .findOne().lean()", async () => {
        const doc = await TestModel.create({ name: "Gamma" });

        const result = await TestModel.findOne({ name: "Gamma" }).lean({ rename: "idKey" });

        expect(result._id).toBeUndefined();
        expect(result.idKey).toBe(doc._id.toString());
    });

    test("should skip rename if not using .lean()", async () => {
        const doc = await TestModel.create({ name: "Delta" });

        const result = await TestModel.findOne({ name: "Delta" });

        expect(result._id).toBeDefined();
        expect(result._id.toString()).toBe(doc._id.toString());
        expect(result.idKey).toBeUndefined();
    });
});

describe("deversion plugin", () => {
    let mongo;
    let TestModel;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    beforeEach(async () => {
        delete mongoose.models.Test;

        const TestSchema = new mongoose.Schema({ name: String });
        TestSchema.plugin(deversion);
        TestModel = mongoose.model("Test", TestSchema);

        await TestModel.deleteMany({});
    });

    test("should remove __v from .lean() results", async () => {
        await TestModel.create({ name: "Alpha" });
        const result = await TestModel.find().lean();

        expect(result[0].__v).toBeUndefined(); // ✅ __v removed
    });

    test("should not remove __v if .lean() is not used", async () => {
        await TestModel.create({ name: "Beta" });
        const result = await TestModel.find();

        expect(result[0].__v).toBeDefined();
        expect(typeof result[0].__v).toBe("number");
    });

    test("should not fail if result is null (from .findOne())", async () => {
        const result = await TestModel.findOne({ name: "DoesNotExist" }).lean();
        expect(result).toBeNull(); // ✅ gracefully handled
    });

    test("should do nothing if __v is already missing", async () => {
        delete mongoose.models.NoVersion;
        // delete mongoose.modelSchemas.NoVersion;

        const SchemaNoVersion = new mongoose.Schema({ name: String }, { versionKey: false });
        SchemaNoVersion.plugin(deversion);
        const NoVersionModel = mongoose.model("NoVersion", SchemaNoVersion);

        await NoVersionModel.create({ name: "Gamma" });
        const result = await NoVersionModel.find().lean();

        expect(result[0].__v).toBeUndefined(); // ✅ still safe
    });
});

describe("stringifyKeys plugin", () => {
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

        PackageSchema.plugin(stringifyKeys);
        PackageModel = mongoose.model("Package", PackageSchema);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    beforeEach(async () => {
        await PackageModel.deleteMany({});
    });

    test("should stringify nested ObjectIds using 'stringifyKeys' option", async () => {
        await PackageModel.create({
            name: "express",
            contributors: [
                { username: "tjholowaychuk", _id: new mongoose.Types.ObjectId() },
                { username: "dougwilson", _id: new mongoose.Types.ObjectId() },
            ],
        });

        const result = await PackageModel.find().lean({
            stringifyKeys: ["contributors._id"],
        });

        expect(Array.isArray(result)).toBe(true);
        for (const contributor of result[0].contributors) {
            expect(typeof contributor._id).toBe("string");
            expect(mongoose.Types.ObjectId.isValid(contributor._id)).toBe(true);
        }
    });

    test("should not stringify if 'stringifyKeys' is not provided", async () => {
        await PackageModel.create({
            name: "react",
            contributors: [{ username: "gaearon", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find().lean();
        const id = result[0].contributors[0]._id;

        expect(typeof id).toBe("object");
        expect(id.constructor.name).toBe("ObjectId");
    });

    test("should not stringify if .lean() is not used", async () => {
        await PackageModel.create({
            name: "vue",
            contributors: [{ username: "evan", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find();
        const id = result[0].contributors[0]._id;

        expect(typeof id).toBe("object");
        expect(id.constructor.name).toBe("ObjectId");
    });

    test("should not throw error if result is null in findOne()", async () => {
        const result = await PackageModel.findOne({ name: "nonexistent" }).lean({
            stringifyKeys: ["contributors._id"],
        });

        expect(result).toBeNull();
    });

    test("should not stringify if stringifyKeys is an empty array", async () => {
        await PackageModel.create({
            name: "angular",
            contributors: [{ username: "misko", _id: new mongoose.Types.ObjectId() }],
        });

        const result = await PackageModel.find().lean({
            stringifyKeys: [],
        });

        const id = result[0].contributors[0]._id;
        expect(typeof id).toBe("object");
        expect(id.constructor.name).toBe("ObjectId");
    });
});

describe("stringify_id plugin", () => {
    let mongo;
    let TestModel;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const uri = mongo.getUri();
        await mongoose.connect(uri);

        const schema = new mongoose.Schema({
            name: String,
        });

        schema.plugin(stringifyId); // ✅ Correct plugin name
        TestModel = mongoose.model("StringifyTest", schema);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongo.stop();
    });

    beforeEach(async () => {
        await TestModel.deleteMany({});
    });

    test("should stringify _id in .lean() query", async () => {
        const doc = await TestModel.create({ name: "Alpha" });

        const result = await TestModel.find().lean();
        expect(typeof result[0]._id).toBe("string");
        expect(result[0]._id).toBe(doc._id.toString());
    });

    test("should not stringify _id if .lean(false) is used", async () => {
        const doc = await TestModel.create({ name: "Beta" });

        const result = await TestModel.find().lean(false);
        expect(result[0]._id.constructor.name).toBe("ObjectId");
    });

    test("should not stringify _id if .lean() is not used", async () => {
        const doc = await TestModel.create({ name: "Gamma" });

        const result = await TestModel.find();
        expect(result[0]._id.constructor.name).toBe("ObjectId");
    });

    test("should not crash if result is null from .findOne()", async () => {
        const result = await TestModel.findOne({ name: "DoesNotExist" }).lean();
        expect(result).toBeNull();
    });

    test("should stringify _id for .findOne().lean()", async () => {
        const doc = await TestModel.create({ name: "Delta" });

        const result = await TestModel.findOne({ name: "Delta" }).lean();
        expect(typeof result._id).toBe("string");
        expect(result._id).toBe(doc._id.toString());
    });
});
