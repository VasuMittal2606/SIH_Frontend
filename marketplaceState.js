// Reactive Shared Marketplace Store for ResidueLink
// Enables dynamic, bi-directional synchronization between Farmers, Biomass Buyers, and Govt Portals

const STORAGE_KEY = "residuelink_marketplace_state_v1";

// Initial seed data representing active regional activity in Punjab & Haryana
const defaultState = {
  buyerBids: [
    {
      id: "BID-101",
      buyerName: "GreenBio Energy Ltd.",
      location: "Ludhiana",
      targetTons: 500,
      offeredRate: 2150,
      radiusKm: 45,
      createdAt: new Date().toISOString(),
      status: "ACTIVE", // ACTIVE, ACCEPTED, NEGOTIATING
    },
    {
      id: "BID-102",
      buyerName: "Punjab Biomass Power Plant",
      location: "Moga",
      targetTons: 350,
      offeredRate: 2050,
      radiusKm: 30,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    {
      id: "BID-103",
      buyerName: "Haryana Agro Pellets Corp",
      location: "Karnal",
      targetTons: 600,
      offeredRate: 2100,
      radiusKm: 60,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    {
      id: "BID-104",
      buyerName: "Sutlej Bio-Fuels",
      location: "Patiala",
      targetTons: 250,
      offeredRate: 1980,
      radiusKm: 25,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
  ],
  farmListings: [
    {
      id: "FARM-101",
      farmerName: "Gurpreet Singh",
      location: "Ludhiana",
      crop: "Paddy",
      farmArea: 14,
      stubbleTons: 25.9,
      harvestDate: "16 Nov 2026",
      daysRemaining: 83,
      isPreHarvestListed: true,
      isManualOverride: false,
      status: "AVAILABLE", // AVAILABLE, OFFER_RECEIVED, CONTRACTED
    },
    {
      id: "FARM-102",
      farmerName: "Harmanjit Gill",
      location: "Moga",
      crop: "Paddy",
      farmArea: 20,
      stubbleTons: 37.0,
      harvestDate: "20 Nov 2026",
      daysRemaining: 87,
      isPreHarvestListed: true,
      isManualOverride: false,
      status: "AVAILABLE",
    },
    {
      id: "FARM-103",
      farmerName: "Rajesh Kumar",
      location: "Karnal",
      crop: "Mustard",
      farmArea: 10,
      stubbleTons: 8.5,
      harvestDate: "11 Dec 2026",
      daysRemaining: 108,
      isPreHarvestListed: false,
      isManualOverride: false,
      status: "AVAILABLE",
    },
  ],
  contracts: [
    {
      id: "CON-901",
      buyerName: "GreenBio Energy Ltd.",
      farmerName: "Gurpreet Singh",
      location: "Ludhiana",
      tonnage: 25.9,
      ratePerTon: 2150,
      totalValue: 55685,
      status: "CONFIRMED_PICKUP", // CONFIRMED_PICKUP, IN_PROGRESS, COMPLETED
      pickupDate: "18 Nov 2026",
    },
  ],
  chcFleet: [
    { hub: "Ludhiana Central CHC", district: "Ludhiana", totalBalers: 14, allocated: 11, status: "Active" },
    { hub: "Karnal Sector-4 CHC", district: "Karnal", totalBalers: 10, allocated: 7, status: "Active" },
    { hub: "Bathinda Rural CHC", district: "Bathinda", totalBalers: 12, allocated: 4, status: "Maintenance" },
    { hub: "Moga East CHC", district: "Moga", totalBalers: 8, allocated: 8, status: "Active" },
    { hub: "Kurukshetra Central", district: "Kurukshetra", totalBalers: 9, allocated: 9, status: "Active" },
  ],
};

// District distance estimation matrix (in km)
const DISTRICT_DISTANCES = {
  Ludhiana: { Ludhiana: 4.2, Moga: 18.5, Patiala: 42.0, Jalandhar: 28.0, Bathinda: 65.0, Karnal: 110.0 },
  Moga: { Ludhiana: 18.5, Moga: 5.0, Patiala: 55.0, Jalandhar: 35.0, Bathinda: 50.0, Karnal: 125.0 },
  Patiala: { Ludhiana: 42.0, Moga: 55.0, Patiala: 6.0, Jalandhar: 65.0, Bathinda: 75.0, Karnal: 70.0 },
  Karnal: { Ludhiana: 110.0, Moga: 125.0, Patiala: 70.0, Jalandhar: 130.0, Bathinda: 140.0, Karnal: 5.0 },
  Bathinda: { Ludhiana: 65.0, Moga: 50.0, Patiala: 75.0, Jalandhar: 80.0, Bathinda: 6.0, Karnal: 140.0 },
};

export function getEstimatedDistance(loc1, loc2) {
  if (!loc1 || !loc2) return 15.0;
  if (loc1 === loc2) return 6.4;
  return DISTRICT_DISTANCES[loc1]?.[loc2] || DISTRICT_DISTANCES[loc2]?.[loc1] || 24.5;
}

class MarketplaceStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not parse marketplace state from localStorage, using default", e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not save marketplace state", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState() {
    return this.state;
  }

  // --- BUYER ACTIONS ---
  addBuyerBid({ buyerName, location, targetTons, offeredRate, radiusKm }) {
    const newBid = {
      id: `BID-${Date.now().toString().slice(-4)}`,
      buyerName: buyerName || "Verified Biomass Enterprise",
      location: location || "Ludhiana",
      targetTons: parseFloat(targetTons) || 100,
      offeredRate: parseFloat(offeredRate) || 2000,
      radiusKm: parseFloat(radiusKm) || 50,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    };
    this.state.buyerBids.unshift(newBid);
    this.saveState();
    return newBid;
  }

  // --- FARMER ACTIONS ---
  acceptOffer(bidId, farmerDetails, stubbleTons) {
    const bid = this.state.buyerBids.find((b) => b.id === bidId);
    if (bid) {
      bid.status = "ACCEPTED";
      
      const newContract = {
        id: `CON-${Date.now().toString().slice(-4)}`,
        buyerName: bid.buyerName,
        farmerName: farmerDetails?.name || "Farmer Listing",
        location: farmerDetails?.location || bid.location,
        tonnage: parseFloat(stubbleTons) || 15.0,
        ratePerTon: bid.offeredRate,
        totalValue: (parseFloat(stubbleTons) || 15.0) * bid.offeredRate,
        status: "CONFIRMED_PICKUP",
        pickupDate: farmerDetails?.harvestDate || "Upcoming Harvest",
      };
      this.state.contracts.unshift(newContract);
      this.saveState();
      return newContract;
    }
    return null;
  }

  counterOffer(bidId, counterRate) {
    const bid = this.state.buyerBids.find((b) => b.id === bidId);
    if (bid) {
      bid.status = "NEGOTIATING";
      bid.offeredRate = parseFloat(counterRate) || bid.offeredRate;
      this.saveState();
    }
  }

  // --- SYNC FARMER STUBBLE LISTING ---
  syncFarmerListing(farmDetails, prediction, isManualOverride = false) {
    const existingIndex = this.state.farmListings.findIndex((f) => f.id === "FARM-USER");
    
    let daysRem = prediction.harvest_expected_in_days;
    if (daysRem === null || daysRem === undefined) {
      const match = String(prediction.predicted_harvest || "").match(/\d+/);
      daysRem = match ? parseInt(match[0], 10) : 30;
    }

    const listing = {
      id: "FARM-USER",
      farmerName: "Your Active Farm",
      location: farmDetails.location,
      crop: farmDetails.crop,
      farmArea: farmDetails.farmArea,
      stubbleTons: parseFloat(String(prediction.available_stubble).replace(/[^\d.]/g, "")) || 20.0,
      harvestDate: prediction.predicted_harvest,
      daysRemaining: daysRem,
      isPreHarvestListed: daysRem <= 14 || isManualOverride, // Automated 14-day rule or manual trigger
      isManualOverride: isManualOverride,
      status: "AVAILABLE",
    };

    if (existingIndex >= 0) {
      this.state.farmListings[existingIndex] = listing;
    } else {
      this.state.farmListings.unshift(listing);
    }
    this.saveState();
  }
}

export const marketplaceStore = new MarketplaceStore();
