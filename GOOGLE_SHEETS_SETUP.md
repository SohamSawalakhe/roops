# Google Sheets Setup Guide

This guide walks you through setting up Google Sheets integration for the Roop Sari Palace customer form.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it `roopsari-customer-form` and click **Create**

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **Google Sheets API**
3. Click on it and press **Enable**

## Step 3: Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **+ Create Service Account**
3. Name: `roopsari-sheets` (or any name you prefer)
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**
6. Click on the newly created service account
7. Go to the **Keys** tab
8. Click **Add Key** → **Create new key** → **JSON** → **Create**
9. A JSON file will download. Keep it safe!

## Step 4: Extract Credentials from the JSON Key

From the downloaded JSON file, you need:

- `client_email` → Set as `GOOGLE_SERVICE_ACCOUNT_EMAIL` in your `.env`
- `private_key` → Set as `GOOGLE_PRIVATE_KEY` in your `.env`

> **Important**: When copying the private key, keep the `\n` characters and wrap the entire value in quotes in `.env`:
> ```
> GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
> ```

## Step 5: Create and Share the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it `Roop Sari Palace - Customers`
4. Add headers in Row 1: `Name | Phone | Email | Date`
5. Copy the **Sheet ID** from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - Set `SHEET_ID_HERE` as `GOOGLE_SHEETS_ID` in your `.env`
6. Click **Share** → paste the service account email (from Step 4)
7. Give it **Editor** access and click **Send**

## Step 6: Update Your `.env`

Add these to your `.env` file:

```env
GOOGLE_SHEETS_ID=your-sheet-id-from-step-5
GOOGLE_SERVICE_ACCOUNT_EMAIL=roopsari-sheets@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Verification

After setting up, submit a test customer through the form. Check your Google Sheet – a new row should appear with the customer's name, phone, email, and timestamp.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing credentials" warning in logs | Check all 3 Google env vars are set |
| "Permission denied" error | Make sure the sheet is shared with the service account email |
| Row not appearing | Check the Sheet ID and that the sheet tab is named "Sheet1" |
| Private key errors | Ensure `\n` characters are preserved and the key is wrapped in quotes |
