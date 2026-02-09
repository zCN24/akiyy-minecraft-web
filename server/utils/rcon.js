const { Rcon } = require('rcon-client');

/**
 * Send a command to Minecraft server via RCON
 * @param {string} command - The command to send
 * @returns {Promise<string>} - The response from the server
 */
async function sendRconCommand(command) {
  let rcon = null;

  try {
    // Get RCON credentials from environment variables
    const host = process.env.RCON_HOST || 'localhost';
    const port = parseInt(process.env.RCON_PORT) || 25575;
    const password = process.env.RCON_PASSWORD;

    if (!password) {
      throw new Error('RCON password not configured in .env file');
    }

    // Connect to RCON server
    rcon = await Rcon.connect({
      host: host,
      port: port,
      password: password
    });

    console.log(`RCON connected to ${host}:${port}`);

    // Send command
    const response = await rcon.send(command);
    
    console.log(`RCON command sent: ${command}`);
    
    return response;

  } catch (error) {
    console.error('RCON error:', error.message);
    throw new Error(`RCON failed: ${error.message}`);
  } finally {
    // Always close connection
    if (rcon) {
      try {
        await rcon.end();
        console.log('RCON connection closed');
      } catch (closeError) {
        console.error('Error closing RCON connection:', closeError.message);
      }
    }
  }
}

module.exports = { sendRconCommand };
