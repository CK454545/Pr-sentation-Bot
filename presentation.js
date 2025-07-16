require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events, Collection } = require('discord.js');

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const PRESENTATION_CHANNEL_ID = process.env.PRESENTATION_CHANNEL_ID;
const BUTTON_CHANNEL_ID = process.env.BUTTON_CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember]
});

// Pour limiter à une présentation par membre
const presentedUsers = new Collection();

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  // Envoie le bouton si pas déjà présent (à commenter si déjà en place)
  const channel = await client.channels.fetch(BUTTON_CHANNEL_ID);
  if (channel) {
    const msg = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF7500')
          .setAuthor({ name: 'NXSTxPrésentation', iconURL: 'https://i.goopics.net/4pagyj.png' })
          .setTitle('🎤 Présente-toi à la communauté !')
          .setDescription([
            'Un petit mot pour te présenter ?',
            'Remplis le formulaire ci-dessous pour que tout le monde puisse te découvrir.',
            '',
            'Tu ne peux te présenter **qu\'une seule fois** – alors soigne ta présentation !',
            '',
            'Clique sur le bouton pour commencer :'
          ].join('\n'))
          .setFooter({ text: 'NXSTxPrésentation • Partage & Communauté', iconURL: 'https://i.goopics.net/4pagyj.png' })
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('open_presentation')
            .setLabel('📝 Se présenter')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'open_presentation') {
    // Vérifie si déjà présenté
    if (presentedUsers.has(interaction.user.id)) {
      return interaction.reply({ content: '❗ Tu as déjà réalisé ta présentation.', ephemeral: true });
    }

    // Ouvre le modal de présentation
    const modal = new ModalBuilder()
      .setCustomId('presentation_modal')
      .setTitle('Fais connaissance avec la communauté !')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('age')
            .setLabel("Ton âge (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder("ex : 20")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('ville')
            .setLabel("Ta ville / région")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder("ex : Orléans, Paris...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('rp_experience')
            .setLabel("Ton expérience RP / hobbies ?")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder("Débutant, confirmé, expert...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bio')
            .setLabel("Petite bio (qui es-tu ?)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder("Dis-nous qui tu es !")
        )
      );

    await interaction.showModal(modal);
  }

  // Gestion de la soumission du modal
  if (interaction.isModalSubmit() && interaction.customId === 'presentation_modal') {
    if (presentedUsers.has(interaction.user.id)) {
      return interaction.reply({ content: '❗ Tu as déjà réalisé ta présentation.', ephemeral: true });
    }
    presentedUsers.set(interaction.user.id, true);

    // Récupère les données du formulaire
    const age = interaction.fields.getTextInputValue('age') || 'Non précisé';
    const ville = interaction.fields.getTextInputValue('ville') || 'Non précisé';
    const rpExp = interaction.fields.getTextInputValue('rp_experience') || 'Non précisé';
    const bio = interaction.fields.getTextInputValue('bio');

    // Création de l'embed présentation
    const embed = new EmbedBuilder()
      .setColor('#FF7500')
      .setAuthor({ name: `Présentation de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setDescription([
        `👤 **Pseudo :** <@${interaction.user.id}>`,
        `🎂 **Âge :** ${age}`,
        `📍 **Ville / Région :** ${ville}`,
        `🎮 **Expérience RP / Hobbies :** ${rpExp}`,
        `📝 **Bio :**\n${bio}`
      ].join('\n'))
      .setFooter({ text: 'NXSTxPrésentation • Merci pour ta présentation !', iconURL: 'https://i.goopics.net/4pagyj.png' });

    // Poste dans le salon de présentation
    const presChannel = await client.channels.fetch(PRESENTATION_CHANNEL_ID);
    if (presChannel && presChannel.isTextBased()) {
      await presChannel.send({ embeds: [embed] });
    }
    await interaction.reply({ content: '✅ Merci pour ta présentation !', ephemeral: true });
  }
});

client.login(TOKEN);
