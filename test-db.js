const mongoose = require("mongoose");

const uriDirect = "mongodb://sableroshan24_db_user:MvyOPxrLT3ud65dR@ac-iie74x4-shard-00-00.xzexfuv.mongodb.net:27017,ac-iie74x4-shard-00-01.xzexfuv.mongodb.net:27017,ac-iie74x4-shard-00-02.xzexfuv.mongodb.net:27017/ritflix?ssl=true&authSource=admin&retryWrites=true&w=majority";

const testConn = async () => {
  console.log("Testing direct connection...");
  try {
    await mongoose.connect(uriDirect, {
      family: 4,
      serverSelectionTimeoutMS: 5000
    });
    console.log("Connected successfully via Direct string!");
    process.exit(0);
  } catch (err) {
    console.error("Direct failed:", err.message);
    process.exit(1);
  }
};

testConn();
