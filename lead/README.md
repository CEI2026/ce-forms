# ce-lead-form

Catholic Energies Lead Capture Form — Netlify frontend.

## Live URL
https://ce-lead-form.netlify.app

## What this is
A single-file HTML form embedded on catholicenergies.org via Squarespace iframe. Visitors select one of two paths — Energy Services or Partner in Mission — and submit contact and interest information, which is routed to Salesforce as a Lead record via the ce-solar-middleware Heroku app.

## Files
| File | Purpose |
|------|---------|
| `index.html` | The complete form — all HTML, CSS, and JS in one file |

## Dependencies
- **Middleware**: `ce-solar-middleware` Heroku app (`ce-solar-middleware-c282cb05db3f.herokuapp.com`) — hardcoded as `const MIDDLEWARE` in index.html. If the Heroku app is renamed, update this value before deploying.
- **Fonts**: Barlow and Barlow Condensed via Google Fonts (CDN)

## Deploying
1. Edit `index.html` in this repo
2. Go to [app.netlify.com/projects/ce-lead-form](https://app.netlify.com/projects/ce-lead-form)
3. Drag `index.html` into the Production deploys dropzone
4. Confirm "Published"
5. Test at https://ce-lead-form.netlify.app

## Salesforce record types
| Path | Record Type | ID |
|------|-------------|-----|
| Energy Services | Client | 012Jx000006r2MnIAI |
| Partner in Mission | Partner | 012Jx000006r2TFIAY |

## Related
- Middleware repo: [CEI2026/ce-solar-middleware](https://github.com/CEI2026/ce-solar-middleware)
- Heroku dashboard: https://dashboard.heroku.com
- Netlify dashboard: https://app.netlify.com

