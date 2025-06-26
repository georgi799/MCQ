const dotenv = require("dotenv");
dotenv.config();


const express = require("express");
const cors = require("cors");
const port = process.env.PORT;

const { connectDB } = require("./database/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const quizRoutes = require('./routes/quizRoutes');
const path = require('path');


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use('/courses', courseRoutes);
app.use('/quizzes', quizRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


connectDB();

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});