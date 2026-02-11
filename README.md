# TawanaNikisi1

Luxury two-page real-estate website for land, stands, and mortgage planning.

## Run locally

```bash
python3 app.py
```

Then open:
- http://localhost:8000/
- http://localhost:8000/listings.html

## API endpoints

- `GET /api/listings`
  - Query params: `maxPrice`, `location`, `type`, `q`
- `POST /api/mortgage`
  - JSON body: `{ "price": number, "deposit": number, "rate": number, "years": number }`
- `POST /api/booking`
  - JSON body: `{ "name": string, "phone": string, "visitDate": "YYYY-MM-DD" }`
- `GET /health`

All frontend interactions use these API endpoints when served via `app.py`.
