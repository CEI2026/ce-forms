/**
 * CE Community Interest Form -> Google Sheet
 * Container-bound Apps Script. Appends one row per submission to the
 * "Responses" tab, in the same column order as the sheet header.
 *
 * SETUP (see the step-by-step Fred was given):
 *   1. Open the Google Sheet (converted from CE_Community_Interest.xlsx).
 *   2. Extensions -> Apps Script. Delete any starter code, paste this in, Save.
 *   3. Deploy -> New deployment -> type "Web app".
 *        Description: CE Community Form
 *        Execute as:  Me
 *        Who has access: Anyone
 *   4. Authorize when prompted. Copy the Web app URL (ends in /exec).
 *   5. Paste that URL into ce-community.html as SHEET_ENDPOINT.
 *
 * Re-deploy note: after editing this script, use
 *   Deploy -> Manage deployments -> (edit) -> Version: New version
 * so the /exec URL keeps working and picks up the change.
 */

var SHEET_NAME = 'Responses';

// Column order MUST match the sheet header row exactly.
var COLUMNS = [
  'timestamp',            // filled server-side
  'title',                // honorific: Sr./Fr./Bro./...
  'firstName',
  'lastName',
  'email',
  'role',
  'communityType',
  'communityName',
  'canonicalAuthorityId', // EI key (M###/W###/O###) when chosen from the lookup
  'interests',            // array -> comma-joined
  'notes',
  'sourceForm'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    var row = COLUMNS.map(function (key) {
      if (key === 'timestamp') return new Date();
      if (key === 'interests') {
        return Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || '');
      }
      return data[key] != null ? String(data[key]) : '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return ContentService
    .createTextOutput('CE Community Interest endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
