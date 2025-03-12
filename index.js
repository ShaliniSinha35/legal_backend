const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const dotenv = require("dotenv");
const PORT = process.env.port || 3005;
const fs = require("fs");
const path = require("path");
const multer = require("multer");
app.use(express.static("public"));
app.use(express.json());
dotenv.config();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "justice_legal",
  timezone: "Asia/Kolkata",
});

function handleDisconnect() {
  connection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting MySQL connection:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("Connected to MySQL");

      connection.release();
    }
  });
}

handleDisconnect();

function getCurrentDateTime() {
  let date_time = new Date();
  let date = ("0" + date_time.getDate()).slice(-2);
  let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
  let year = date_time.getFullYear();
  let hours = ("0" + date_time.getHours()).slice(-2);
  let minutes = ("0" + date_time.getMinutes()).slice(-2);
  let seconds = ("0" + date_time.getSeconds()).slice(-2);
  let cdate_time =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  return cdate_time;
}

app.use("/upload", express.static(path.join(__dirname, "..", "upload")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const imgName = req.query.imgName;

    if (!imgName) {
      return cb(new Error("imgName query parameter is required"), null);
    }

    let uploadPath;
    uploadPath = path.join(__dirname, "..", "upload");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

app.post("/legal/uploadImage", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  // Construct the image URL
  let imageUrl = `${req.protocol}://${
    req.get("X-Forwarded-Host") || req.get("host")
  }/upload/${req.file.originalname}`;

  console.log(imageUrl);

  return res.status(200).send({
    message: "File uploaded successfully.",
    imageUrl: imageUrl,
    imageName: req.file.originalname, // Return the image name for consistency
  });
});
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(500).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
});

app.post("/legal/case-list", (req, res) => {
  console.log(req.body);

  const {
    case_list_id,
    way,
    court_type_id,
    court_name_id,
    state_id,
    districtId,
    case_number,
    case_type,
    name,
    mobile_number,
    email,
    address,
    upload_document,
  } = req.body;

  const cdate = getCurrentDateTime();
  const query = `
    INSERT INTO case_list (case_list_id, way, court_type_id, court_name_id, state_id, district_id, case_number, case_type, name, mobile_number, email, address, upload_document, cdate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    case_list_id,
    way,
    court_type_id,
    court_name_id,
    state_id,
    districtId,
    case_number,
    case_type,
    name,
    mobile_number,
    email,
    address,
    upload_document,
    cdate,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res
      .status(201)
      .json({ message: "Case added successfully", id: result.insertId });
  });
});

app.get("/legal/expertise", (req, res) => {
  const sql = "SELECT  exp_id, name FROM tbl_ex_pre WHERE status=1";
  connection.query(sql, (err, results) => {
    if (err) {
      console.log(err.message);
    }

    res.status(201).json(results);
  });
});

app.get("/legal/experience", (req, res) => {
  const sql = "SELECT exy_id, name FROM tbl_epxofy WHERE status=1";
  connection.query(sql, (err, results) => {
    if (err) {
      console.log(err.message);
    }
    res.status(201).json(results);
  });
});

app.get("/legal/states", (req, res) => {
  const sql = `SELECT sid, name FROM master_state WHERE cid='CUN105164' AND status=1`;

  connection.query(sql, (err, results) => {
    if (err) {
      console.log(err.message);
    }

    res.json(results);
  });
});

app.get("/legal/districts", (req, res) => {
  const { sid } = req.query;
  const sql = `SELECT  did, name FROM master_district WHERE sid=? AND status=1`;

  connection.query(sql, [sid], (err, results) => {
    if (err) {
      console.log(err.message);
    }

    res.json(results);
  });
});
app.get("/legal/qualification", (req, res) => {
  const { sid } = req.query;
  const sql = `SELECT qid, name FROM tbl_qualification WHERE status=1`;

  connection.query(sql, [sid], (err, results) => {
    if (err) {
      console.log(err.message);
    }

    res.json(results);
  });
});
app.get("/legal/court_type", (req, res) => {
  const { sid } = req.query;
  const sql = ` SELECT court_id, name FROM tbl_court WHERE status=1`;

  connection.query(sql, [sid], (err, results) => {
    if (err) {
      console.log(err.message);
    }

    res.json(results);
  });
});

app.get("/legal/DistrictCourtNames", (req, res) => {
  const { sid, did, court_id } = req.query; // Use req.query for GET requests

  const sql = `SELECT  courtdist_id, name FROM tbl_dist_complex WHERE sid=? AND did=? AND court_id=? AND status=1`;
  connection.query(sql, [sid, did, court_id], (err, results) => {
    if (err) {
      res.status(500).send({ Error: err.message });
    }

    res.status(200).send(results);
  });
});

app.get("/legal/HighCourtNames", (req, res) => {
  const { court_id } = req.query; // Use req.query for GET requests

  const sql = `SELECT name, courtnew_id FROM tbl_court_complex WHERE court_id=? AND status=1`;
  connection.query(sql, [court_id], (err, results) => {
    if (err) {
      res.status(500).send({ Error: err.message });
    }

    res.status(200).send(results);
  });
});

app.get("/legal/caseType", (req, res) => {
  const { court_id } = req.query; // Use req.query for GET requests

  const sql = `SELECT case_id , name FROM tbl_casetype WHERE court_type=? AND status=1`;
  connection.query(sql, [court_id], (err, results) => {
    if (err) {
      res.status(500).send({ Error: err.message });
    }

    res.status(200).send(results);
  });
});

app.post("/legal/add-advocate", async (req, res) => {
  const c_date = getCurrentDateTime();
  try {
    const {
      advct_id,
      name,
      mobileNumber,
      email,
      dob,
      gender,
      wcrn,
      currentAddress,
      city,
      heducation,
      pyear,
      exp,
      courtType,
      state_id,
      districtId,
      pcName,
      expertise,
      uploadDocument,
    } = req.body;

    const expertiseJSON = JSON.stringify(expertise);

    const query = `
      INSERT INTO tbl_advct (
        advct_id, name, mobileNumber, email, dob, gender,wcrn, currentAddress, city,
        heducation, pyear, exp, courtType, state, district, pcName, 
        expertise, uploadDocument, cdate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
    `;

    const values = [
      advct_id,
      name,
      mobileNumber,
      email,
      dob,
      gender,
      wcrn,
      currentAddress,
      city,
      heducation,
      pyear,
      exp,
      courtType,
      state_id,
      districtId,
      pcName,
      expertiseJSON,
      uploadDocument,
      c_date,
    ];

    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error", details: err });
      }
      res.status(201).json({ message: "Advocate added successfully", result });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.listen(PORT, (req, res) => {
  console.log(`Server is listening on port ${PORT}`);
});
