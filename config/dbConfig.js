const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "119.18.55.247",
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

module.exports={connection}
