# CE Forms

Static, self-contained HTML forms for Catholic Energies.

| Folder | File | Live site |
|---|---|---|
| esco/ | ce-esco.html | escovendorreview.netlify.app (in test) |
| vendor/ | ce-vendor-v2.html | ce-vendor-form.netlify.app/ce-vendor-v2 |
| lead/ | ce-lead.html | ce-lead-form.netlify.app |
| solar/ | ce_sun_form_v2.html | ce-solar.netlify.app/ce_sun_form_v2 |
| community/ | ce-community.html | embedded in Squarespace |
| shared/ | (future brand assets) | |

Filenames match the deployed paths — do not rename without updating the
corresponding Netlify site.

## Backends

Not all forms post to the same place.

- **esco, vendor, lead, solar** → Heroku middleware → Salesforce
  (`ce-solar-middleware` serves lead and solar; `ce-vendor-middleware`
  serves vendor.)
- **community** → Google Apps Script web app → Google Sheet.
  Source in `community/apps-script/Code.gs`; the sheet's column order is
  defined there and must match the header row. The `/exec` endpoint URL is
  hardcoded in `ce-community.html` as `SHEET_ENDPOINT`.

Consolidating all five onto a single middleware is planned; the community
form requires a backend port, not just a field mapping.