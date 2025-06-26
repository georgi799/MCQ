const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const { pool } = require("../database/db");
const {verify} = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

router.put(
    "/promote/:username",
    verifyToken,
    authorizeRoles("admin"),
    async (req, res) => {
        const {username} = req.params;
        const {newRole} = req.body;

        const validRoles = ["student", "professor", "admin"];
        if(!validRoles.includes(newRole)) {
            return res.status(400).json({ error: "Invalid role specified." });
        }

        try{
            const [result] = await pool.execute(
                "UPDATE users SET role = ? WHERE username = ?",
                [newRole, username]
            );

            if(result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found." });
            }

            res.status(200).json({message: `${username} promoted to ${newRole} successfully!`});
        } catch (err){
            console.error("PROMOTION ERROR", err.message);
            res.status(500).json({ error: "An error occurred while promoting the user." });
        }
    }
);

router.get(
    "/users",
    verifyToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const [users] = await pool.execute(
                "SELECT userId, username, role, password FROM users"
            );
            res.json(users);
        } catch (err) {
            console.error("FETCH USERS ERROR", err.message);
            res.status(500).json({ error: "An error occurred while fetching users." });
        }
    }
);

router.post(
    "/enroll",
    verifyToken,
    authorizeRoles("admin"),
    async (req, res) => {
        const { studentId, courseId } = req.body;

        if(!studentId || !courseId) {
            return res.status(400).json({ error: "Student ID and Course ID are required." });
        }

        try {
            const [existing] = await pool.execute(
                "SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?",
                [studentId, courseId]
            );
            if(existing.length>0){
                return res.status(409).json({ error: "Student already enrolled in this course." });
            }

            await pool.execute(
                "INSERT INTO enrollments (studentId, courseId) VALUES (?, ?)",
                [studentId, courseId]
            );
            res.status(201).json({ message: "Enrollment successful." });
        } catch (err) {
            console.error("ENROLLMENT ERROR", err.message);
            res.status(500).json({ error: "An error occurred while enrolling the student." });
        }
    }
);

router.post(
    "/create-course",
    verifyToken,
    authorizeRoles("admin", "professor"),
    async (req, res) => {
        const {title, description, professorId} = req.body;

        if (!title || !description || !professorId) {
            return res.status(400).json({error: "Title, description, and professor ID are required."});
        }

        try {
            const courseId = uuidv4();

            await pool.execute(
                `INSERT INTO courses (courseId, title, description, professorId)
                VALUES (?, ?, ?, ?)`,
                [courseId, title, description, professorId]
            );

            res.status(201).json({
                message: "Course created successfully!",
                courseId
            });

        } catch (err) {
            console.error("COURSE CREATION ERROR", err.message);
            res.status(500).json({error: "An error occurred while creating the course."});
        }
    }
);

router.get(
    "/courses",
    verifyToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const [courses] = await pool.execute(`
                SELECT 
                    c.courseId, 
                    c.title, 
                    c.description,
                    c.professorId,
                    COUNT(e.studentId) AS enrolledCount
                FROM 
                    courses c
                LEFT JOIN 
                    enrollments e ON c.courseId = e.courseId
                GROUP BY 
                    c.courseId, c.title, c.description, c.professorId
            `);
            res.json(courses);
        } catch (err) {
            console.error("FETCH COURSES ERROR", err.message);
            res.status(500).json({ error: "An error occurred while fetching courses." });
        }
    }
);

module.exports = router;