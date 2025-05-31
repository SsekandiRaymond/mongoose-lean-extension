const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const stringify_id = require("../plugins/stringify");

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
        schema.plugin(stringify_id);

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
