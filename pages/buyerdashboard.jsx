import { useState, useEffect } from "react";
import {
  getBuyerActiveBids,
  createBid,
  getAvailableFarmsForBuyer,
  getUserContracts,
  getEstimatedDistance,
  isSupabaseConfigured,
} from "../supabaseClient";
import { translations } from "../translations";

const DISTRICTS = [
  "Ludhiana", "Patiala", "Sangrur", "Bathinda", "Jalandhar",
  "Amritsar", "Moga", "Firozpur", "Karnal", "Kurukshetra",
  "Ambala", "Kaithal", "Sonipat", "Panipat", "Hisar", "Sirsa"
];

export default function BuyerDashboard({ currentUser, lang }) {
  const t = translations[lang] || translations.en;
  const [bids, setBids] = useState([]);
  const [farms, setFarms] = useState([]);
  const [contracts, setContracts] = useState([]);

  // Purchase Requisition Form State
  const [reqForm, setReqForm] = useState({
    location: currentUser?.location || "Ludhiana",
    targetTons: 100,
    offeredRate: 2250,
    radiusKm: 50,
  });
  const [postNotice, setPostNotice] = useState("");

  // Unit Economics Financial Calculator
  const [unitEcon, setUnitEcon] = useState({
    negRate: 2150,
    freightRate: 160,
    handlingCost: 85,
  });

  const [counterOffers, setCounterOffers] = useState({});

  // Load User Data from Database
  const loadBuyerData = async () => {
    try {
      const myActiveBids = await getBuyerActiveBids(currentUser.user_id);
      setBids(myActiveBids || []);

      const availableFarms = await getAvailableFarmsForBuyer(currentUser.location, reqForm.radiusKm);
      setFarms(availableFarms || []);

      const myContracts = await getUserContracts(currentUser.user_id, "buyer");
      setContracts(myContracts || []);
    } catch (e) {
      console.error("Error loading buyer DB data", e);
    }
  };

  // Real-time synchronization across windows & storage updates
  useEffect(() => {
    loadBuyerData();

    const handleSync = () => loadBuyerData();
    window.addEventListener("storage", handleSync);
    window.addEventListener("oorvar_db_updated", handleSync);

    const interval = setInterval(loadBuyerData, 2500); // 2.5s polling for instant live responsiveness

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("oorvar_db_updated", handleSync);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Post New Purchase Requisition to Database
  const handlePostRequisition = async (e) => {
    e.preventDefault();
    if (!reqForm.targetTons || !reqForm.offeredRate || !reqForm.radiusKm) {
      setPostNotice("❌ Please fill in all purchase requisition parameters.");
      return;
    }

    const createdBid = await createBid({
      buyer_id: currentUser.user_id,
      buyer_name: currentUser.name || "Biomass Enterprise",
      location: reqForm.location,
      target_tons: parseFloat(reqForm.targetTons),
      offered_rate: parseFloat(reqForm.offeredRate),
      radius_km: parseFloat(reqForm.radiusKm),
      target_farmer_id: null,
    });

    setPostNotice(`✅ Broadcast Bid #${createdBid.id} Published! Stubble farmers can now view and pool supply to fulfill your order.`);
    await loadBuyerData();
    setTimeout(() => setPostNotice(""), 6000);
  };

  // Submit direct offer to a specific farm
  const handleMakeFarmOffer = async (farm) => {
    const customRate = prompt(`Enter purchase offer rate per ton (₹) for ${farm.farmer_name} (${farm.location}):`, "2250");
    if (customRate) {
      const newDirectBid = await createBid({
        buyer_id: currentUser.user_id,
        buyer_name: currentUser.name || "Biomass Enterprise",
        location: currentUser.location || "Ludhiana",
        target_tons: parseFloat(farm.available_stubble_tons) || 25,
        offered_rate: parseFloat(customRate),
        radius_km: 50,
        target_farmer_id: farm.farmer_id,
        target_farm_id: farm.id,
      });

      setCounterOffers((prev) => ({ ...prev, [farm.id]: customRate }));
      setPostNotice(`📤 Direct Bid of ₹${customRate}/Ton sent to ${farm.farmer_name}! It now appears in the Farmer's live bids.`);
      await loadBuyerData();
      setTimeout(() => setPostNotice(""), 5000);
    }
  };

  // Metrics & Active Deficit Calculations (Refreshes purely on active requisitions)
  const activeNeededTons = bids.reduce((sum, b) => sum + (parseFloat(b.target_tons) || 0), 0);
  const totalContractedTons = contracts.reduce((sum, c) => sum + (parseFloat(c.tonnage) || 0), 0);

  const totalLandedPerTon =
    (parseFloat(unitEcon.negRate) || 0) +
    (parseFloat(unitEcon.freightRate) || 0) +
    (parseFloat(unitEcon.handlingCost) || 0);

  return (
    <div>
      {/* Welcome */}
      <div className="welcome-section">
        <h1>🏭 {t.welcomeBuyer}, {currentUser?.name || "Biomass Buyer"}</h1>
        <p>
          ID: <strong>{currentUser?.user_id}</strong> • Location: <strong>{currentUser?.location}</strong>
          {isSupabaseConfigured && ` • ${t.connectedCloud}`}
        </p>
      </div>

      {postNotice && (
        <div className="alert-banner badge-success" style={{ marginBottom: "1.25rem", padding: "0.85rem 1.25rem" }}>
          {postNotice}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t.statTarget}</h3>
          <h2>{activeNeededTons.toFixed(1)} <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t.tons}</span></h2>
          <p>{bids.length} {t.statActiveBids}</p>
        </div>
        <div className="stat-card">
          <h3>{t.statFulfilled}</h3>
          <h2 className="stat-accent">{totalContractedTons.toFixed(1)} <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t.tons}</span></h2>
          <p>{contracts.length} Deals</p>
        </div>
        <div className="stat-card">
          <h3>{t.statActiveBids}</h3>
          <h2 style={{ color: activeNeededTons > 0 ? "#f87171" : "#34d399" }}>
            {activeNeededTons.toFixed(1)} <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t.tons}</span>
          </h2>
          <p>{activeNeededTons > 0 ? t.needMoreVolume : "Fulfilled"}</p>
        </div>
        <div className="stat-card">
          <h3>{t.statAvgRate}</h3>
          <h2>₹{totalLandedPerTon.toLocaleString()}</h2>
          <p>Per {t.tons}</p>
        </div>
      </div>

      {/* ================= ACTIVE NEEDED TONS & DEFICIT MONITOR ================= */}
      <div className="glass-panel" style={{ border: activeNeededTons > 0 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)", boxShadow: "0 0 25px rgba(16, 185, 129, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2>⚡ {t.buyerSub}</h2>
          </div>
          <span className={`badge ${activeNeededTons === 0 ? "badge-success" : "badge-warning"}`}>
            {activeNeededTons === 0 ? "All Requisitions Fulfilled" : `${activeNeededTons.toFixed(1)} ${t.tons} Needed`}
          </span>
        </div>

        {/* Deficit Metric Highlights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.2rem",
          background: "rgba(0,0,0,0.25)",
          padding: "1.25rem",
          borderRadius: "12px",
          marginTop: "1rem"
        }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.statTarget}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>{activeNeededTons.toFixed(1)} {t.tons}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{bids.length} Open Requisition(s)</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.needMoreVolume}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: activeNeededTons > 0 ? "#f87171" : "#34d399" }}>
              {activeNeededTons.toFixed(1)} {t.tons}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.statFulfilled}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34d399" }}>{totalContractedTons.toFixed(1)} {t.tons}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{contracts.length} Completed Deals</div>
          </div>
        </div>
      </div>

      {/* Optimized Supply Feed (Proximity Priority) */}
      <div className="glass-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>🔎 {t.supplyFeedTitle}</h2>
          <span className="badge badge-success">({farms.length})</span>
        </div>

        {farms.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1.5rem 0", textAlign: "center" }}>
            🌱 No uncontracted stubble listings currently in this area.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.farmerId} / Location</th>
                <th>{t.previewCrop}</th>
                <th>{t.statStubble}</th>
                <th>{t.statHarvest}</th>
                <th>Distance</th>
                <th>Type</th>
                <th>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => {
                const distance = getEstimatedDistance(currentUser.location, farm.location);
                const customOffer = counterOffers[farm.id];

                return (
                  <tr key={farm.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{farm.farmer_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📍 {farm.location} • {farm.farm_area} {t.acres}</div>
                    </td>
                    <td>🌾 {farm.crop}</td>
                    <td>
                      <strong style={{ color: "var(--primary-light)", fontSize: "1.05rem" }}>
                        {farm.available_stubble_tons} {t.tons}
                      </strong>
                    </td>
                    <td>
                      <div>{farm.predicted_harvest}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {farm.harvest_expected_in_days <= 0 ? "Harvest Ready" : `${farm.harvest_expected_in_days} ${t.daysRemaining}`}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{distance.toFixed(1)} km</span>
                    </td>
                    <td>
                      <span className={`badge ${farm.is_pre_harvest_listed ? "badge-success" : "badge-warning"}`}>
                        {farm.is_pre_harvest_listed ? t.smartContractActive : t.preHarvestWindow}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn action-btn-primary"
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
                        onClick={() => handleMakeFarmOffer(farm)}
                      >
                        {customOffer ? `Bid ₹${customOffer} Sent ✓` : "Submit Direct Bid"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Two Column Section: Purchase Requisition + Unit Economics */}
      <div className="main-grid">
        {/* Post Buy Requirement */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <h2>📦 {t.createBidTitle}</h2>
          <form onSubmit={handlePostRequisition}>
            <label className="field-label">{t.bidTargetDistrict}</label>
            <select
              className="field-select"
              value={reqForm.location}
              onChange={(e) => setReqForm({ ...reqForm, location: e.target.value })}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d} (Punjab/Haryana)</option>
              ))}
            </select>

            <label className="field-label">{t.bidRequiredTons}</label>
            <input
              type="number"
              className="field-input"
              value={reqForm.targetTons}
              onChange={(e) => setReqForm({ ...reqForm, targetTons: e.target.value })}
              required
            />

            <label className="field-label">{t.bidOfferedRate}</label>
            <input
              type="number"
              className="field-input"
              value={reqForm.offeredRate}
              onChange={(e) => setReqForm({ ...reqForm, offeredRate: e.target.value })}
              required
            />

            <label className="field-label">Max Procurement Radius (km)</label>
            <input
              type="number"
              className="field-input"
              value={reqForm.radiusKm}
              onChange={(e) => setReqForm({ ...reqForm, radiusKm: e.target.value })}
              required
            />

            <div className="btn-row">
              <button type="submit" className="action-btn action-btn-primary">
                {t.btnPostBid}
              </button>
            </div>
          </form>
        </div>

        {/* Unit Economics & Landed Cost Calculator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            <h2>📊 Unit Economics & Landed Cost Analysis</h2>

            <label className="field-label">Negotiated Commodity Price (₹/{t.tons})</label>
            <input
              type="number"
              className="field-input"
              value={unitEcon.negRate}
              onChange={(e) => setUnitEcon({ ...unitEcon, negRate: e.target.value })}
            />

            <label className="field-label">Freight Estimate (₹/{t.tons})</label>
            <input
              type="number"
              className="field-input"
              value={unitEcon.freightRate}
              onChange={(e) => setUnitEcon({ ...unitEcon, freightRate: e.target.value })}
            />

            <label className="field-label">Handling & Loading (₹/{t.tons})</label>
            <input
              type="number"
              className="field-input"
              value={unitEcon.handlingCost}
              onChange={(e) => setUnitEcon({ ...unitEcon, handlingCost: e.target.value })}
            />

            <div className="harvest-display" style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <p>Total Landed Cost</p>
              <div className="harvest-date-big" style={{ fontSize: "2.2rem" }}>
                ₹{totalLandedPerTon.toLocaleString()} <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>/ {t.tons}</span>
              </div>
            </div>
          </div>

          {/* Your Active Broadcast Bids */}
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            <h2>📢 {t.statActiveBids} ({bids.length})</h2>
            {bids.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "0.8rem 0" }}>
                No active pending bids.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bid ID</th>
                    <th>{t.requiredVolume}</th>
                    <th>{t.offeredRate}</th>
                    <th>Radius</th>
                    <th>{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.id}</strong></td>
                      <td>{b.target_tons} {t.tons}</td>
                      <td>₹{parseFloat(b.offered_rate).toLocaleString()}</td>
                      <td>{b.radius_km} km</td>
                      <td><span className="badge badge-success">ACTIVE</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History for this Buyer */}
      <div className="glass-panel" style={{ marginTop: "1.5rem" }}>
        <h2>📜 {t.buyerContractsTitle}</h2>
        {contracts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>{t.noContracts}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.contractId}</th>
                <th>Supplier / Pool</th>
                <th>Location</th>
                <th>{t.tonnage}</th>
                <th>{t.rate}</th>
                <th>{t.totalValue}</th>
                <th>{t.pickupDate}</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>{c.farmer_name}</td>
                  <td>{c.location}</td>
                  <td>{c.tonnage} {t.tons}</td>
                  <td>₹{parseFloat(c.rate_per_ton).toLocaleString()} / {t.tons}</td>
                  <td><strong style={{ color: "var(--primary-light)" }}>₹{parseFloat(c.total_value).toLocaleString()}</strong></td>
                  <td>{c.pickup_date}</td>
                  <td><span className="badge badge-success">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}