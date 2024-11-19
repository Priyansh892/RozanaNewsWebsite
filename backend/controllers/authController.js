const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler=require("express-async-handler")

exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate user input
    if (!username || !password || !email) {
      return res.status(400).json({
        message: "All fields (username, password, and email) are required.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Username is already taken. Please choose a different username.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    // Store token and user details in cookies
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("userDetails", JSON.stringify({ username, email }), {
      httpOnly: true, // You may want to make this false to access it in JavaScript if needed
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      message: "User registered successfully. You can now log in.",
      token,
      user: { username, email }
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during registration. Please try again later.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate user input
    if (!username || !password) {
      return res.status(400).json({ message: "Both username and password are required." });
    }

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials. User not found." });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials. Password does not match." });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    // Store token and user details in cookies
    res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie("userDetails", JSON.stringify({ username: user.username, email: user.email }), {
      httpOnly: true, // You may want to make this false to access it in JavaScript if needed
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Login successful.", token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "An error occurred during login. Please try again later.", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword, confirmPassword } = req.body;

    // Validate user input
    if (!username || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Username, new password, and confirm password are required.",
      });
    }

    // Validate that the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match. Please try again.",
      });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please check the username and try again.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({
      message: "An unexpected error occurred while resetting the password. Please try again later.",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear the cookies
    res.cookie('authToken', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });
    res.cookie('userDetails', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0) });

    // Optionally, invalidate the session or token on the server side if using token-based authentication
    // This might involve removing or invalidating the token from a token store or database

    res.status(200).json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "An unexpected error occurred while logging out. Please try again later.",
      error: error.message,
    });
  }
};

exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      createdPolls: user.createdPolls,
      votedPolls: user.votedPolls,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
