const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const verifyToken  = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const { pool } = require("../database/db");
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const FormData = require('form-data');

router.post('/upload', verifyToken, authorizeRoles('professor'), upload.single('material'), async (req, res) => {
    try {
        const { title, courseId } = req.body;
        const path = req.file.path;
        const materialID = uuidv4();

        await pool.execute(
            'INSERT INTO materials (materialID, courseID, title, path) VALUES (?, ?, ?, ?)',
            [materialID, courseId, title, path]
        );

        res.status(201).json({ message: 'Material uploaded successfully.' });
    } catch (error) {
        console.error("UPLOAD ERROR", error.message);
        res.status(500).json({ error: "An error occurred while uploading the course material." });
    }
});

router.get('/view', verifyToken, async(req, res) => {
    try {
        const [courses] = await pool.execute(
            `SELECT c.courseId, c.title, c.description, c.professorId, u.username AS professorName
     FROM courses c
     LEFT JOIN users u ON c.professorId = u.userId`
        );
        res.status(200).json(courses);
    } catch(error) {
        console.error("VIEW ERROR", error.message);
        res.status(500).json({ error: "An error occurred while retrieving courses." });
    }
});

router.post(
    "/enroll/:courseId",
    verifyToken,
    authorizeRoles("student"),
    async(req, res) => {
        const { courseId } = req.params;
        const studentId = req.user.userId;

        try {
            const [existing] = await pool.execute(
                "SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?",
                [studentId, courseId]
            );
            if(existing.length>0) {
                return res.status(400).json({ error : "Already enrolled in this course"});
            }

            await pool.execute(
                "INSERT INTO enrollments (studentId, courseId) VALUES (?, ?)",
                [studentId, courseId]
            );

            res.status(201).json({ message: "Enrollment successful." });
        } catch (err) {
            console.error("ENROLLMENT ERROR", err.message);
            res.status(500)
                .json({ error: "Enrollment filed." });
        }
    }
);

router.get(
    "/enrolled",
    verifyToken,
    authorizeRoles("student"),
    async (req, res) => {
        const studentId = req.user.userId;

        try {
            const [rows] = await pool.execute(
                `SELECT c.courseId, c.title, c.description
    FROM enrollments e
    JOIN courses c ON e.courseId = c.courseId
    WHERE e.studentId = ?`,
                [studentId]
            );
            res.status(200).json(rows);
        } catch (err){
            console.error("ENROLLED COURSES ERROR", err.message);
            res.status(500).json({ error: "An error occurred while fetching enrolled courses." });
        }

    }
);

router.get(
    "/materials/:courseId",
    verifyToken,
    async (req, res) => {
        const { courseId } = req.params;

        try {
            const [materials] = await pool.execute(
                `SELECT materialID, title, path
     FROM materials
     WHERE courseID = ?`,
                [courseId]
            );

// Construct fileUrl for each material
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const materialsWithUrl = materials.map(mat => ({
                ...mat,
                fileUrl: `${baseUrl}/${mat.path.replace(/\\\\/g, '/').replace(/\\/g, '/')}`
            }));

            res.status(200).json(materialsWithUrl);


        } catch (err) {
            console.error("MATERIALS FETCH ERROR", err.message);
            res.status(500).json({ error: "An error occurred while fetching course materials." });
        }
    }
);

router.post('/materials/:materialId/generate-quiz', verifyToken, authorizeRoles('professor', 'admin', 'student'), async (req, res) => {
    const { materialId } = req.params;
    try {
        const form = new FormData();
        form.append('material_id', materialId);

        const response = await axios.post(
            'http://localhost:8000/generate-mcqs/',
            form,
            { headers: form.getHeaders() }
        );
        res.json({ status: 'success', fastapi: response.data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to generate MCQs.' });
    }
});

router.get('/my-courses/enrollments', verifyToken, authorizeRoles('professor'), async (req, res) => {
    const professorId = req.user.userId;
    try {
        const [rows] = await pool.execute(`
            SELECT 
                c.courseId,
                c.title,
                COUNT(e.studentId) AS enrolledCount,
                GROUP_CONCAT(u.username) AS enrolledStudents
            FROM courses c
            LEFT JOIN enrollments e ON c.courseId = e.courseId
            LEFT JOIN users u ON e.studentId = u.userId
            WHERE c.professorId = ?
            GROUP BY c.courseId, c.title
        `, [professorId]);
        res.json(rows);
    } catch (err) {
        console.error("FETCH PROFESSOR ENROLLMENTS ERROR", err.message);
        res.status(500).json({ error: "An error occurred while fetching enrollments for your courses." });
    }
});

router.get(
    "/my-courses",
    verifyToken,
    authorizeRoles("professor"),
    async (req, res) => {
        const professorId = req.user.userId;
        try {
            const [rows] = await pool.execute(
                `SELECT courseId, title, description
                 FROM courses
                 WHERE professorId = ?`,
                [professorId]
            );
            res.status(200).json(rows);
        } catch (err) {
            console.error("MY COURSES ERROR", err.message);
            res.status(500).json({ error: "An error occurred while fetching your courses." });
        }
    }
);

module.exports = router;