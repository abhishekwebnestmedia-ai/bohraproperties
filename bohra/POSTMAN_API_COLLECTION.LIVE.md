# Live API responses (collected locally)

I ran `scripts/gather_responses.ps1` against your local server and saved the raw responses to:

- File: [scripts/api_responses.json](scripts/api_responses.json)

This JSON contains captured responses for these endpoints:

- `GET /api/pleads`
- `GET /api/fleads`
- `GET /api/tasknotes` (returned 404 in this run)
- `GET /api/notifications`
- `GET /api/opera/spending`
- `GET /api/auth/users`

How would you like me to proceed?

- I can inline the full responses into `POSTMAN_API_COLLECTION.md` (makes the file very large). 
- Or I can update only specific endpoint example blocks in `POSTMAN_API_COLLECTION.md` to match the live shapes (recommended).

Reply with which option you prefer and which endpoints to update (or say `all`).