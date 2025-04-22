import express, { Request, Response } from 'express';
import cors from 'cors';
import next from 'next';
import mongoose from 'mongoose';
import { save_message, gn_token, get_message, del_message } from "./controllers/controllers.js";
import dotenv from "dotenv";
import fs from 'fs';
import { body, validationResult } from "express-validator";
import path from "path";
import { fileURLToPath } from "url";
import {Record} from "./models/model.js";
dotenv.config();

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const server = express();

server.use(cors());
server.use(express.json());
process.env.NUM= "0";
Record.findOne({}).then((record) => {
    if (record) {
        process.env.NUM = record.Num.toString();
    }
}).catch((err) => {
    console.error("Error fetching record:", err);
});

server.use("/",(req, res, next) => {
    if(req.method === "GET" && req.path === "/") {
    Record.findOne({}).then((record) => {
        if (!record) {
            const newRecord = new Record({ Num: 0 });
            newRecord.save().then(() => {
                console.log("Record created");  
                next(); // Call next() after saving the new record
            }
            ).catch((err) => {
                console.error("Error creating record:", err);
                next(err); // Pass the error to the next middleware
            });
        } else {
            record.Num += 1;
            record.save().then(() => {
                console.log("Record updated");
                process.env.NUM= record.Num.toString();
                next(); // Call next() after updating the record
            }).catch((err) => {
                console.error("Error updating record:", err);
                next(err); // Pass the error to the next middleware
            });
        }
    }).catch((err) => {
        console.error("Error finding record:", err);
        next(err);
    });
    }
    else {
        next();
    }
});
app.prepare().then(() => {
    // Define your custom API routes here
    server.get("/api/get_num", (req: Request, res: Response) => {
        res.json({ num: process.env.NUM  });
    });
    server.post("/api/genToken", [
        body("user_name")
            .isString()
            .withMessage("user_name must be a string")
            .notEmpty()
            .withMessage("user_name not provided"),
        body("password")
            .isString()
            .withMessage("password must be a string")
            .notEmpty()
            .withMessage("password not provided")
    ], gn_token);

    server.post("/api/get_message", [
        body("token")
            .isString()
            .withMessage("token must be a string")
            .notEmpty()
            .withMessage("token not provided")
    ], get_message);

    server.post("/api/del_message", [
        body("token")
            .isString()
            .withMessage("token must be a string")
            .notEmpty()
            .withMessage("token not provided"),
        body("id")
            .isString()
            .withMessage("id must be a string")
            .notEmpty()
            .withMessage("id not provided")
    ], del_message);

    server.post('/api/send', [
        body("msg")
            .isString()
            .notEmpty()
            .withMessage("msg not provided")
    ], (req: Request, res: Response): void => {
        const er = validationResult(req);
        if (!er.isEmpty()) {
            res.status(400).json({ status: "FAIL", data: er.array() });
            return;
        }
        save_message(req.body.msg);
        res.json({ message: 'Hi!' });
    });

    server.get('/images/my_photo.jpg', (req: Request, res: Response) => {
        fs.readFile(path.join(__dirname, "/images/my_photo.jpg"), (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                res.status(500).send('Error reading the file');
                return;
            }
            res.send(data);
        });
    });

    // Default handler for Next.js pages
    server.get("*", (req: Request, res: Response) => {
        return handle(req, res);
    });

    mongoose.connect(process.env.MONGO_URL || '').then(() => {
        console.log("MongoDB connected");
        server.listen(port, () => {
            console.log(`> Ready on http://localhost:${port}`);
        });
    }).catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });
});