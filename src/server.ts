import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
// config env
dotenv.config();
import { ObjectId } from "mongodb";
const app = express();

import { MongoClient, ServerApiVersion } from "mongodb";

// madelware
app.use(express.json());
app.use(cors());

// port
const port = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.send("Hello TreeHUB!!!");
});

const uri = process.env.Database_Url;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient((uri as string), {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const Products_DB = client.db("TreeHUB").collection("Products");
    const Orders_Db = client.db("TreeHUB").collection("Orders");

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // ALL Api  START START START START START START START START START START START START *****************************************

    app.get("/test", async (req, res) => {
      res.send("Hello TreeHUB!!!");
    });

    app.get("/Product", async (req: Request, res: Response) => {
      try {
        const { search, category, page, Limit }: any = req.query;

        let Query = {};

        if (search) {
          Query = { title: { $regex: search, $options: "i" } };
        }

        if (category) {
          Query = { category: category };
        }

        const pageNum: number = parseInt(page);
        const limitNum = parseInt(Limit);

        const Result = await Products_DB.find(Query)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .sort({ _id: -1 })
          .toArray();
        const totalCount = await Products_DB.countDocuments(Query);
        // console.log(Result)

        return res.status(200).json({
          total: totalCount, // Total number of documents matching the query
          Data: Result, // The actual products
        });
      } catch (error) {
        return res.status(200).json(error);
      }
    });

    app.get("/Product/:id", async (req, res) => {
      try {
        const ProductId = req.params.id;

        const Result = await Products_DB.findOne({
          _id: new ObjectId(ProductId),
        });

        res.send(Result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/Product", async (req, res) => {
      try {
        const treeData = req.body;

        // Check if the product already exists
        const IsProductExists = await Products_DB.findOne({
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
        const Result = await Products_DB.insertOne(treeData);

        // Send success response
        return res.status(200).json({
          success: true,
          message: "Product Added Successfully!",
          data: Result,
        });
      } catch (error: any) {
        // Handle errors and send error response
        return res.status(500).json({
          success: false,
          message: "Something Went Wrong!",
          error: error.message, // Use error.message for more specific error details
        });
      }
    });

    app.delete("/Product/:id", async (req, res) => {
      try {
        const ProductId = req.params.id;

        const Result = await Products_DB.deleteOne({
          _id: new ObjectId(ProductId),
        });

        return res.status(200).send({
          success: true,
          message: "Product Deleted Successfully!",
          data: Result,
        });
      } catch (error: any) {
        return res.status(404).send({
          success: false,
          message: "Something is Wrong!",
          error: error.message,
        });
      }
    });

    app.patch("/Product/:id", async (req, res) => {
      try {
        const ProductId = req.params.id;
        const UpdateData = req.body;

        delete UpdateData._id;

        // Check if the ProductId is a valid ObjectId
        if (!ObjectId.isValid(ProductId)) {
          return res.status(400).send({
            success: false,
            message: "Invalid Product ID",
          });
        }

        const Result = await Products_DB.updateOne(
          { _id: new ObjectId(ProductId) },
          { $set: UpdateData }
        );

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
      } catch (error: any) {
        res.status(500).send({
          success: false,
          message: "Something went wrong!",
          error: error.message,
        });
      }
    });

    app.post("/Order", async (req, res) => {
      try {
        const OrderData = req.body;
        console.log(OrderData);

        // Insert the order data
        const OrdersResult = await Orders_Db.insertOne(OrderData);

        // Update the quantity of each product in the order
        await Promise.all(
          OrderData.OrderProduct.map(async (data: any) => {
            await Products_DB.updateOne(
              { _id: new ObjectId(data._id) },
              { $inc: { quantity: -data.quantity } }
            );
          })
        );

        res.status(200).send({
          success: true,
          message: "Order Created successfully!",
          Data: OrdersResult,
        });
      } catch (error: any) {
        res.status(404).send({
          success: false,
          message: "Something is Wrong!",
          error: error.message,
        });
      }
    });

    // ALL Api   END END END END END END END END END END END END END END END END END END END END*****************************************
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("server listening....");
});
