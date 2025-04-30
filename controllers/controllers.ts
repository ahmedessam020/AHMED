import { Message, User } from "../models/model.js";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { Request, Response } from "express";

// Utility functions
function decryptMessage(encryptedMessage: string, key: string): string {
    const algorithm = process.env.ALGORITHM || '';
    const iv = Buffer.from(process.env.IV || '', 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encryptMessage(message: string, key: string): string {
    const algorithm = process.env.ALGORITHM || '';
    const iv = Buffer.from(process.env.IV || '', "hex");
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function generateToken(length = 64): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}|;:,.<>?';
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes, (byte) => charset[byte % charset.length]).join('');
}

function hash(data: string = "", method: string = "sha256"): string {
    return crypto.createHash(method).update(data).digest('hex');
}

// Controller functions
const save_message = async (msg: string): Promise<void> => {
    try {
        await Message.create({
            message: encryptMessage(msg, process.env.KEY_ENC || '')
        });
    } catch (error) {
        console.error("Error creating message:", error);
    }
};

const gn_token = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: "FAIL", data: errors.array(), message: "Check your input" });
        return;
    }
    try {
        const Token = generateToken(64);
        const data = await User.findOneAndUpdate(
            { user_name: req.body.user_name.toLowerCase(), password: hash(req.body.password) },
            { token: hash(Token), expireAt: Date.now() + 1000 * 60 * 60 * 24 * 10 },//token expire in 10 days
            { new: true }
        );
        if (data) {
            res.status(201).json({ status: "Success", token: Token });
        } else {
            res.status(401).json({ status: "FAIL", message: "Username or password is not correct" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "FAIL", message: err });
    }
};

const del_message = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: "FAIL", data: errors.array(), message: "Check your input" });
        return;
    }
    try {
        const user = await User.find({ token: hash(req.body.token), expireAt: { $gt: Date.now() } });
        if (user.length) {
            const data = await Message.deleteOne({ _id: req.body.id });
            if (data.deletedCount > 0) {
                res.status(201).json({ status: "Success", message: "Deleted" });
            } else {
                res.status(404).json({ status: "FAIL", message: "No message found" });
            }
        } else {
            res.status(401).json({ status: "FAIL", message: "Token is not correct" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Error", message: "Internal server error" });
    }
};
const see_message = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: "FAIL", data: errors.array(), message: "Invalid input" });
        return;
    }
    const token = req.query.token as string;

    try {
        const user = await User.findOne({ token: hash(token), expireAt: { $gt: Date.now() } });
        if (!user) {
            res.status(401).send(`data: ${JSON.stringify({ error: "Invalid token" })}\n\n`);
            console.error("Invalid token");
            return;
        }

        // Set headers for SSE
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");


        // Watch for changes
        const changeStream = Message.watch();
        changeStream.on("change", (change) => {
            if (change.operationType === "insert") {
                const newMessage = change.fullDocument;
                res.status(200).write(
                    `data: ${JSON.stringify({
                        msg: decryptMessage(newMessage.message, process.env.KEY_ENC || ""),
                        id: newMessage._id,
                    })}\n\n`
                );
            }
        });

        req.on("close", () => {
            changeStream.close();
            res.end();
        });
    } catch (error) {
        console.error("Error in SSE:", error);
        res.status(500).send(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
    }
};
const get_message = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ status: "FAIL", data: errors.array(), message: "Invalid input" });
        return;
    }
    const token = req.body.token as string;

    try {
        const user = await User.findOne({ token: hash(token), expireAt: { $gt: Date.now() } });
        if (!user) {
            res.status(401).send(`data: ${JSON.stringify({ error: "Invalid token" })}\n\n`);
            console.error("Invalid token");
            return;
        }
        const messages = await Message.find({});
        const decryptedMessages = messages.map((message) => ({
            msg: decryptMessage(message.message, process.env.KEY_ENC || ""),
            id: message._id,
        }));
        res.status(200).json({ status: "Success", messages: decryptedMessages });
    } catch (error) {
        console.error("Error in get_message:", error);
        res.status(500).send(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
    }
};
export {
    save_message,
    gn_token,
    see_message,
    del_message,
    get_message
};