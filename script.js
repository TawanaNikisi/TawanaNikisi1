const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const heroSearchForm = document.querySelector("#heroSearchForm");
if (heroSearchForm) {
  heroSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const location = document.querySelector("#heroLocation").value.trim();
    const type = document.querySelector("#heroType").value;

    const result = document.querySelector("#heroSearchResult");
    result.textContent = "Searching premium opportunities...";

    const params = new URLSearchParams();
    if (location) {
      params.set("q", location);
    }
    if (type !== "all") {
      params.set("type", type);
    }

    window.location.href = `listings.html${params.toString() ? `?${params.toString()}` : ""}`;
  });
}

const listingGrid = document.querySelector("#listingGrid");
if (listingGrid) {
  const maxPriceInput = document.querySelector("#maxPrice");
  const locationFilter = document.querySelector("#locationFilter");
  const typeFilter = document.querySelector("#typeFilter");
  const maxPriceLabel = document.querySelector("#maxPriceLabel");

  const searchParams = new URLSearchParams(window.location.search);
  const prefType = searchParams.get("type");
  if (prefType && ["land", "stand"].includes(prefType)) {
    typeFilter.value = prefType;
  }

  const loadListings = async () => {
    const maxPrice = Number(maxPriceInput.value);
    const location = locationFilter.value;
    const type = typeFilter.value;
    const query = searchParams.get("q") || "";

    maxPriceLabel.textContent = formatMoney(maxPrice);

    const url = new URL("/api/listings", window.location.origin);
    url.searchParams.set("maxPrice", String(maxPrice));
    url.searchParams.set("location", location);
    url.searchParams.set("type", type);
    if (query) {
      url.searchParams.set("q", query);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load listings");
    }

    const data = await response.json();
    return data.listings || [];
  };

  const renderListings = async () => {
    try {
      const listings = await loadListings();

      if (!listings.length) {
        listingGrid.innerHTML = '<article class="property-card"><h3>No exact matches found</h3><p>Try increasing your budget or selecting all property types.</p></article>';
        return;
      }

      listingGrid.innerHTML = listings
        .map(
          (item) => `
            <article class="property-card">
              <span class="badge">${item.type === "stand" ? "Serviced Stand" : "Prime Land"}</span>
              <h3>${item.title}</h3>
              <p><strong>Location:</strong> ${item.location}</p>
              <p><strong>Size:</strong> ${item.size}</p>
              <p><strong>Price:</strong> ${formatMoney(item.price)}</p>
              <button class="consult-btn dark full" data-id="${item.id}" type="button">Reserve Interest</button>
            </article>
          `
        )
        .join("");
    } catch (error) {
      listingGrid.innerHTML = '<article class="property-card"><h3>Unable to load listings</h3><p>Please refresh the page or try again shortly.</p></article>';
    }
  };

  [maxPriceInput, locationFilter, typeFilter].forEach((control) => {
    control.addEventListener("input", renderListings);
    control.addEventListener("change", renderListings);
  });

  listingGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) {
      return;
    }

    button.textContent = "Interest Sent ✓";
    button.disabled = true;
  });

  renderListings();
}

const storyBtn = document.querySelector("#storyBtn");
if (storyBtn) {
  storyBtn.addEventListener("click", () => {
    document.querySelector("#storyMessage").textContent =
      "Our advisors blend market insight with architecture-led planning to help you secure a standout property.";
  });
}

const visitForm = document.querySelector("#visitForm");
if (visitForm) {
  visitForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.querySelector("#name").value.trim();
    const phone = document.querySelector("#phone").value.trim();
    const visitDate = document.querySelector("#visitDate").value;
    const resultNode = document.querySelector("#bookingMessage");

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, visitDate })
      });

      const data = await response.json();
      if (!response.ok) {
        resultNode.textContent = data.error || "Could not complete booking.";
        return;
      }

      resultNode.textContent = `${data.message} Ref: ${data.reference}`;
      visitForm.reset();
    } catch (error) {
      resultNode.textContent = "Network error. Please try again.";
    }
  });
}

const calcBtn = document.querySelector("#calcBtn");
if (calcBtn) {
  calcBtn.addEventListener("click", async () => {
    const price = Number(document.querySelector("#price").value);
    const deposit = Number(document.querySelector("#deposit").value);
    const rate = Number(document.querySelector("#rate").value);
    const years = Number(document.querySelector("#years").value);

    try {
      const response = await fetch("/api/mortgage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, deposit, rate, years })
      });

      const data = await response.json();
      if (!response.ok) {
        document.querySelector("#mortgageResult").textContent = data.error || "Please provide valid mortgage values.";
        return;
      }

      document.querySelector("#mortgageResult").textContent = `Estimated repayment: ${formatMoney(data.monthlyPayment)} per month.`;
    } catch (error) {
      document.querySelector("#mortgageResult").textContent = "Network error. Please try again.";
    }
  });
}
