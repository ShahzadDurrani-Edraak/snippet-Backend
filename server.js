const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const DB = process.env.DATABASE;
const PORT = process.env.PORT || 3001;
const io = new Server(server, {
  cors: "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

const app = express();

app.use("/images", express.static("images"));

app.use(bodyParser.json());
app.use(cors());
app.set(io);
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST"],
//     credentials: false,
//     origin: true,
//   })
// );
const upload = multer({ dest: path.join(__dirname, "/images") });

const dataFile = "data.json";

const db =
  "mongodb+srv://snippet:JGux6VW9V4vVXlv8@cluster0.9apof77.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connection Succesfull");
  })
  .catch((err) => {
    console.log("no connection", err);
  });

// Assuming you have defined a schema for your data
const jsonDataSchema = new mongoose.Schema({
  id: Number,
  image: String,
  title: String,
  description: String,
  category: String,
  codes: [
    {
      id: Number,
      language: String,
      code: String,
    },
  ],
});

// Assuming you have created a model based on the schema
const JsonData = mongoose.model("JsonData", jsonDataSchema);

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Extract the file extension from the original file name
  const fileExtension = path.extname(req.file.originalname);

  // Generate a new file name with the added extension
  const newFileName = `${req.file.filename}${fileExtension}`;

  // Rename the uploaded file to include the extension
  const newFilePath = path.join(__dirname, "/images", newFileName);
  fs.renameSync(req.file.path, newFilePath);
  // Here, you can process the uploaded file as needed (e.g., save it to a database, resize it, etc.)

  // Assuming you want to send back the uploaded image filename
  const uploadedImage = req.file.filename;
  res.json({ image: uploadedImage });
});

app.get("/api/data", (req, res) => {
  JsonData.find()
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

app.post("/api/data", (req, res) => {
  const newData = new JsonData(req.body);

  newData
    .save()
    .then((savedData) => {
      res.status(200).json({
        message: "Data saved successfully",
        data: savedData,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});
// Change it to the desired port number
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
