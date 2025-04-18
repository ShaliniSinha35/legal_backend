const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const dotenv = require("dotenv");
const PORT = process.env.port || 3006;
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
  // host: "localhost",
  // user: "root",
  // password: "",
  // database: "justice_legal",
  host: "119.18.55.247",
  user:"martonfinger_justice_legal_app_u",
  password:"qbGxHf[Bf}-E",
  database:"martonfinger_justice_legal_app_db",
  timezone:"Asia/Kolkata",
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

const formatDate = (isoDate) => {
  const date = new Date(isoDate);

  const offset = date.getTimezoneOffset() * 60000; 
  const localDate = new Date(date - offset);

  return localDate.toISOString().slice(0, 10);
};

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

  const sql = `SELECT name, court_complex_id FROM tbl_court_complex WHERE court_id=? AND status=1`;
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


app.post("/legal/byCaseNumber", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id, case_type, case_number } = req.body;
   console.log(req.body)
  const query = `
   SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  -- Prioritizing available name
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
  AND cl.case_type = ? 
  AND cl.case_number = ?;

  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id, case_type, case_number], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});


app.post("/legal/byPartyName", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id, party_name,case_status } = req.body;
   console.log(req.body)
  const query = `
    SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
  AND cl.party_name = ?
AND cl.status=?;
 
  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id, party_name,case_status==3?null:case_status], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

app.post("/legal/byFilingNumber", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id,filing_number } = req.body;
   console.log(req.body)
  const query = `
  SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
  AND cl.filling_number = ?;
 
  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id, filing_number], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
})

app.post("/legal/byFIRNumber", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id, police_station,fir_number,case_status } = req.body;
   console.log(req.body)
  const query = `
     SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
AND cl.police_station=?
  AND cl.fir_number = ?
AND cl.status=?;

  
  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id, police_station,fir_number,case_status==3?null:case_status], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});
app.post("/legal/byActType", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id,act,case_status } = req.body;
   console.log(req.body)
  const query = `
      SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
  AND cl.act = ?
AND cl.status=?;

 
  
  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id,act,case_status==3?null:case_status], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});
app.post("/legal/byCaseType", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id,case_type,case_status } = req.body;
   console.log(req.body)
  const query = `
        SELECT  
    cl.case_list_id, 
    cl.way, 
    court.name AS court_type, 
    COALESCE(cc.name, dcc.name) AS court_complex,  
    ms.name AS state_name, 
    md.name AS district_name, 
    cl.case_number, 
    ct.name AS case_type, 
    cl.filling_number, 
    cl.act, 
    cl.party_name, 
    cl.fir_number, 
    cl.police_station, 
    cl.name, 
    cl.mobile_number, 
    cl.email, 
    cl.address, 
    cl.upload_document, 
    cl.upload_another_document, 
    cl.status, 
    cl.cdate  
FROM case_list AS cl 
JOIN tbl_court court ON cl.court_type_id = court.court_id
LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
JOIN tbl_casetype ct ON cl.case_type = ct.case_id
JOIN master_state ms ON cl.state_id = ms.sid
JOIN master_district md ON cl.district_id = md.did
WHERE cl.court_type_id = ? 
  AND cl.state_id = ? 
  AND cl.district_id = ? 
  AND cl.court_name_id = ? 
  AND cl.case_type = ?
AND cl.status=?;
  `;

  connection.query(query, [court_type_id, state_id, district_id, court_name_id,case_type,case_status==3?null:case_status], (err, results) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});



app.post("/legal/byCauseListDate", (req, res) => {
  const { court_type_id, state_id, district_id, court_name_id, caseType, cdate } = req.body;
  
 

  const formattedDate = formatDate(cdate);
  console.log("Formatted Date:", formattedDate,req.body);

  const query = `
    SELECT  
      cl.case_list_id, 
      cl.way, 
      court.name AS court_type, 
      COALESCE(cc.name, dcc.name) AS court_complex,  
      ms.name AS state_name, 
      md.name AS district_name, 
      cl.case_number, 
      ct.name AS case_type, 
      cl.filling_number, 
      cl.act, 
      cl.party_name, 
      cl.fir_number, 
      cl.police_station, 
      cl.name, 
      cl.mobile_number, 
      cl.email, 
      cl.address, 
      cl.upload_document, 
      cl.upload_another_document, 
      cl.status, 
      cl.cdate  
    FROM case_list AS cl 
    JOIN tbl_court court ON cl.court_type_id = court.court_id
    LEFT JOIN tbl_court_complex cc ON cl.court_name_id = cc.court_complex_id
    LEFT JOIN tbl_dist_complex dcc ON cl.court_name_id = dcc.courtdist_id
    JOIN tbl_casetype ct ON cl.case_type = ct.case_id
    JOIN master_state ms ON cl.state_id = ms.sid
    JOIN master_district md ON cl.district_id = md.did
    WHERE cl.court_type_id = ? 
      AND cl.state_id = ? 
      AND cl.district_id = ? 
      AND cl.court_name_id = ? 
      AND cl.case_type = ?
  AND DATE(cl.cdate) = ?;
  `;

  connection.query(
    query,
    [court_type_id, state_id, district_id, court_name_id, caseType,formattedDate],
    (err, results) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).json({ error: "Database query error" });
      }
      res.json(results);
    }
  );
});


app.get("/legal/highCourtInnerNames",(req,res)=>{
  const { court_id } = req.query;
  console.log(req.query)

  const sql =`SELECT  courtname_id, name FROM tbl_court_name WHERE court_complex_id=? AND status=1`
  connection.query(sql, [court_id], (err, results) => {
    if (err) {
      res.status(500).send({ Error: err.message });
    }

    res.status(200).send(results);
  });
})

app.get("/legal/districtCourtInnerNames",(req,res)=>{
  const { court_id } = req.query;

  const sql =`SELECT courtname_id, name FROM tbl_dist_court_name WHERE discourt_complex_id=? AND status=1`
  connection.query(sql, [court_id], (err, results) => {
    if (err) {
      res.status(500).send({ Error: err.message });
    }

    res.status(200).send(results);
  });
})

app.get("/legal/allCases",(req,res)=>{
  const sql=`SELECT Date(cdate) FROM case_list`
  connection.query(sql,(errors,results)=>{
    if(errors){
      res.status(500).send(errors)

    }
    res.status(201).json(results)
  })
})

app.listen(PORT, (req, res) => {
  console.log(`Server is listening on port ${PORT}`);
});
