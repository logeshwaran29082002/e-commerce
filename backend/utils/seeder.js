const products = require("../data/products.json");
const Product = require("../models/productModel");
const dotenv = require("dotenv");
const connectDatabase = require("../config/database");

dotenv.config({ path: "backend/config/config.env" });
connectDatabase();

const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log("Existing products cleared");

    // Insert new products
    await Product.insertMany(products);
    console.log("Products seeded successfully");
  } catch (error) {
    console.error("Error seeding products:", error);
  }
  process.exit();
};

seedProducts();
