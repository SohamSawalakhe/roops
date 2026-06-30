import "./env.js";
import { google } from "googleapis";

/**
 * Appends a customer row to the configured Google Sheet.
 * Fails silently (logs error) so it doesn't block the main form submission.
 */
export async function appendToSheet(name, phone, email) {
  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!sheetId || !clientEmail || !privateKey) {
      console.warn(
        "[Google Sheets] Missing credentials – skipping sheet sync."
      );
      return;
    }

    const auth = new google.auth.JWT(clientEmail, null, privateKey, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);

    const sheets = google.sheets({ version: "v4", auth });

    const now = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phone, email, now]],
      },
    });

    console.log("[Google Sheets] Row appended successfully.");
  } catch (error) {
    console.error("[Google Sheets] Failed to append row:", error.message);
  }
}
