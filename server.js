const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const DB = process.env.DATABASE;
const PORT = process.env.PORT || 9000;
const db =
  "mongodb+srv://snippet:JGux6VW9V4vVXlv8@cluster0.9apof77.mongodb.net/?retryWrites=true&w=majority";
const app = express();
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const s3 = new AWS.S3();
var sharp = require("sharp");

app.use(cors());
//app.use("/images", express.static("images"));

app.use(bodyParser.json());
//const upload = multer({ dest: path.join(__dirname, "/images") });

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

mongoose
  .connect(db, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connection to MongoDB established");
    app.listen(PORT || 9001, () => {
      console.log(`Server running on port ${PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });

var upload = multer({
  limits: { fileSize: 5 * 1000 * 1000 }, // now allowing user uploads up to 10MB
  fileFilter: function (req, file, callback) {
    let fileExtension = file.originalname
      .split(".")
      [file.originalname.split(".").length - 1].toLowerCase(); // convert extension to lower case
    if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
      return callback("Wrong file type", false);
    }
    file.extension = fileExtension.replace(/jpeg/i, "jpg"); // all jpeg images to end .jpg
    callback(null, true);
  },
});

app.post("/api/upload", function (req, res, next) {
  const image = sharp(req.file.path); // path to the stored image
  image
    .metadata() // get image metadata for size
    .then(function (metadata) {
      if (metadata.width > 500) {
        return image.resize({ width: 200 }).toBuffer(); // resize if too big
      } else {
        return image.toBuffer();
      }
    })
    .then(function (data) {
      // upload to s3 storage
      fs.rmSync(req.file.path, { force: true }); // delete the tmp file as now have buffer
      let upload = {
        Key: `${(req.file.originalname.replace(/\W|jpeg|jpg|png/g, ""), "")}.${
          file.extension
        }`, // removes non-word characters from filename
        Body: data,
        Bucket: process.env.BUCKET,
        ACL: "public-read",
        ContentType: req.file.mimetype, // the image type
      };
      s3.upload(upload, function (err, response) {
        if (err) {
          return res
            .status(422)
            .send(
              "There was an error uploading an image to s3: " + err.message
            );
        } else {
          res.send(response.Location); // send the url to the stored file
        }
      });
    })
    .catch(function (err) {
      return res
        .status(422)
        .send("There was an error processing an image: " + err.message);
    });
});

/////////////////////////////////////////////////
// app.post("/api/upload", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   // Extract the file extension from the original file name
//   const fileExtension = path.extname(req.file.originalname);

//   // Generate a new file name with the added extension
//   const newFileName = `${req.file.filename}${fileExtension}`;

//   // Rename the uploaded file to include the extension
//   const newFilePath = path.join(__dirname, "/images", newFileName);
//   fs.renameSync(req.file.path, newFilePath);
//   // Here, you can process the uploaded file as needed (e.g., save it to a database, resize it, etc.)

//   // Assuming you want to send back the uploaded image filename
//   const uploadedImage = req.file.filename;
//   res.json({ image: uploadedImage });
// });
///////////////////////////////////////////////////
// app.post("/api/upload", async (req, res) => {
//   //let filename = req.path.slice(1);
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   // Extract the file extension from the original file name
//   const fileExtension = path.extname(req.file.originalname);

//   // Generate a new file name with the added extension
//   const newFileName = `${req.file.filename}${fileExtension}`;

//   console.log(typeof req.body);

//   await s3
//     .putObject({
//       Body: JSON.stringify(req.body),
//       Bucket: process.env.BUCKET,
//       Key: newFileName,
//     })
//     .promise();

//   res.set("Content-type", "text/plain");
//   res.send("ok").end();
// });

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
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
