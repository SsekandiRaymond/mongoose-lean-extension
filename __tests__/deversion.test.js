const { MongoMemoryServer } = require("mongodb-memory-server");
const deversion = require("../plugins/deversion");
const mongoose = require("mongoose");

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
        // Clean up existing models to avoid overwrite error in watch mode
        delete mongoose?.models?.Test;
        delete mongoose?.modelSchemas?.Test;

        const TestSchema = new mongoose.Schema({
            name: String,
        });

        TestSchema.plugin(deversion);
        TestModel = mongoose.model("Test", TestSchema);

        await TestModel.deleteMany({});
    });

    test("should remove __v from .lean() results", async () => {
        await TestModel.create({ name: "Alpha" });

        const result = await TestModel.find().lean();
        expect(result[0].__v).toBeUndefined();
    });

    test("should not remove __v if .lean() is not used", async () => {
        await TestModel.create({ name: "Beta" });

        const result = await TestModel.find();
        expect(result[0].__v).toBeDefined();
        expect(typeof result[0].__v).toBe("number");
    });

    test("should not fail if result is null (from .findOne())", async () => {
        const result = await TestModel.findOne({ name: "DoesNotExist" }).lean();
        expect(result).toBeNull(); // plugin should not throw
    });

    test("should do nothing if __v is already missing", async () => {
        delete mongoose?.models?.NoVersion;
        delete mongoose?.modelSchemas?.NoVersion;

        const SchemaNoVersion = new mongoose.Schema({ name: String }, { versionKey: false });
        SchemaNoVersion.plugin(deversion);

        const NoVersionModel = mongoose.model("NoVersion", SchemaNoVersion);
        await NoVersionModel.create({ name: "Gamma" });

        const result = await NoVersionModel.find().lean();
        expect(result[0].__v).toBeUndefined(); // should still not exist
    });
});
