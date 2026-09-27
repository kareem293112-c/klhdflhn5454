const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Events
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");
const { startVoiceTracker } = require("./services/voice");
const onMessageCreate = require("./events/messageCreate");
const onVoiceStateUpdate = require("./events/voiceStateUpdate");

if (!config.token || !config.clientId || !config.guildId) {
  console.error("Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID. Fill .env first.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  const command = require(path.join(__dirname, "commands", file));
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.once(Events.ClientReady, async ready => {
  console.log(`Logged in as ${ready.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log(`Registered ${commands.length} guild slash commands.`);
  } catch (err) {
    console.error("Command registration failed:", err);
  }

  startVoiceTracker(client);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[command ${interaction.commandName}]`, err);
    const reply = { content: "حدث خطأ أثناء تنفيذ الأمر.", ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(reply).catch(() => {});
    else await interaction.reply(reply).catch(() => {});
  }
});

client.on(Events.MessageCreate, onMessageCreate);
client.on(Events.VoiceStateUpdate, onVoiceStateUpdate);

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(config.token);
