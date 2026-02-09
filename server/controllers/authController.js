const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new user
const register = async (req, res) => {
  try {
    const { username, password, minecraftId } = req.body;

    // Validate input
    if (!username || !password || !minecraftId) {
      return res.status(400).json({ 
        success: false,
        message: '请提供用户名、密码和 Minecraft ID' 
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false,
        message: '用户名已存在' 
      });
    }

    // Check if minecraftId already exists
    const existingMinecraftId = await User.findOne({ minecraftId });
    if (existingMinecraftId) {
      return res.status(400).json({ 
        success: false,
        message: 'Minecraft ID 已被注册' 
      });
    }

    // Create new user (password will be hashed automatically by the pre-save hook)
    const newUser = new User({
      username,
      password,
      minecraftId
    });

    await newUser.save();

    // Return user info without password
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      minecraftId: newUser.minecraftId,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      user: userResponse
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误，注册失败' 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: '请提供用户名和密码' 
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: '用户名或密码错误' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: '用户名或密码错误' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '7d' }
    );

    // Return user info and token
    const userResponse = {
      id: user._id,
      username: user.username,
      minecraftId: user.minecraftId,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误，登录失败' 
    });
  }
};

module.exports = {
  register,
  login
};
