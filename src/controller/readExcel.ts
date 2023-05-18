const { google } = require("googleapis");
import Bluebird from "bluebird";
import nconf from "nconf";
import { zelayRequest } from "../utils/zelayRequest";
import { sendRequest } from "../utils/sendRequest";
const auth = new google.auth.GoogleAuth({
  keyFile: "keys.json", //the key file
  // url to spreadsheets API
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

export const excelXp = async () => {
  const authClientObject = await auth.getClient();
  const googleSheetsInstance = await google.sheets({
    version: "v4",
    auth: authClientObject,
  });
  const spreadsheetId = "1EFXsPJEwY95zTk4aKKfOWJ0Tvk6sw2puNiXTk5nsrLo";
  const sheetRange = "sheet3!A32:K32";

  const data = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId, // spreadsheet id
    range: sheetRange, //range of cells to read from.
  });

  await Bluebird.mapSeries(data.data.values, async (item: any) => {
    // Smokeyjoethepipe 🥷%234046
    try {
      const url = `https://api.zealy.io/communities/themahadao/users/1367cf7e-f437-4647-b3fb-29fc6975cb42`;

      const result = await zelayRequest("get", url);
      // console.log("Community Spotlight Winners", item[7]);
      // console.log("Missed XPs", item[8]);
      // console.log("Extra XPs", item[9]);
      // console.log("Extra XPs-AMA", item[10]);

      // console.log(" ");

      // await userXp(result.id, "Community Spotlight Winners", item[7]);
      // await userXp(result.id, "Missed XPs", item[8]);
      // await userXp(result.id, "Extra XPs", item[9]);
      // await userXp(result.id, "Extra XPs", 400);
    } catch (e: any) {
      console.log(e.statusCode);
    }
  });
};
