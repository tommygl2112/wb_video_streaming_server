const mongoose = require("mongoose");
const app = require("./app");
const https = require("https");
const fs = require("fs");

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  API_VERSION,
  IP_SERVER
} = require("./constants");

const PORT = process.env.POST || 3977;

// SSL Certification config
//  const options = {
//   key: fs.readFileSync(
//     ""
//   ),
//   cert: fs.readFileSync(
//     ""
//   ),
// };

//HTTP config
// const server = https.createServer(options, app); 

const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/`
    );

    //For HTTPS use "server.listen"
    app.listen(PORT, () => {
      console.log("##### API REST #####");
      console.log("Base endpoint:");
      console.log(`https://${IP_SERVER}:${PORT}/api/${API_VERSION}`);
    });
  } catch (err) {
    console.log("Connection error", err);
  }
};

connectDB();
