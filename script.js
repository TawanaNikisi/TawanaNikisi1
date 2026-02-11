const listings = [
  { id: 1, title: "Northview Signature Stand", type: "stand", location: "north", price: 92000, size: "500m²" },
  { id: 2, title: "Eastfield Garden Land", type: "land", location: "east", price: 43000, size: "860m²" },
  { id: 3, title: "Southridge Elite Stand", type: "stand", location: "south", price: 76000, size: "560m²" },
  { id: 4, title: "Northview Horizon Plot", type: "land", location: "north", price: 51000, size: "730m²" },
  { id: 5, title: "Eastfield Royal Stand", type: "stand", location: "east", price: 110000, size: "450m²" },
  { id: 6, title: "Southridge Crown Land", type: "land", location: "south", price: 67000, size: "910m²" }
];

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
  const normalize = (value) => value.toLowerCase().replaceAll(" ", "");

  const renderListings = () => {
    const maxPrice = Number(maxPriceInput.value);
    const location = locationFilter.value;
    const type = typeFilter.value;
    const query = normalize(searchParams.get("q") || "");

    maxPriceLabel.textContent = formatMoney(maxPrice);

    const filtered = listings.filter((item) => {
      const matchesLocation = location === "all" || item.location === location;
      const matchesType = type === "all" || item.type === type;
      const matchesBudget = item.price <= maxPrice;
      const matchesQuery = !query || normalize(item.title).includes(query) || normalize(item.location).includes(query);

      return matchesLocation && matchesType && matchesBudget && matchesQuery;
    });

    if (!filtered.length) {
      listingGrid.innerHTML = '<article class="property-card"><h3>No exact matches found</h3><p>Try increasing your budget or selecting all property types.</p></article>';
      return;
    }

    listingGrid.innerHTML = filtered
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

    const property = listings.find((item) => item.id === Number(button.dataset.id));
    if (!property) {
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
  visitForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#name").value.trim();
    const date = document.querySelector("#visitDate").value;

    document.querySelector("#bookingMessage").textContent = `Thank you ${name}. Your consultation is booked for ${date}.`;
    visitForm.reset();
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
  calcBtn.addEventListener("click", () => {
    const price = Number(document.querySelector("#price").value);
    const deposit = Number(document.querySelector("#deposit").value);
    const annualRate = Number(document.querySelector("#rate").value) / 100;
    const years = Number(document.querySelector("#years").value);

    const loanAmount = price - deposit;
    if (loanAmount <= 0 || annualRate <= 0 || years <= 0) {
      document.querySelector("#mortgageResult").textContent = "Please provide valid mortgage values.";
      return;
    }

    const monthlyRate = annualRate / 12;
    const payments = years * 12;
    const monthlyPayment =
      (loanAmount * monthlyRate * (1 + monthlyRate) ** payments) /
      ((1 + monthlyRate) ** payments - 1);

    document.querySelector("#mortgageResult").textContent = `Estimated repayment: ${formatMoney(monthlyPayment)} per month.`;
  });
}
