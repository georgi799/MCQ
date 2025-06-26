const mysql = require("mysql2/promise");
const config = require("./config");

const pool = mysql.createPool(config);

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to MySQL database");
        connection.release();
    } catch (err) {
        console.log({ error: err.message });
    }
};


module.exports = {connectDB, pool};
