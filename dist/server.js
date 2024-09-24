"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// config env
dotenv_1.default.config();
const mongodb_1 = require("mongodb");
const app = (0, express_1.default)();
const mongodb_2 = require("mongodb");
// madelware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// port
const port = process.env.PORT || 5000;
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Hello TreeHUB!!!");
}));
const uri = process.env.Database_Url;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mongodb_2.MongoClient(uri, {
    serverApi: {
        version: mongodb_2.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const Products_DB = client.db("TreeHUB").collection("Products");
            const Orders_Db = client.db("TreeHUB").collection("Orders");
            // Connect the client to the server	(optional starting in v4.7)
            // await client.connect();
            // Send a ping to confirm a successful connection
            // await client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
            // ALL Api  START START START START START START START START START START START START *****************************************
            app.get("/test", (req, res) => __awaiter(this, void 0, void 0, function* () {
                res.send("Hello TreeHUB!!!");
            }));
            app.get("/Product", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { search, category, page, Limit } = req.query;
                    let Query = {};
                    if (search) {
                        Query = { title: { $regex: search, $options: "i" } };
                    }
                    if (category) {
                        Query = { category: category };
                    }
                    const pageNum = parseInt(page);
                    const limitNum = parseInt(Limit);
                    const Result = yield Products_DB.find(Query)
                        .skip((pageNum - 1) * limitNum)
                        .limit(limitNum)
                        .sort({ _id: -1 })
                        .toArray();
                    const totalCount = yield Products_DB.countDocuments(Query);
                    // console.log(Result)
                    return res.status(200).json({
                        total: totalCount, // Total number of documents matching the query
                        Data: Result, // The actual products
                    });
                }
                catch (error) {
                    return res.status(200).json(error);
                }
            }));
            app.get("/Product/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const ProductId = req.params.id;
                    const Result = yield Products_DB.findOne({
                        _id: new mongodb_1.ObjectId(ProductId),
                    });
                    res.send(Result);
                }
                catch (error) {
                    console.log(error);
                }
            }));
            app.post("/Product", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const treeData = req.body;
                    // Check if the product already exists
                    const IsProductExists = yield Products_DB.findOne({
                        title: treeData.title,
                    });
                    if (IsProductExists) {
                        // Send response and return to prevent further execution
                        return res.status(404).json({
                            success: false,
                            message: "This Product Already Exists!",
                        });
                    }
                    // If the product doesn't exist, insert it
                    const Result = yield Products_DB.insertOne(treeData);
                    // Send success response
                    return res.status(200).json({
                        success: true,
                        message: "Product Added Successfully!",
                        data: Result,
                    });
                }
                catch (error) {
                    // Handle errors and send error response
                    return res.status(500).json({
                        success: false,
                        message: "Something Went Wrong!",
                        error: error.message, // Use error.message for more specific error details
                    });
                }
            }));
            app.delete("/Product/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const ProductId = req.params.id;
                    const Result = yield Products_DB.deleteOne({
                        _id: new mongodb_1.ObjectId(ProductId),
                    });
                    return res.status(200).send({
                        success: true,
                        message: "Product Deleted Successfully!",
                        data: Result,
                    });
                }
                catch (error) {
                    return res.status(404).send({
                        success: false,
                        message: "Something is Wrong!",
                        error: error.message,
                    });
                }
            }));
            app.patch("/Product/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const ProductId = req.params.id;
                    const UpdateData = req.body;
                    delete UpdateData._id;
                    // Check if the ProductId is a valid ObjectId
                    if (!mongodb_1.ObjectId.isValid(ProductId)) {
                        return res.status(400).send({
                            success: false,
                            message: "Invalid Product ID",
                        });
                    }
                    const Result = yield Products_DB.updateOne({ _id: new mongodb_1.ObjectId(ProductId) }, { $set: UpdateData });
                    // Check if the product was modified
                    if (Result.matchedCount === 0) {
                        return res.status(404).send({
                            success: false,
                            message: "Product not found!",
                        });
                    }
                    if (Result.modifiedCount === 0) {
                        return res.status(400).send({
                            success: false,
                            message: "No changes were made to the product.",
                        });
                    }
                    res.status(200).send({
                        success: true,
                        message: "Product Updated Successfully!",
                    });
                }
                catch (error) {
                    res.status(500).send({
                        success: false,
                        message: "Something went wrong!",
                        error: error.message,
                    });
                }
            }));
            app.post("/Order", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const OrderData = req.body;
                    console.log(OrderData);
                    // Insert the order data
                    const OrdersResult = yield Orders_Db.insertOne(OrderData);
                    // Update the quantity of each product in the order
                    yield Promise.all(OrderData.OrderProduct.map((data) => __awaiter(this, void 0, void 0, function* () {
                        yield Products_DB.updateOne({ _id: new mongodb_1.ObjectId(data._id) }, { $inc: { quantity: -data.quantity } });
                    })));
                    res.status(200).send({
                        success: true,
                        message: "Order Created successfully!",
                        Data: OrdersResult,
                    });
                }
                catch (error) {
                    res.status(404).send({
                        success: false,
                        message: "Something is Wrong!",
                        error: error.message,
                    });
                }
            }));
            // ALL Api   END END END END END END END END END END END END END END END END END END END END*****************************************
        }
        finally {
            // Ensures that the client will close when you finish/error
            // await client.close();
        }
    });
}
run().catch(console.dir);
app.listen(port, () => {
    console.log("server listening....");
});
