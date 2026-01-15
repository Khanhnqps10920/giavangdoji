require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { crawlGoldPrices } = require("./crawler");

// Get bot token from environment variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID_FILE = path.join(__dirname, ".chat_id");

if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN must be set in .env file");
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Load chat ID from file or use environment variable
function getChatId() {
  // First try environment variable
  if (process.env.TELEGRAM_CHAT_ID) {
    return process.env.TELEGRAM_CHAT_ID;
  }

  // Then try to read from file
  try {
    if (fs.existsSync(CHAT_ID_FILE)) {
      return fs.readFileSync(CHAT_ID_FILE, "utf8").trim();
    }
  } catch (error) {
    console.error("Error reading chat ID file:", error.message);
  }

  return null;
}

// Save chat ID to file
function saveChatId(chatId) {
  try {
    fs.writeFileSync(CHAT_ID_FILE, chatId.toString(), "utf8");
    console.log(`Chat ID saved: ${chatId}`);
  } catch (error) {
    console.error("Error saving chat ID:", error.message);
  }
}

// Format prices for Telegram message
function formatPricesMessage(prices) {
  if (!prices || prices.length === 0) {
    return "❌ Không thể lấy dữ liệu giá vàng";
  }

  let message = "💰 *Bảng giá vàng Hà Nội*\n\n";
  message += `📅 ${new Date().toLocaleString("vi-VN")}\n\n`;

  prices.forEach((item) => {
    message += `*${item.product}*\n`;
    message += `Mua vào: ${item.buyPrice.toLocaleString("vi-VN")} VNĐ\n`;
    message += `Bán ra: ${item.sellPrice.toLocaleString("vi-VN")} VNĐ\n\n`;
  });

  return message;
}

// Function to send gold prices
async function sendGoldPrices(chatId = null) {
  const targetChatId = chatId || getChatId();

  if (!targetChatId) {
    console.log("No chat ID available. Waiting for /start command...");
    return;
  }

  try {
    console.log("Fetching and sending gold prices...");
    const prices = await crawlGoldPrices();

    if (prices && prices.length > 0) {
      const message = formatPricesMessage(prices);
      await bot.sendMessage(targetChatId, message, { parse_mode: "Markdown" });
      console.log("Gold prices sent successfully!");
    } else {
      await bot.sendMessage(
        targetChatId,
        "❌ Không thể lấy dữ liệu giá vàng lúc này"
      );
    }
  } catch (error) {
    console.error("Error sending gold prices:", error.message);
    if (targetChatId) {
      await bot.sendMessage(
        targetChatId,
        `❌ Lỗi khi lấy dữ liệu: ${error.message}`
      );
    }
  }
}

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Save chat ID automatically
  saveChatId(chatId);
  console.log(`Chat ID detected and saved: ${chatId}`);

  bot.sendMessage(
    chatId,
    "👋 Chào mừng đến với bot giá vàng!\n\n" +
      "Bot sẽ tự động gửi bảng giá vàng mỗi giờ.\n\n" +
      "Các lệnh:\n" +
      "/price - Lấy giá vàng ngay bây giờ\n" +
      "/help - Hiển thị trợ giúp\n\n" +
      `✅ Chat ID của bạn: \`${chatId}\`\n` +
      "Đã được lưu tự động!",
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/price/, async (msg) => {
  const chatId = msg.chat.id;

  // Save chat ID if not already saved
  if (!getChatId()) {
    saveChatId(chatId);
  }

  await bot.sendMessage(chatId, "⏳ Đang lấy dữ liệu...");
  try {
    const prices = await crawlGoldPrices();
    const message = formatPricesMessage(prices);
    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Lỗi: ${error.message}`);
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "📖 *Trợ giúp*\n\n" +
      "/start - Bắt đầu bot\n" +
      "/price - Lấy giá vàng ngay bây giờ\n" +
      "/help - Hiển thị trợ giúp\n\n" +
      "Bot tự động gửi bảng giá vàng mỗi giờ.",
    { parse_mode: "Markdown" }
  );
});

// Log all messages to help detect chat ID
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;
  console.log(
    `[${new Date().toLocaleString()}] Message from ${username} (Chat ID: ${chatId}): ${
      msg.text || "(no text)"
    }`
  );

  // Auto-save chat ID on any message
  if (!getChatId()) {
    saveChatId(chatId);
    console.log(`Auto-saved chat ID: ${chatId}`);
  }
});

// Schedule job to run every hour
console.log("Setting up scheduled job (every hour)...");
cron.schedule("0 * * * *", () => {
  console.log("Scheduled job triggered at", new Date().toLocaleString());
  sendGoldPrices();
});

// Send initial message when bot starts (if chat ID is available)
const initialChatId = getChatId();
if (initialChatId) {
  console.log("Bot is running with saved chat ID:", initialChatId);
  bot.sendMessage(
    initialChatId,
    "🤖 Bot đã khởi động! Sẽ gửi giá vàng mỗi giờ."
  );

  // Send prices immediately on startup (optional)
  setTimeout(() => {
    sendGoldPrices();
  }, 2000);
} else {
  console.log("Bot is running... Waiting for /start command to get chat ID.");
  console.log("Send /start to your bot to begin receiving updates.");
}
