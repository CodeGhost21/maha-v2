/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
// import { client } from "../output/discord";
// import async from "async";
import { User } from "../database/models/user";
import { Message } from "../database/models/message";

// import fs from "fs";
import path from "path";
// import { differenceInCalendarDays } from "date-fns";
// import { TextBasedChannel } from "discord.js";

// const keywords = ["goodmorning", "gm", "morning", "good morning"];

// const serverID = "746433728363888640";
// const gmChannelIDs = ["982155040963821618"];

// Fetch all gm messages
// const fetch_messages = () => {
//   return new Promise((resolve) => {
//     const _channel = client.channels.cache.get("982155040963821618");

//     const data: any[] = [];
//     if (_channel) {
//       const channel = _channel as TextBasedChannel;
//       channel.messages.fetch({ limit: 100 }).then((messages) => {
//         console.log(`Received ${messages.size} messages`);

//         // Iterate through the messages here with the variable "messages".
//         // messages.forEach((message) => console.log(message.content));
//         let before = Number(channel.lastMessageId);
//         console.log("Scraping before", before);

//         async.doUntil(
//           (callback) => {
//             channel.messages
//               .fetch({ limit: 100, before: String(before) })
//               .then((messages) => {
//                 if (messages.size > 0) {
//                   before = Number(messages.last()?.id || -1);

//                   const msgs = messages
//                     .filter(
//                       (m) =>
//                         !m.author.bot &&
//                         keywords.includes(
//                           m.content.replace(/[^a-z]/gi, "").toLowerCase()
//                         )
//                     )
//                     .map((m) => ({
//                       content: m.cleanContent,
//                       userTag: m.author.tag,
//                       userID: m.author.id,
//                       dateTime: m.createdAt,
//                     }));

//                   console.log(
//                     `Found ${msgs.length} messages. before: ${before}`
//                   );
//                   if (msgs.length > 0) {
//                     data.push(...msgs);
//                     fs.writeFileSync(
//                       "data.json",
//                       JSON.stringify(data, null, 4)
//                     );
//                   }
//                 } else before = 0;
//                 callback();
//               })
//               .catch((e: Error) => {
//                 console.log(e);
//                 callback();
//               });
//           },
//           (test) => test(null, Number(0) > Number(before)),
//           (err) => {
//             console.log(err);
//             fs.writeFileSync("data.json", JSON.stringify(data, null, 4));
//             resolve(true);
//           }
//         );
//       });
//     }
//   });
// };

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const data: any[] = require(path.resolve(process.env.ROOT_PATH, "data.json"));

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const users: any = require(path.resolve(process.env.ROOT_PATH, "users.json"));
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const msgs: any[] = require(path.resolve(process.env.ROOT_PATH, "msgs.json"));

// const processData = () => {
//   const users: any = {};
//   const msgs: any[] = [];

//   data
//     .sort(
//       (b, a) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
//     )
//     .map((d) => {
//       if (users[d.userID]) {
//         const lastGM = new Date(users[d.userID].lastGM);
//         const diff = differenceInCalendarDays(new Date(d.dateTime), lastGM);

//         console.log(d, diff, users[d.userID]);
//         if (diff == 1) {
//           users[d.userID].lastGM = d.dateTime;
//           users[d.userID].streak += 1;
//           users[d.userID].maxStreak =
//             users[d.userID].streak > users[d.userID].maxStreak
//               ? users[d.userID].streak
//               : users[d.userID].maxStreak;
//           users[d.userID].totalGMs += 1;
//         } else if (diff > 1) {
//           users[d.userID].lastGM = d.dateTime;
//           users[d.userID].streak = 1;
//           users[d.userID].totalGMs += 1;
//         }
//       } else {
//         users[d.userID] = {
//           userTag: d.userTag,
//           userID: d.userID,
//           streak: 1,
//           maxStreak: 1,
//           totalGMs: 1,
//           lastGM: d.dateTime,
//         };
//       }
//       msgs.push(d);
//     });

//   fs.writeFileSync("msgs.json", JSON.stringify(msgs, null, 4));
//   fs.writeFileSync("users.json", JSON.stringify(users, null, 4));
// };

const saveToDB = () => {
  return new Promise((resolve) => {
    User.insertMany(Object.values(users))
      .then(() => {
        console.log("Users inserted");
        Message.insertMany(msgs)
          .then(() => {
            console.log("Messages inserted");
            resolve(true);
          })
          .catch((e) => console.log(e));
      })
      .catch((e) => console.log(e));
  });
};

// client.on("error", console.error);
// client.on("ready", async () => {
//   console.log("Bot Ready!");
//   // fetch_messages().then(() => {
//   //   // processData().then(() => {
//   //   //   saveToDB().then(() => {
//   //   //     console.log("Done");
//   //   //     process.exit(0);
//   //   //   });
//   //   // });
//   // });
// });

saveToDB();
