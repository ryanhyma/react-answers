import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const secretKey = process.env.JWT_SECRET_KEY;


// Generate session token with a random UUID as jti
export default async function handler(req, res) {
    const readableId = uuidv4(); // random & unique

    const options = {
        jwtid: readableId,  // sets jti
        expiresIn: '1h'
    };
    const token = jwt.sign({}, secretKey, options);
    res.cookie('token', token, {
        httpOnly: true,     // Prevent JavaScript access
        secure: true,       // Send only over HTTPS
        sameSite: 'Strict', // Prevent CSRF attacks
        maxAge: 3600000,    // Expire in 1 hour
    });
    res.json({ chatId : readableId });
};





