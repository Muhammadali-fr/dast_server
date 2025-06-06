const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/user.model");
// const Comment = require("../models/comments.model");
const jwtSecret = process.env.JWT_SECRET;

// login part codes
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use `findOne` to find a single user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // if (user.verificated !== true) {
    //   return res.status(400).send("Your account is not verified");
    // }

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {});

    // **Cookie orqali token jo‘natish**
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res
      .status(200)
      .json({ message: "you have succefully logged in.", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server xatosi", error: error.message });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(404).json({ message: "token topilmadi." });

    const userDoc = jwt.verify(token, jwtSecret);

    if (!userDoc) return res.status(401).json({ message: "invalid token" });
    const user = await User.findById(userDoc.id).select(
      "_id email username name bio avatar verificated check balance"
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "login xato", error: error.message });
  }
});

// logout
router.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Faqat HTTPS bo'lsa secure bo'ladi
      sameSite: "strict",
      expires: new Date(0), // Muddati tugatilgan cookie
    })
    .json({ success: true, message: "Logged out successfully" });
});

module.exports = { router, jwtSecret };

/**
 * @swagger
 * /login:
 *   post:
 *     tags: ["Authentication"]
 *     summary: Login a user and generate a token.
 *     description: Authenticates a user using email and password, and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email address.
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: The user's password.
 *                 example: password123
 *     responses:
 *       200:
 *         description: User successfully logged in and token returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "jwt_token_here"
 *       400:
 *         description: Invalid email or password, or user not found.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     tags: ["User"]
 *     summary: Get the logged-in user's profile information.
 *     description: Returns the profile information of the logged-in user using a valid JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's profile details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The user's unique ID.
 *                   example: "60b4ef7e3b3c1f001f8f3b7e"
 *                 email:
 *                   type: string
 *                   description: The user's email address.
 *                   example: "user@example.com"
 *                 username:
 *                   type: string
 *                   description: The user's username.
 *                   example: "user123"
 *                 name:
 *                   type: string
 *                   description: The user's full name.
 *                   example: "John Doe"
 *                 bio:
 *                   type: string
 *                   description: The user's bio information.
 *                   example: "I love coding and coffee!"
 *                 avatar:
 *                   type: string
 *                   description: The URL of the user's avatar.
 *                   example: "http://localhost:8080/file/avatar.jpg"
 *                 verificated:
 *                   type: boolean
 *                   description: Whether the user account is verified.
 *                   example: true
 *                 check:
 *                   type: boolean
 *                   description: Some custom check flag.
 *                   example: true
 *                 balance:
 *                   type: number
 *                   description: The user's current balance.
 *                   example: 100.50
 *       401:
 *         description: Unauthorized, invalid or missing token.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
