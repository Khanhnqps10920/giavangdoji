# Gold Price Telegram Bot

A Telegram bot that crawls gold price data from giavang.doji.vn and sends updates every hour.

## Features

- 🤖 Automatic hourly gold price updates
- 💰 Crawls real-time gold prices from DOJI
- 📱 Telegram bot interface with commands
- 🔄 Auto-detects chat ID from first message
- ⏰ Scheduled job runs every hour

## Setup

### 1. Get Telegram Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token you receive

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

The chat ID will be automatically detected when you send `/start` to your bot.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Bot

```bash
npm start
```

### 5. Start Using the Bot

1. Find your bot on Telegram (search for the username you created)
2. Send `/start` command
3. The bot will automatically save your chat ID
4. You'll start receiving gold price updates every hour

## Commands

- `/start` - Start the bot and register your chat ID
- `/price` - Get current gold prices immediately
- `/help` - Show help message

## Files

- `bot.js` - Main Telegram bot with scheduler
- `crawler.js` - Web crawler module for extracting gold prices
- `package.json` - Project dependencies

## Notes

- The bot automatically saves your chat ID to `.chat_id` file
- Gold prices are fetched from Hà Nội region
- Scheduled job runs at the top of every hour (e.g., 1:00, 2:00, 3:00...)
