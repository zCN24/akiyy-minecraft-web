const { sendRconCommand } = require('../utils/rcon');
const User = require('../models/User');

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

module.exports = {
  setNickname,
  setSkin
};
