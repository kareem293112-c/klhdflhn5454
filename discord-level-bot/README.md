# Discord Level Bot — Banner Rank Card

A Discord.js v14 bot with:
- 1 XP per valid message, with a 60-second per-user cooldown.
- Minimum message length of 5 characters.
- Bots do not earn XP.
- 1 XP per minute in voice.
- Voice XP requires at least 2 real (non-bot) users in the same voice channel.
- AFK channels do not count.
- Every 100 total XP = 1 level.
- Automatic Iron / Gold / Silver / Diamond roles.
- Automatic level-up messages.
- `/rank`, `/leaderboard`, `/level`, `/rank-settings`.
- Dynamic PNG rank card using the user's Discord banner as the background and avatar as the profile image.
- SQLite persistence, so no external database is required.

## Rank thresholds

- Level 1–24: Iron
- Level 25–49: Gold
- Level 50–74: Silver
- Level 75–100: Diamond

Level 0 exists before the first 100 XP.

## Hosting on Pterodactyl / Bot-Hosting

1. Create/upload the project files into `/home/container`.
2. In the server's Startup/Variables, add the values from `.env.example`, or create a `.env` file in `/home/container`.
3. Install dependencies with `npm install`.
4. Start with `npm start`.
5. Make sure the Discord bot has the required permissions and is above the four rank roles in the role hierarchy.

Recommended Node version: 20+.

## Discord bot permissions / intents

Enable these Gateway Intents in the Discord Developer Portal:
- Server Members Intent
- Message Content Intent

The bot needs permissions to:
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Manage Roles
- Read Message History

For voice XP it also needs to be able to view the relevant voice channels.

## Slash command deployment

The bot automatically registers the commands for `GUILD_ID` at startup.

## Role setup

The bot can find roles by exact names:
- Iron
- Gold
- Silver
- Diamond

For maximum reliability, you can put their role IDs into the `.env` file.

The bot removes other managed rank roles when assigning a new one.

## Rank card

The card uses:
- User Discord banner as the large background.
- User avatar as the circular profile image.
- Username, level, current/required XP and progress.
- Current rank.
- Clan text.
- Server rank.
- Voice time.
- Total messages.

If a user has no banner, the configured fallback image is used; otherwise a dark generated fallback is drawn.

## Important

Never share your Discord bot token publicly. Put it only in `.env` or your hosting panel's secret environment variables.
