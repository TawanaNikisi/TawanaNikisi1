#!/usr/bin/env python3
"""Simple backend for the Estates & Stangs website.

- Serves static frontend files
- Provides JSON APIs for listings, mortgage calculation, and booking
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = 8000


@dataclass(frozen=True)
class Listing:
    id: int
    title: str
    type: str
    location: str
    price: int
    size: str


LISTINGS: list[Listing] = [
    Listing(1, "Northview Signature Stand", "stand", "north", 92000, "500m²"),
    Listing(2, "Eastfield Garden Land", "land", "east", 43000, "860m²"),
    Listing(3, "Southridge Elite Stand", "stand", "south", 76000, "560m²"),
    Listing(4, "Northview Horizon Plot", "land", "north", 51000, "730m²"),
    Listing(5, "Eastfield Royal Stand", "stand", "east", 110000, "450m²"),
    Listing(6, "Southridge Crown Land", "land", "south", 67000, "910m²"),
]


class WebsiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/listings":
            self.handle_get_listings(parsed.query)
            return

        if parsed.path == "/health":
            self.send_json(HTTPStatus.OK, {"status": "ok"})
            return

        if parsed.path == "/":
            self.path = "/index.html"

        super().do_GET()

    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path == "/api/mortgage":
            self.handle_mortgage()
            return

        if parsed.path == "/api/booking":
            self.handle_booking()
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found"})

    def handle_get_listings(self, raw_query: str):
        query = parse_qs(raw_query)
        max_price = self.safe_int(query.get("maxPrice", ["150000"])[0], 150000)
        location = query.get("location", ["all"])[0]
        property_type = query.get("type", ["all"])[0]
        term = query.get("q", [""])[0].strip().lower().replace(" ", "")

        filtered = []
        for listing in LISTINGS:
            if listing.price > max_price:
                continue
            if location != "all" and listing.location != location:
                continue
            if property_type != "all" and listing.type != property_type:
                continue
            normalized = (listing.title + listing.location).lower().replace(" ", "")
            if term and term not in normalized:
                continue
            filtered.append(asdict(listing))

        self.send_json(HTTPStatus.OK, {"listings": filtered})

    def handle_mortgage(self):
        payload = self.read_json_body()
        if payload is None:
            return

        price = self.safe_float(payload.get("price"), 0)
        deposit = self.safe_float(payload.get("deposit"), 0)
        annual_rate = self.safe_float(payload.get("rate"), 0)
        years = self.safe_int(payload.get("years"), 0)

        loan_amount = price - deposit
        if loan_amount <= 0 or annual_rate <= 0 or years <= 0:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid mortgage values"})
            return

        monthly_rate = (annual_rate / 100) / 12
        payments = years * 12
        monthly_payment = (
            loan_amount * monthly_rate * math.pow(1 + monthly_rate, payments)
        ) / (math.pow(1 + monthly_rate, payments) - 1)

        self.send_json(
            HTTPStatus.OK,
            {
                "loanAmount": round(loan_amount, 2),
                "monthlyPayment": round(monthly_payment, 2),
                "payments": payments,
            },
        )

    def handle_booking(self):
        payload = self.read_json_body()
        if payload is None:
            return

        name = str(payload.get("name", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        visit_date = str(payload.get("visitDate", "")).strip()

        if not name or not phone or not visit_date:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "All booking fields are required"})
            return

        try:
            datetime.strptime(visit_date, "%Y-%m-%d")
        except ValueError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "visitDate must be YYYY-MM-DD"})
            return

        self.send_json(
            HTTPStatus.OK,
            {
                "message": f"Thank you {name}. Your consultation is booked for {visit_date}.",
                "reference": f"BK-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            },
        )

    def read_json_body(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid Content-Length"})
            return None

        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return None

    def send_json(self, status: HTTPStatus, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    @staticmethod
    def safe_int(value, fallback: int) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return fallback

    @staticmethod
    def safe_float(value, fallback: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return fallback


def run_server():
    server = ThreadingHTTPServer((HOST, PORT), WebsiteHandler)
    print(f"Serving Estates & Stangs on http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
