const mongoose = require("mongoose");

const connectToDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://jamunatg2006_db_user:MFc7eEr1hxTBgFmy@cluster0.ak2jriw.mongodb.net/mongodb://127.0.0.1:27017/civictrack";
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("error while connecting:", error);
    process.exit(1);
  }
};

module.exports = connectToDB;
