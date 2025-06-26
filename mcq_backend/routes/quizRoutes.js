const express = require('express');
const router = express.Router();
const pool = require('../database/db').pool;
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const { v4: uuidv4 } = require('uuid');


router.get('/by-material/:materialId', verifyToken, async (req, res) => {
    const { materialId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM quizzes WHERE materialID = ?', [materialId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quizzes.' });
    }
});


router.get('/:quizId', verifyToken, async (req, res) => {
    const { quizId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM quizzes WHERE quizId = ?', [quizId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz.' });
    }
});

router.delete('/:quizId', verifyToken, authorizeRoles('professor', 'admin'), async (req, res) => {
    const { quizId } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM quizzes WHERE quizId = ?', [quizId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }
        res.json({ status: 'success', message: 'Quiz deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete quiz.' });
    }
});


router.put('/:quizId', verifyToken, authorizeRoles('professor', 'admin'), async (req, res) => {
    const { quizId } = req.params;
    const { question, optionA, optionB, optionC, optionD, correctOption } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE quizzes SET question = ?, optionA = ?, optionB = ?, optionC = ?, optionD = ?, correctOption = ? WHERE quizId = ?`,
            [question, optionA, optionB, optionC, optionD, correctOption, quizId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }
        res.json({ status: 'success', message: 'Quiz updated.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update quiz.' });
    }
});

router.post('/:quizId/answer', verifyToken, async (req, res) => {
    const { quizId } = req.params;
    const { selectedOption } = req.body; // e.g., "A", "B", "C", or "D"
    const userId = req.user.userId;
    try {
        const [rows] = await pool.query(
            'SELECT correctOption, question FROM quizzes WHERE quizId = ?', [quizId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }
        const correct = rows[0].correctOption;
        const isCorrect = (selectedOption === correct);

        // Save attempt
        await pool.query(
            'INSERT INTO quiz_attempts (attemptId, userId, quizId, selectedOption, isCorrect) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), userId, quizId, selectedOption, isCorrect]
        );

        res.json({
            correct,
            isCorrect,
            feedback: isCorrect ? "Correct!" : "Incorrect. The correct answer is " + correct + ".",
            question: rows[0].question
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check answer.' });
    }
});

router.get('/attempts/:materialId', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { materialId } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT a.*, q.question, q.correctOption
             FROM quiz_attempts a
             JOIN quizzes q ON a.quizId = q.quizId
             WHERE a.userId = ? AND q.materialID = ?`,
            [userId, materialId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attempts.' });
    }
});

module.exports = router;