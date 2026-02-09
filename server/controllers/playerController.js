const { sendRconCommand } = require('../utils/rcon');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for skin uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/skins');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    // Generate filename: MinecraftID_MMDD_HHmm.png
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${month}${day}_${hour}${minute}`;
    
    // Get minecraftId from request user (will be set before upload)
    const minecraftId = req.minecraftId || 'unknown';
    const filename = `${minecraftId}_${timestamp}${ext}`;
    
    cb(null, filename);
  }
});

// File filter for image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const allowedExts = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 PNG、JPG、JPEG 格式的图片'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit
  }
});

// Set player nickname
const setNickname = async (req, res) => {
  try {
    const { nickname } = req.body;

    // Validate input
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '请提供昵称'
      });
    }

    // Get user's minecraftId from database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const minecraftId = user.minecraftId;

    // Construct RCON command
    const command = `/nicknamefor ${minecraftId} ${nickname}`;

    // Send command via RCON
    const response = await sendRconCommand(command);

    res.status(200).json({
      success: true,
      message: '昵称设置成功',
      minecraftId: minecraftId,
      nickname: nickname,
      rconResponse: response
    });

  } catch (error) {
    console.error('Set nickname error:', error);
    res.status(500).json({
      success: false,
      message: 'RCON 命令执行失败',
      error: error.message
    });
  }
};

// Set player skin
const setSkin = async (req, res) => {
  try {
    const { type, value } = req.body;

    // Validate input
    if (!type) {
      return res.status(400).json({
        success: false,
        message: '请提供皮肤类型 (mojang, elyby, url, clear)'
      });
    }

    const validTypes = ['mojang', 'elyby', 'url', 'clear'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的皮肤类型，支持: mojang, elyby, url, clear'
      });
    }

    if (type !== 'clear' && !value) {
      return res.status(400).json({
        success: false,
        message: '请提供皮肤值 (用户名或URL)'
      });
    }

    // Get user's minecraftId from database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const minecraftId = user.minecraftId;
    let command;

    // Construct RCON command based on type
    switch (type) {
      case 'mojang':
        command = `/skin set mojang ${value} ${minecraftId}`;
        break;
      case 'elyby':
        command = `/skin set elyby ${value} ${minecraftId}`;
        break;
      case 'url':
        command = `/skin set web classic "${value}" ${minecraftId}`;
        break;
      case 'clear':
        command = `/skin clear ${minecraftId}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '未知的皮肤类型'
        });
    }

    // Send command via RCON
    const response = await sendRconCommand(command);

    res.status(200).json({
      success: true,
      message: '皮肤设置成功',
      minecraftId: minecraftId,
      type: type,
      value: type !== 'clear' ? value : null,
      rconResponse: response
    });

  } catch (error) {
    console.error('Set skin error:', error);
    res.status(500).json({
      success: false,
      message: 'RCON 命令执行失败',
      error: error.message
    });
  }
};

// Upload skin file
const uploadSkin = async (req, res) => {
  try {
    // Get user's minecraftId from database
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // Set minecraftId for multer filename generation
    req.minecraftId = user.minecraftId;

    // Handle file upload with multer middleware
    upload.single('skin')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // Multer error
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '文件大小超过限制（最大3MB）'
          });
        }
        return res.status(400).json({
          success: false,
          message: '文件上传失败: ' + err.message
        });
      } else if (err) {
        // Other errors
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的皮肤文件'
        });
      }

      // Generate file URL
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/skins/${req.file.filename}`;

      // Automatically set skin using the uploaded file URL
      try {
        const command = `/skin set web classic "${fileUrl}" ${user.minecraftId}`;
        const rconResponse = await sendRconCommand(command);

        res.status(200).json({
          success: true,
          message: '皮肤上传并设置成功',
          minecraftId: user.minecraftId,
          filename: req.file.filename,
          fileUrl: fileUrl,
          fileSize: req.file.size,
          rconResponse: rconResponse
        });
      } catch (rconError) {
        // File uploaded but RCON failed
        res.status(500).json({
          success: false,
          message: '皮肤文件已上传，但设置失败',
          filename: req.file.filename,
          fileUrl: fileUrl,
          error: rconError.message
        });
      }
    });

  } catch (error) {
    console.error('Upload skin error:', error);
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
};

module.exports = {
  setNickname,
  setSkin,
  uploadSkin
};
