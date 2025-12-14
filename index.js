const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  Events,
  ChannelType,
  StringSelectMenuBuilder
} = require("discord.js");
const fs = require("fs");

/* ===== KONFIG ===== */
const TOKEN = process.env.TOKEN;


const LOG_CHANNEL_ID = "1449751973783015629";
const BAN_LOG_CHANNEL = "1449782648812605622";

const SUPPORT_ROLES = [
  "1449734235966541842",
  "1449734235966541841",
  "1449734235966541840"
];

const PANEL2_EDIT_ROLES = [
  "1449734235966541842",
  "1449734235966541841"
];

const PANEL2_ACCESS_ROLE = "1449734235966541839";

const BAN_ROLES = [
  "1449734235966541842",
  "1449734235966541841"
];

const PANEL2_FILE = "./panel2.json";
/* ================= */

/* ===== PANEL2 DATA ===== */
let panel2Data = {
  "Przydatne strony": "Dostęp do przydatnych stron",
  "Montaż & GFX": "Dostęp do paczek montażowych",
  "Programy": "Spotify, Premiere Pro, After Effects, Photoshop 2025",
  "Linki z Odcinków": "Linki bez reklam i przedpremierowo",
  "Darmowe hostingi": "Hosting stron + weryfikacja SMS"
};

if (fs.existsSync(PANEL2_FILE)) {
  panel2Data = JSON.parse(fs.readFileSync(PANEL2_FILE, "utf8"));
} else {
  fs.writeFileSync(PANEL2_FILE, JSON.stringify(panel2Data, null, 2));
}

const savePanel2 = () =>
  fs.writeFileSync(PANEL2_FILE, JSON.stringify(panel2Data, null, 2));

/* ================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const activeTickets = new Map();
const panel2Selected = new Map();

/* ===== READY ===== */
client.once("ready", async () => {
  console.log(`Zalogowano jako ${client.user.tag}`);

  await client.application.commands.create(
    new SlashCommandBuilder().setName("panel").setDescription("Panel ticketów")
  );

  await client.application.commands.create(
    new SlashCommandBuilder().setName("panel2").setDescription("Panel informacji")
  );

  await client.application.commands.create(
    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Banuje użytkownika")
      .addUserOption(o =>
        o.setName("kto").setDescription("Kogo zbanować").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("powod").setDescription("Powód").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("czas").setDescription("-1 = na zawsze, inaczej minuty").setRequired(true)
      )
  );

  await client.application.commands.create(
    new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Odbanowuje użytkownika")
      .addStringOption(o =>
        o.setName("id").setDescription("Discord ID użytkownika").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("powod").setDescription("Powód unbana").setRequired(true)
      )
  );
});

/* ===== INTERAKCJE ===== */
client.on(Events.InteractionCreate, async interaction => {

  /* ===== /BAN ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "ban") {

    if (!interaction.member.roles.cache.some(r => BAN_ROLES.includes(r.id)))
      return interaction.reply({ content: "❌ Brak uprawnień.", ephemeral: true });

    const user = interaction.options.getUser("kto");
    const reason = interaction.options.getString("powod");
    const time = interaction.options.getInteger("czas");

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member)
      return interaction.reply({ content: "❌ Nie znaleziono użytkownika.", ephemeral: true });

    try {
      await user.send(
        `🚫 **Zostałeś zbanowany na naszym Discordzie**\n\n` +
        `📄 Powód: ${reason}\n` +
        `⏱️ Czas: ${time === -1 ? "Na zawsze" : `${time} minut`}`
      );
    } catch {}

    if (time === -1) await member.ban({ reason });
    else await member.timeout(time * 60 * 1000, reason);

    const log = interaction.guild.channels.cache.get(BAN_LOG_CHANNEL);
    if (log) {
      log.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔨 BAN")
            .setColor(0xe74c3c)
            .addFields(
              { name: "Użytkownik", value: `${user} (${user.id})` },
              { name: "Moderator", value: `${interaction.user}` },
              { name: "Powód", value: reason },
              { name: "Czas", value: time === -1 ? "Na zawsze" : `${time} minut` }
            )
            .setTimestamp()
        ]
      });
    }

    return interaction.reply({ content: "✅ Ban nadany.", ephemeral: true });
  }

  /* ===== /UNBAN ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "unban") {

    if (!interaction.member.roles.cache.some(r => BAN_ROLES.includes(r.id)))
      return interaction.reply({ content: "❌ Brak uprawnień.", ephemeral: true });

    const id = interaction.options.getString("id");
    const reason = interaction.options.getString("powod");

    await interaction.guild.members.unban(id, reason).catch(() => {
      throw new Error("Nie można odbanować.");
    });

    try {
      const user = await client.users.fetch(id);
      await user.send(
        `✅ **Zostałeś odbanowany na naszym Discordzie**\n📄 Powód: ${reason}`
      );
    } catch {}

    const log = interaction.guild.channels.cache.get(BAN_LOG_CHANNEL);
    if (log) {
      log.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔓 UNBAN")
            .setColor(0x2ecc71)
            .addFields(
              { name: "ID użytkownika", value: id },
              { name: "Moderator", value: `${interaction.user}` },
              { name: "Powód", value: reason }
            )
            .setTimestamp()
        ]
      });
    }

    return interaction.reply({ content: "✅ Unban wykonany.", ephemeral: true });
  }
});

client.login(TOKEN);
