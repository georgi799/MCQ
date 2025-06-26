const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
    createTable,
    checkRecordExists,
    insertRecord,
} = require("../utils/sqlFunctions");

const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res
            .status(400)
            .json({ error: "Username or Password fields cannot be empty!" });
        return;
    }

    const {role} = req.body;
    const validRoles = ["student", "professor", "admin"];
    const assignedRole = validRoles.includes(role) ? role : "student";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = {
        userId: uuidv4(),
        username,
        password: hashedPassword,
        role: assignedRole,
    };
    try {

        const userAlreadyExists = await checkRecordExists("users", "username", username);
        if (userAlreadyExists) {
            res.status(409).json({ error: "Username already exists" });
        } else {
            await insertRecord("users", user);
            res.status(201).json({ message: "User created successfully!" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res
            .status(400)
            .json({ error: "Username or Password fields cannot be empty!" });
        return;
    }

    try {
        const existingUser = await checkRecordExists("users", "username", username);

        if (existingUser) {
            if (!existingUser.password) {
                res.status(401).json({ error: "Invalid credentials" });
                return;
            }

            const passwordMatch = await bcrypt.compare(
                password,
                existingUser.password
            );

            if (passwordMatch) {
                res.status(200).json({
                    userId: existingUser.userId,
                    username: existingUser.username,
                    role: existingUser.role,
                    access_token: generateAccessToken(existingUser.userId, existingUser.role),
                });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
};