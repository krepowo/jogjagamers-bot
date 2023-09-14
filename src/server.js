import { Router } from 'itty-router';
import { verifyKey } from 'discord-interactions';
import {
   InteractionType,
   InteractionResponseType,
   MessageFlags,
} from 'discord-api-types/v10';

import { respond } from '../utils/respond';
import commands from './commands';
import { globalReq } from '../utils/request';

const router = Router();

router.get('/', (request, env) => {
   return new Response(`Halo bang`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
   try {
      const interaction = await request.json();
      if (interaction.type === InteractionType.Ping) {
         return new JsonResponse({
            type: InteractionResponseType.Pong
         });
      }

      if (interaction.type === InteractionType.ApplicationCommand) {
         console.log(`Handling ${interaction.data.name}`);
         if (interaction.data.name === 'invite') {
            const botId = env.DISCORD_APPLICATION_ID;
            return respond({
               type: InteractionResponseType.ChannelMessageWithSource,
               data: {
                  content: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${botId}&permissions=313344&scope=applications.commands%20bot)`,
                  flags: MessageFlags.Ephemeral
               }
            });
         }

         if (interaction.data.name === 'help') {
            const commandsSort = [];
            commands.map((command, index) => {
               commandsSort.push(`\`${index + 1}\` - ${command.help} - ${command.description}`);
            });

            return respond({
               type: InteractionResponseType.ChannelMessageWithSource,
               data: {
                  content: `${commandsSort.join("\n")}`
               }
            });
         }

         if (interaction.data.name === 'info') {
            // samp://157.254.166.66:7777
            const data = await globalReq('https://game-server-api.vercel.app/?game=samp&ip=jg-rp.com');
            let embed;
            if (data.error) {
               embed = {
                  "author": {
                     "icon_url": "https://cdn.discordapp.com/attachments/892336997488816131/1151115710496514118/jgicon.png",
                     "name": "Jogjagamers Discord Bot"
                  },
                  "description": "**Error:** Server is offline or unavailable.",
                  "color": 2250789,
                  "footer": {
                     "text": "Last updated:"
                  },
                  "timestamp": new Date().toISOString()
               };
            } else {
               embed = {
                  "author": {
                     "icon_url": "https://cdn.discordapp.com/attachments/892336997488816131/1151115710496514118/jgicon.png",
                     "name": "Jogjagamers Discord Bot"
                  },
                  "description": `Forum: https://jogjagamers.org\nUCP: https://ucp.jg-gta.com\nDiscord: https://discord.gg/W8ApTVX\n\n**Jogjagamers Reality Project**`,
                  "fields": [
                     {
                        "name": "Server Info",
                        "value": `- **Pemain online:** ${data.raw.numplayers}/${data.maxplayers} pemain\n- **Mode:** ${data.raw.gamemode}\n- **Bahasa:** ${data.raw.map}`,
                        "inline": false
                     },
                     {
                        "name": "Rule",
                        "value": `- **SA:MP version:** ${data.raw.rules.version}\n- **Map name:** ${data.raw.rules.mapname}\n- **ID cuaca:** ${data.raw.rules.weather}\n- **Waktu:** ${data.raw.rules.worldtime}`
                     },
                     {
                        "name": "Network",
                        "value": `- **IP:Port:** 139.99.125.54:7777 / ${data.connect}\n- **Ping:** ${data.ping}ms *(from \`Singapore - sin1\`)*\n- **Server location:** 🇸🇬 Singapore`
                     }
                  ],
                  "color": 2250789,
                  "footer": {
                     "text": "Last updated:"
                  },
                  "timestamp": new Date().toISOString()
               };
            }
            return respond({
               type: InteractionResponseType.ChannelMessageWithSource,
               data: {
                  embeds: [
                     embed
                  ]
               }
            });
         }

         if (interaction.data.name === "ip") {
            let embed = {
               "author": {
                  "icon_url": "https://cdn.discordapp.com/attachments/892336997488816131/1151115710496514118/jgicon.png",
                  "name": "Jogjagamers Discord Bot"
               },
               "description": "**IP:Port:**\n\`139.99.125.54:7777\` / \`jg-rp.com:7777\`",
               "color": 2250789,
               "footer": {
                  "text": "Last updated:"
               },
               "timestamp": new Date().toISOString()
            };

            return respond({
               type: InteractionResponseType.ChannelMessageWithSource,
               data: {
                  embeds: [
                     embed
                  ]
               }
            });
         }

         if (interaction.data.name === "players") {
            const data = await globalReq('https://game-server-api.vercel.app/?game=samp&ip=jg-rp.com');

            let embed = {
               "author": {
                  "icon_url": "https://cdn.discordapp.com/attachments/892336997488816131/1151115710496514118/jgicon.png",
                  "name": "Jogjagamers Discord Bot"
               },
               "description": `**Pemain online:** \n\`${data.raw.numplayers}/${data.maxplayers}\` pemain`,
               "color": 2250789,
               "footer": {
                  "text": "Last updated:"
               },
               "timestamp": new Date().toISOString()
            };

            return respond({
               type: InteractionResponseType.ChannelMessageWithSource,
               data: {
                  embeds: [
                     embed
                  ]
               }
            });
         }

         // no command response
         console.error('Unknown Command');
         return respond({ error: 'Unknown Type' }, { status: 400 });
      }
   } catch (error) {
      console.error(error);
   }
}
);
// Return "not found" response for all pages exept "/" route
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
   /**
    * Every request to a worker will start in the `fetch` method.
    * Verify the signature with the request, and dispatch to the router.
    * @param {*} request A Fetch Request object
    * @param {*} env A map of key/value pairs with env vars and secrets from the cloudflare env.
    * @returns
    */
   async fetch(request, env) {
      if (request.method === 'POST') {
         // Using the incoming headers, verify this request actually came from discord.
         const signature = request.headers.get('x-signature-ed25519');
         const timestamp = request.headers.get('x-signature-timestamp');
         // console.log(signature, timestamp, env.DISCORD_PUBLIC_KEY);
         const body = await request.clone().arrayBuffer();
         const isValidRequest = verifyKey(
            body,
            signature,
            timestamp,
            env.DISCORD_PUBLIC_KEY
         );
         if (!isValidRequest) {
            console.error('Invalid Request');
            return new Response('Bad request signature.', { status: 401 });
         }
      }

      // Dispatch the request to the appropriate route
      return router.handle(request, env);
   },
};