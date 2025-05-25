const mongoose = require("mongoose");
const fs = require("fs");
const Enrollment = require("../models/Enrollment");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

(async () => {
   await mongoose.connect(process.env.DB_URI, {});
  const data = await Enrollment.find({});
  fs.writeFileSync("./Json/enrollment.json", JSON.stringify(data, null, 2));
  console.log("Export thành công!");
  await mongoose.disconnect();
})();
