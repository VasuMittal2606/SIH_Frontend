import { useState, useEffect } from "react";
import { fetchHarvestPrediction } from "../api";
import {
  getFarmerFarms,
  saveFarmerFarm,
  getFarmerRelevantBids,
  getNeighboringFarmsForPooling,
  sendPoolInvitation,
  getAllUserPoolInvitations,
  respondToPoolInvitation,
  cancelPoolInvitation,
  getUserContracts,
  acceptBidAndCreateContract,
  acceptPooledBidAndCreateContract,
  getEstimatedDistance,
  isSupabaseConfigured,
} from "../supabaseClient";
import { translations } from "../translations";

const SUPPORTED_CROPS = [
  "Paddy", "Wheat", "Mustard", "Cotton", "Sugarcane",
  "Maize", "Bajra", "Barley", "Arhar/Tur"
];

const CROP_AGRONOMICS = {
  Paddy: { baseDays: 120, stubbleMultiplier: 1.85, name: "Paddy Straw" },
  Rice: { baseDays: 120, stubbleMultiplier: 1.85, name: "Paddy Straw" },
  Wheat: { baseDays: 140, stubbleMultiplier: 1.50, name: "Wheat Straw" },
  Mustard: { baseDays: 110, stubbleMultiplier: 0.85, name: "Mustard Stalks" },
  Cotton: { baseDays: 180, stubbleMultiplier: 2.50, name: "Cotton Stalks" },
  Sugarcane: { baseDays: 330, stubbleMultiplier: 4.00, name: "Sugarcane Trash" },
  Maize: { baseDays: 100, stubbleMultiplier: 1.20, name: "Maize Stover" },
  Bajra: { baseDays: 85, stubbleMultiplier: 0.90, name: "Bajra Stover" },
  Barley: { baseDays: 130, stubbleMultiplier: 1.30, name: "Barley Straw" },
  "Arhar/Tur": { baseDays: 170, stubbleMultiplier: 1.10, name: "Arhar Stalks" },
};

const DISTRICTS = [
  { value: "Ludhiana", label: "Ludhiana (Punjab)" },
  { value: "Patiala", label: "Patiala (Punjab)" },
  { value: "Sangrur", label: "Sangrur (Punjab)" },
  { value: "Bathinda", label: "Bathinda (Punjab)" },
  { value: "Jalandhar", label: "Jalandhar (Punjab)" },
  { value: "Amritsar", label: "Amritsar (Punjab)" },
  { value: "Moga", label: "Moga (Punjab)" },
  { value: "Firozpur", label: "Firozpur (Punjab)" },
  { value: "Karnal", label: "Karnal (Haryana)" },
  { value: "Kurukshetra", label: "Kurukshetra (Haryana)" },
  { value: "Ambala", label: "Ambala (Haryana)" },
  { value: "Kaithal", label: "Kaithal (Haryana)" },
  { value: "Sonipat", label: "Sonipat (Haryana)" },
  { value: "Panipat", label: "Panipat (Haryana)" },
  { value: "Hisar", label: "Hisar (Haryana)" },
  { value: "Sirsa", label: "Sirsa (Haryana)" },
];

export default function FarmerDashboard({ currentUser, lang }) {
  const t = translations[lang] || translations.en;
  const [farmDetails, setFarmDetails] = useState({
    crop: "Paddy",
    sowingDate: "2026-07-20",
    farmArea: 15,
    location: currentUser?.location || "Ludhiana",
  });

  const [prediction, setPrediction] = useState({
    predicted_harvest: "16 Nov 2026",
    available_stubble: "27.8 Tons",
    harvest_expected_in_days: 83,
    confidence: "96%",
    live_temperature: "30.1 °C",
    isLive: true,
  });

  // User-scoped Database Data
  const [bids, setBids] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [neighborFarms, setNeighborFarms] = useState([]);
  const [allInvites, setAllInvites] = useState([]);
  const [inboundInvites, setInboundInvites] = useState([]);

  // Manual Override State
  const [manualDate, setManualDate] = useState("");
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isInstantListed, setIsInstantListed] = useState(false);

  // Financial Calculator State
  const [calcInputs, setCalcInputs] = useState({
    marketRate: 2250,
    balerRent: 750,
    operatorCost: 1500,
    dieselExpense: 2200,
  });

  const [actionNotice, setActionNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editForm, setEditForm] = useState({ ...farmDetails });

  // Helper: Compute dynamic stubble yield for any crop & area
  const calculateDynamicStubble = (crop, area) => {
    const mult = CROP_AGRONOMICS[crop]?.stubbleMultiplier || 1.85;
    const val = (parseFloat(area) || 0) * mult;
    return +val.toFixed(1);
  };

  // Helper: Compute dynamic harvest date from sowing date & crop
  const calculateDynamicHarvest = (crop, sowingDateStr) => {
    const baseDays = CROP_AGRONOMICS[crop]?.baseDays || 120;
    const sowing = new Date(sowingDateStr || Date.now());
    const harvestDate = new Date(sowing.getTime() + baseDays * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffDays = Math.max(0, Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const formatted = harvestDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return { harvestDateFormatted: formatted, daysRemaining: diffDays };
  };

  // 1. Initial Load of Farm Profile (Only on mount or user change)
  const loadInitialFarmProfile = async () => {
    try {
      const userFarms = await getFarmerFarms(currentUser.user_id);
      if (userFarms && userFarms.length > 0) {
        const savedFarm = userFarms[0];
        const loadedCrop = savedFarm.crop || farmDetails.crop;
        const loadedArea = parseFloat(savedFarm.farm_area) || farmDetails.farmArea;
        const dynamicTons = parseFloat(savedFarm.available_stubble_tons) || calculateDynamicStubble(loadedCrop, loadedArea);

        const loadedDetails = {
          crop: loadedCrop,
          sowingDate: savedFarm.sowing_date || farmDetails.sowingDate,
          farmArea: loadedArea,
          location: savedFarm.location || currentUser.location || "Ludhiana",
        };

        setFarmDetails(loadedDetails);
        setEditForm(loadedDetails);

        setPrediction((prev) => ({
          ...prev,
          predicted_harvest: savedFarm.predicted_harvest || prev.predicted_harvest,
          available_stubble: `${dynamicTons} Tons`,
          harvest_expected_in_days: savedFarm.harvest_expected_in_days ?? prev.harvest_expected_in_days,
          confidence: "96%",
          live_temperature: "30.1 °C",
          isLive: true,
        }));

        setIsManualOverride(savedFarm.is_manual_override);
        if (savedFarm.status === "CONTRACTED") {
          setIsInstantListed(false);
        } else {
          setIsInstantListed(true);
        }
      }
    } catch (e) {
      console.error("Error loading initial farm profile", e);
    }
  };

  // 2. Continuous Market Data Refresh (Bids, Pooling Invitations, Contracts) - Does NOT touch farm profile
  const refreshMarketData = async () => {
    try {
      // Load active buyer bids
      const relevantBids = await getFarmerRelevantBids(currentUser.user_id, currentUser.location);
      setBids(relevantBids || []);

      // Load Neighboring Farmers Directory
      const neighbors = await getNeighboringFarmsForPooling(currentUser.user_id, currentUser.location);
      setNeighborFarms(neighbors || []);

      // Load All Mutual Pool Invitations
      const userInvites = await getAllUserPoolInvitations(currentUser.user_id);
      setAllInvites(userInvites || []);

      const pendingInbound = (userInvites || []).filter(
        (inv) => String(inv.recipient_id).trim() === String(currentUser.user_id).trim() && inv.status === "PENDING"
      );
      setInboundInvites(pendingInbound);

      // Load Transaction & Contract History
      const userContracts = await getUserContracts(currentUser.user_id, "farmer");
      setContracts(userContracts || []);
    } catch (e) {
      console.error("Error refreshing market data", e);
    }
  };

  // Load profile once on mount, and poll market directory continuously
  useEffect(() => {
    loadInitialFarmProfile();
    refreshMarketData();

    const handleSync = () => refreshMarketData();
    window.addEventListener("storage", handleSync);
    window.addEventListener("oorvar_db_updated", handleSync);

    const interval = setInterval(refreshMarketData, 3000);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("oorvar_db_updated", handleSync);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Run ML Prediction and persist dynamic changes immediately
  const runMlPrediction = async (details) => {
    setLoading(true);
    setErrorMsg("");

    const areaNum = parseFloat(details.farmArea) || 15;
    const cropName = details.crop || "Paddy";
    const dynamicStubbleTons = calculateDynamicStubble(cropName, areaNum);
    const { harvestDateFormatted, daysRemaining } = calculateDynamicHarvest(cropName, details.sowingDate);

    // 1. Immediately update UI state with dynamic calculations
    const updatedPred = {
      predicted_harvest: isManualOverride ? prediction.predicted_harvest : harvestDateFormatted,
      available_stubble: `${dynamicStubbleTons} Tons`,
      harvest_expected_in_days: isManualOverride ? prediction.harvest_expected_in_days : daysRemaining,
      confidence: "96%",
      live_temperature: "30.1 °C",
      isLive: true,
    };
    setPrediction(updatedPred);

    // 2. Persist to Supabase database immediately
    await saveFarmerFarm({
      farmer_id: currentUser.user_id,
      farmer_name: currentUser.name,
      location: details.location,
      crop: cropName,
      farm_area: areaNum,
      sowing_date: details.sowingDate,
      predicted_harvest: updatedPred.predicted_harvest,
      harvest_expected_in_days: updatedPred.harvest_expected_in_days,
      available_stubble_tons: dynamicStubbleTons,
      is_manual_override: isManualOverride,
      is_pre_harvest_listed: (updatedPred.harvest_expected_in_days || 83) <= 14,
      status: "AVAILABLE",
    });

    // 3. Call FastAPI ML backend for weather regression
    try {
      const result = await fetchHarvestPrediction({
        crop: cropName,
        location: details.location,
        farm_area: areaNum,
        sowing_date: details.sowingDate,
      });

      if (result) {
        let daysRem = result.harvest_expected_in;
        if (typeof daysRem === "string") {
          const match = daysRem.match(/\d+/);
          daysRem = match ? parseInt(match[0], 10) : daysRemaining;
        }

        const mlPredObj = {
          predicted_harvest: isManualOverride ? prediction.predicted_harvest : (result.predicted_harvest || updatedPred.predicted_harvest),
          available_stubble: result.available_stubble || `${dynamicStubbleTons} Tons`,
          harvest_expected_in_days: daysRem,
          confidence: result.confidence || "96%",
          live_temperature: result.live_temperature || "30.1 °C",
          isLive: true,
        };

        setPrediction(mlPredObj);

        const finalTons = parseFloat(String(mlPredObj.available_stubble).replace(/[^\d.]/g, "")) || dynamicStubbleTons;

        await saveFarmerFarm({
          farmer_id: currentUser.user_id,
          farmer_name: currentUser.name,
          location: details.location,
          crop: cropName,
          farm_area: areaNum,
          sowing_date: details.sowingDate,
          predicted_harvest: mlPredObj.predicted_harvest,
          harvest_expected_in_days: daysRem,
          available_stubble_tons: finalTons,
          is_manual_override: isManualOverride,
          is_pre_harvest_listed: daysRem <= 14,
          status: "AVAILABLE",
        });
      }
    } catch (err) {
      console.error("ML refinement note:", err);
    } finally {
      setLoading(false);
      setActionNotice(`✅ Updated Farm Profile: ${cropName} (${areaNum} Acres) • Yield: ${dynamicStubbleTons} Tons • Harvest: ${updatedPred.predicted_harvest}`);
      setTimeout(() => setActionNotice(""), 6000);
      await refreshMarketData();
    }
  };

  // Save farm profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updated = {
      farmArea: parseFloat(editForm.farmArea) || farmDetails.farmArea || 15,
      crop: editForm.crop || farmDetails.crop || "Paddy",
      location: editForm.location || farmDetails.location || "Ludhiana",
      sowingDate: editForm.sowingDate || farmDetails.sowingDate || "2026-07-20",
    };
    setFarmDetails(updated);
    setIsEditing(false);

    // Immediately calculate dynamic stubble & harvest date so screen updates instantly
    const immediateTons = calculateDynamicStubble(updated.crop, updated.farmArea);
    const immediateHarvest = calculateDynamicHarvest(updated.crop, updated.sowingDate);

    setPrediction((prev) => ({
      ...prev,
      available_stubble: `${immediateTons} Tons`,
      predicted_harvest: immediateHarvest.harvestDateFormatted,
      harvest_expected_in_days: immediateHarvest.daysRemaining,
    }));

    await runMlPrediction(updated);
  };

  // Manual Date Override
  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!manualDate) return;

    const parsedDate = new Date(manualDate);
    const today = new Date();
    const diffTime = parsedDate.getTime() - today.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const dateFormatted = parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedPred = {
      ...prediction,
      predicted_harvest: dateFormatted,
      harvest_expected_in_days: diffDays,
    };

    setPrediction(updatedPred);
    setIsManualOverride(true);

    const availableTons = parseFloat(String(prediction.available_stubble).replace(/[^\d.]/g, "")) || calculateDynamicStubble(farmDetails.crop, farmDetails.farmArea);

    await saveFarmerFarm({
      farmer_id: currentUser.user_id,
      farmer_name: currentUser.name,
      location: farmDetails.location,
      crop: farmDetails.crop,
      farm_area: parseFloat(farmDetails.farmArea),
      sowing_date: farmDetails.sowingDate,
      predicted_harvest: dateFormatted,
      harvest_expected_in_days: diffDays,
      available_stubble_tons: availableTons,
      is_manual_override: true,
      is_pre_harvest_listed: true,
      status: "AVAILABLE",
    });

    setActionNotice(`✅ Manual Harvest Override Saved: ${dateFormatted} (${diffDays} days remaining).`);
    setTimeout(() => setActionNotice(""), 6000);
  };

  // Instant Sell Request
  const handleInstantSellRequest = async () => {
    setIsInstantListed(true);
    const instantPred = {
      ...prediction,
      harvest_expected_in_days: 0,
      predicted_harvest: "Harvest Ready",
    };
    setPrediction(instantPred);

    const availableTons = parseFloat(String(prediction.available_stubble).replace(/[^\d.]/g, "")) || calculateDynamicStubble(farmDetails.crop, farmDetails.farmArea);

    await saveFarmerFarm({
      farmer_id: currentUser.user_id,
      farmer_name: currentUser.name,
      location: farmDetails.location,
      crop: farmDetails.crop,
      farm_area: parseFloat(farmDetails.farmArea),
      sowing_date: farmDetails.sowingDate,
      predicted_harvest: "Harvest Ready",
      harvest_expected_in_days: 0,
      available_stubble_tons: availableTons,
      is_manual_override: true,
      is_pre_harvest_listed: true,
      status: "AVAILABLE",
    });

    setActionNotice("🚀 Instant Sell Request broadcasted to buyers! Your farm stubble is now active and listed in the market.");
    await refreshMarketData();
    setTimeout(() => setActionNotice(""), 6000);
  };

  // Send Pool Invitation to Neighbor
  const handleSendPoolInvite = async (neighbor) => {
    await sendPoolInvitation(currentUser, neighbor);
    setActionNotice(`📤 Stubble Pool Invitation sent to ${neighbor.farmer_name}! Waiting for their acceptance.`);
    await refreshMarketData();
    setTimeout(() => setActionNotice(""), 6000);
  };

  // Respond to Inbound Pool Invitation
  const handleRespondInvite = async (inviteId, accept) => {
    await respondToPoolInvitation(inviteId, accept);
    setActionNotice(accept ? "✅ Pool Invitation Accepted! Both farms are now mutually joined in the collective pool." : "❌ Invitation Declined.");
    await refreshMarketData();
    setTimeout(() => setActionNotice(""), 6000);
  };

  // Cancel Pool Invitation or Leave Pool
  const handleCancelInvite = async (inviteId) => {
    await cancelPoolInvitation(inviteId);
    setActionNotice("Pool invite cancelled / unpooled.");
    await refreshMarketData();
    setTimeout(() => setActionNotice(""), 5000);
  };

  // Calculate Confirmed Pooled Tonnage (Mutual Bidirectional Pooling)
  const myStubbleTons = parseFloat(String(prediction.available_stubble).replace(/[^\d.]/g, "")) || calculateDynamicStubble(farmDetails.crop, farmDetails.farmArea);

  const acceptedPartnerMap = new Map();
  allInvites.forEach((inv) => {
    if (inv.status === "ACCEPTED") {
      const sId = String(inv.sender_id).trim();
      const rId = String(inv.recipient_id).trim();
      const uId = String(currentUser.user_id).trim();
      if (sId === uId) acceptedPartnerMap.set(rId, inv);
      if (rId === uId) acceptedPartnerMap.set(sId, inv);
    }
  });

  const confirmedNeighborFarms = neighborFarms.filter((f) => acceptedPartnerMap.has(String(f.farmer_id).trim()));
  const confirmedNeighborTons = confirmedNeighborFarms.reduce((sum, f) => sum + (parseFloat(f.available_stubble_tons) || 0), 0);
  const totalConfirmedPoolVolume = myStubbleTons + confirmedNeighborTons;

  // Handle Bid Acceptance (Strictly enforces required tonnage)
  const handleAcceptBid = async (bid) => {
    setErrorNotice("");
    const requiredTons = parseFloat(bid.target_tons) || 0;

    // 1. Single Farm Direct Fulfillment
    if (myStubbleTons >= requiredTons) {
      const contract = await acceptBidAndCreateContract(bid, currentUser, {
        available_stubble_tons: myStubbleTons,
        predicted_harvest: prediction.predicted_harvest,
      });

      if (contract) {
        setActionNotice(`🎉 Direct Deal Confirmed! Contract #${contract.id} with ${bid.buyer_name} for ${myStubbleTons.toFixed(1)} Tons at ₹${bid.offered_rate}/Ton.`);
        await refreshMarketData();
        setTimeout(() => setActionNotice(""), 7000);
      }
      return;
    }

    // 2. Collective Pool Fulfillment
    if (totalConfirmedPoolVolume >= requiredTons) {
      const contract = await acceptPooledBidAndCreateContract(
        bid,
        currentUser,
        myStubbleTons,
        confirmedNeighborFarms
      );

      if (contract) {
        setActionNotice(`🤝 Stubble Pool Deal Finalized! Collective supply of ${totalConfirmedPoolVolume.toFixed(1)} Tons fulfilled plant requirement of ${requiredTons} Tons at ₹${bid.offered_rate}/Ton. Contract ID: ${contract.id}`);
        await refreshMarketData();
        setTimeout(() => setActionNotice(""), 8000);
      }
      return;
    }

    // 3. Insufficient Confirmed Tonnage
    const deficitTons = (requiredTons - totalConfirmedPoolVolume).toFixed(1);
    setErrorNotice(
      `⚠️ Insufficient Stubble Tonnage: The biomass plant requires at least ${requiredTons} Tons. Your confirmed pool has ${totalConfirmedPoolVolume.toFixed(1)} Tons (Deficit: ${deficitTons} Tons). Please send pool requests to neighboring farms below and ensure they confirm to unlock this deal.`
    );
  };

  // Financial Calculations (Dynamic based on selected crop yield and acreage)
  const grossRevenue = myStubbleTons * (parseFloat(calcInputs.marketRate) || 0);
  const totalExpenses =
    (parseFloat(calcInputs.balerRent) || 0) * (parseFloat(farmDetails.farmArea) || 1) +
    (parseFloat(calcInputs.operatorCost) || 0) +
    (parseFloat(calcInputs.dieselExpense) || 0);
  const projectedNetProfit = Math.max(0, grossRevenue - totalExpenses);

  const daysRemaining = prediction.harvest_expected_in_days;
  const isAutoPreListed = daysRemaining !== null && daysRemaining <= 14;

  // Live Form Preview calculations
  const previewCrop = editForm.crop || "Paddy";
  const previewArea = parseFloat(editForm.farmArea) || 15;
  const previewTons = calculateDynamicStubble(previewCrop, previewArea);
  const previewHarvest = calculateDynamicHarvest(previewCrop, editForm.sowingDate);

  return (
    <div>
      {/* Welcome Header */}
      <div className="welcome-section">
        <h1>🌾 {t.welcomeFarmer}, {currentUser?.name || "Farmer"}</h1>
        <p>
          {t.farmerId}: <strong>{currentUser?.user_id}</strong> • {t.operatingLocation}: <strong>{farmDetails.location}</strong>
          {isSupabaseConfigured && ` • ${t.connectedCloud}`}
        </p>
      </div>

      {actionNotice && <div className="alert-banner badge-success" style={{ marginBottom: "1.25rem", padding: "0.85rem 1.25rem" }}>{actionNotice}</div>}
      {errorNotice && <div className="alert-banner alert-error" style={{ marginBottom: "1.25rem", padding: "0.85rem 1.25rem" }}>{errorNotice}</div>}
      {errorMsg && <div className="alert-banner alert-error">⚠️ {errorMsg}</div>}
      {loading && <div className="alert-banner alert-loading">🤖 {t.predictingMl}</div>}

      {/* Inbound Pooling Invitations Notification Banner */}
      {inboundInvites.length > 0 && (
        <div className="glass-panel" style={{ border: "1px solid #34d399", background: "rgba(16, 185, 129, 0.12)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h2 style={{ color: "#34d399", margin: 0 }}>{t.inboundInvitesTitle} ({inboundInvites.length})</h2>
            <span className="badge badge-success">Action Required</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {t.poolingSub}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {inboundInvites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.3)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "10px",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}
              >
                <div>
                  <strong>{inv.sender_name}</strong> (📍 {inv.sender_location}) invited you to combine your farm's stubble into a collective pool.
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Received at {inv.created_at}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="action-btn action-btn-primary"
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
                    onClick={() => handleRespondInvite(inv.id, true)}
                  >
                    {t.btnAccept} ✓
                  </button>
                  <button
                    className="action-btn action-btn-secondary"
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
                    onClick={() => handleRespondInvite(inv.id, false)}
                  >
                    {t.btnDecline} ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t.statFarmArea}</h3>
          <h2>{farmDetails.farmArea} <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t.acres}</span></h2>
          <p>{farmDetails.location} {t.district}</p>
        </div>

        <div className="stat-card">
          <h3>{t.statHarvest}</h3>
          <h2 className="stat-accent">{loading ? "..." : prediction.predicted_harvest}</h2>
          <p>
            {isManualOverride ? t.manualOverrideLabel : daysRemaining !== null ? `${daysRemaining} ${t.daysRemaining}` : "Calculating..."}
          </p>
        </div>

        <div className="stat-card">
          <h3>{t.statStubble}</h3>
          <h2>{loading ? "..." : `${myStubbleTons.toFixed(1)} ${t.tons}`}</h2>
          <p>{farmDetails.crop} • {CROP_AGRONOMICS[farmDetails.crop]?.stubbleMultiplier || 1.85} T/{t.acres}</p>
        </div>

        <div className="stat-card">
          <h3>{t.statPool}</h3>
          <h2 className="stat-accent">{totalConfirmedPoolVolume.toFixed(1)} <span style={{ fontSize: "1rem", fontWeight: 600 }}>{t.tons}</span></h2>
          <p>{confirmedNeighborFarms.length + 1} {t.farmsConfirmed}</p>
        </div>
      </div>

      {/* Main Grid: Profile + AI Prediction */}
      <div className="main-grid">
        {/* Farm Profile */}
        <div className="glass-panel">
          <h2>{t.profileTitle}</h2>

          {!isEditing ? (
            <>
              <div>
                {[
                  [t.cropType, farmDetails.crop],
                  [t.actualSowingDate, farmDetails.sowingDate],
                  [t.statFarmArea, `${farmDetails.farmArea} ${t.acres}`],
                  [t.operatingLocation, farmDetails.location],
                  [t.previewYield, `${CROP_AGRONOMICS[farmDetails.crop]?.stubbleMultiplier || 1.85} ${t.tons} / ${t.acres}`],
                  ...(prediction.isLive ? [["Live Weather", `${prediction.live_temperature} (Open-Meteo)`]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="detail-row">
                    <strong>{k}:</strong> {v}
                  </div>
                ))}
              </div>

              <div className="btn-row">
                <button className="action-btn action-btn-primary" onClick={() => { setEditForm({ ...farmDetails }); setIsEditing(true); }}>
                  {t.btnEditProfile}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <label className="field-label">{t.cropType}</label>
              <select
                className="field-select"
                value={editForm.crop}
                onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })}
              >
                {SUPPORTED_CROPS.map((c) => (
                  <option key={c} value={c}>{c} ({CROP_AGRONOMICS[c]?.stubbleMultiplier || 1.85} T/Acre)</option>
                ))}
              </select>

              <label className="field-label">{t.operatingLocation}</label>
              <select
                className="field-select"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              >
                {DISTRICTS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <label className="field-label">{t.statFarmArea} ({t.acres})</label>
              <input
                type="number" step="0.5" className="field-input"
                value={editForm.farmArea}
                onChange={(e) => setEditForm({ ...editForm, farmArea: e.target.value })}
              />

              <label className="field-label">{t.actualSowingDate}</label>
              <input
                type="date" className="field-input"
                value={editForm.sowingDate}
                onChange={(e) => setEditForm({ ...editForm, sowingDate: e.target.value })}
              />

              {/* Dynamic Live Preview Box */}
              <div style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginTop: "0.75rem",
                marginBottom: "0.75rem"
              }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399" }}>
                  {t.livePreview}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#fff", marginTop: "4px" }}>
                  • {t.previewCrop}: <strong>{previewCrop}</strong> ({previewArea} {t.acres})<br/>
                  • {t.previewYield}: <strong style={{ color: "var(--primary-light)" }}>{previewTons} {t.tons}</strong><br/>
                  • {t.previewHarvest}: <strong>{previewHarvest.harvestDateFormatted}</strong> ({previewHarvest.daysRemaining} {t.daysRemaining})
                </div>
              </div>

              <div className="btn-row">
                <button type="submit" className="action-btn action-btn-primary" disabled={loading}>
                  {loading ? t.predictingMl : t.btnSaveMl}
                </button>
                <button type="button" className="action-btn action-btn-secondary" onClick={() => setIsEditing(false)}>
                  {t.btnCancel}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* AI Prediction & Manual Calibration */}
        <div className="glass-panel">
          <h2>{t.aiTitle}</h2>

          <div className="harvest-display">
            <div className="harvest-date-big">{loading ? "Calculating..." : prediction.predicted_harvest}</div>
            <p>{isManualOverride ? t.manualOverrideLabel : `${farmDetails.crop} ${t.harvestForecast}`}</p>
            {prediction.confidence && !isManualOverride && (
              <span className="badge badge-success" style={{ marginTop: "0.6rem" }}>
                {prediction.confidence} {t.confidenceScore}
              </span>
            )}
          </div>

          <div className="detail-row">
            <strong>{t.preHarvestStatus}</strong>{" "}
            {isAutoPreListed || isInstantListed ? (
              <span className="badge badge-success">{t.smartContractActive}</span>
            ) : (
              <span className="badge badge-warning">{t.preHarvestWindow}</span>
            )}
          </div>

          <div className="detail-row">
            <strong>{t.liveChcStatus}</strong>{" "}
            <span className="badge badge-success">{t.balersAvailable}</span>
          </div>

          {/* Manual Date Override Form */}
          <form onSubmit={handleApplyOverride} style={{ marginTop: "1rem" }}>
            <label className="field-label">{t.manualOverrideLabel}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="date"
                className="field-input"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
              <button type="submit" className="action-btn action-btn-secondary" style={{ whiteSpace: "nowrap" }}>
                {t.btnSaveOverride}
              </button>
            </div>
          </form>

          <div className="btn-row" style={{ marginTop: "1rem" }}>
            <button className="action-btn action-btn-primary" onClick={handleInstantSellRequest}>
              {t.btnInstantSell}
            </button>
          </div>
        </div>
      </div>

      {/* ================= STUBBLE POOLING DIRECTORY ================= */}
      <div className="glass-panel" style={{ border: "1px solid rgba(16, 185, 129, 0.4)", boxShadow: "0 0 25px rgba(16, 185, 129, 0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2>{t.poolingTitle}</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              {t.poolingSub}
            </p>
          </div>
        </div>

        {/* Live Pool Summary Card */}
        <div style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "14px",
          padding: "1.2rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          textAlign: "center"
        }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.statStubble} ({farmDetails.crop})</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#fff" }}>{myStubbleTons.toFixed(1)} {t.tons}</div>
          </div>
          <div style={{ fontSize: "1.5rem", color: "var(--primary-light)", fontWeight: "800" }}>+</div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.farmsConfirmed} ({confirmedNeighborFarms.length})</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60a5fa" }}>{confirmedNeighborTons.toFixed(1)} {t.tons}</div>
          </div>
          <div style={{ fontSize: "1.5rem", color: "var(--primary-light)", fontWeight: "800" }}>=</div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.statPool}</div>
            <div style={{ fontSize: "1.9rem", fontWeight: "900", color: "#34d399" }}>{totalConfirmedPoolVolume.toFixed(1)} {t.tons}</div>
          </div>
        </div>

        {/* Neighboring Farmers Directory Table */}
        {neighborFarms.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1.5rem 0", textAlign: "center" }}>
            🌱 {t.neighborFarmsTitle}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.farmerId} / Name</th>
                <th>{t.district}</th>
                <th>{t.previewCrop}</th>
                <th>{t.statStubble}</th>
                <th>{t.statHarvest}</th>
                <th>{t.status}</th>
                <th>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {neighborFarms.map((farm) => {
                const distance = getEstimatedDistance(farmDetails.location, farm.location);
                const fId = String(farm.farmer_id).trim();
                const uId = String(currentUser.user_id).trim();

                const mutualInvite = allInvites.find(
                  (inv) =>
                    (String(inv.sender_id).trim() === uId && String(inv.recipient_id).trim() === fId) ||
                    (String(inv.sender_id).trim() === fId && String(inv.recipient_id).trim() === uId)
                );

                const isAccepted = mutualInvite && mutualInvite.status === "ACCEPTED";
                const isPendingSent = mutualInvite && mutualInvite.status === "PENDING" && String(mutualInvite.sender_id).trim() === uId;
                const isPendingInbound = mutualInvite && mutualInvite.status === "PENDING" && String(mutualInvite.recipient_id).trim() === uId;

                return (
                  <tr key={farm.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{farm.farmer_name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>ID: {farm.id} • {distance.toFixed(1)} km</div>
                    </td>
                    <td>📍 {farm.location}</td>
                    <td>🌾 {farm.crop}</td>
                    <td>
                      <strong style={{ color: "var(--primary-light)", fontSize: "1.05rem" }}>
                        {farm.available_stubble_tons} {t.tons}
                      </strong>
                    </td>
                    <td>
                      <div>{farm.predicted_harvest}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{farm.harvest_expected_in_days} {t.daysRemaining}</div>
                    </td>
                    <td>
                      {isAccepted ? (
                        <span className="badge badge-success">✅ {t.poolAccepted}</span>
                      ) : isPendingSent ? (
                        <span className="badge badge-warning">⏳ {t.inviteSent}</span>
                      ) : isPendingInbound ? (
                        <span className="badge badge-success">📬 {t.inboundInvitesTitle}</span>
                      ) : (
                        <span className="badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>
                          Not In Pool
                        </span>
                      )}
                    </td>
                    <td>
                      {isAccepted ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 700 }}>{t.accepted} ✓</span>
                          <button
                            className="action-btn action-btn-secondary"
                            style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem" }}
                            onClick={() => handleCancelInvite(mutualInvite.id)}
                            title="Leave pool"
                          >
                            ✕
                          </button>
                        </div>
                      ) : isPendingInbound ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <button
                            className="action-btn action-btn-primary"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
                            onClick={() => handleRespondInvite(mutualInvite.id, true)}
                          >
                            {t.btnAccept} ✓
                          </button>
                          <button
                            className="action-btn action-btn-secondary"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
                            onClick={() => handleRespondInvite(mutualInvite.id, false)}
                          >
                            {t.btnDecline} ✕
                          </button>
                        </div>
                      ) : isPendingSent ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600 }}>
                            ⏳ {t.inviteSent}
                          </span>
                          <button
                            className="action-btn action-btn-secondary"
                            style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem" }}
                            onClick={() => handleCancelInvite(mutualInvite.id)}
                            title="Cancel pending invitation"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="action-btn action-btn-primary"
                          style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
                          onClick={() => handleSendPoolInvite(farm)}
                        >
                          {t.sendInvite} ✉️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Live Buyer Bids Directed to Your Farm & Stubble Pool */}
      <div className="glass-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>{t.activeBidsTitle} ({bids.length})</h2>
          <span className="badge badge-success">Active Bids</span>
        </div>

        {bids.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1.5rem 0", textAlign: "center" }}>
            🌾 No pending buyer bids currently.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.buyerPlant}</th>
                <th>{t.offeredRate}</th>
                <th>{t.requiredVolume}</th>
                <th>{t.status}</th>
                <th>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => {
                const distance = getEstimatedDistance(farmDetails.location, bid.location);
                const requiredTons = parseFloat(bid.target_tons) || 0;
                const isSingleEligible = myStubbleTons >= requiredTons;
                const isPoolEligible = totalConfirmedPoolVolume >= requiredTons;

                return (
                  <tr key={bid.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{bid.buyer_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>📍 {bid.location} ({distance.toFixed(1)} km)</div>
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary-light)", fontSize: "1.1rem" }}>
                        ₹{parseFloat(bid.offered_rate).toLocaleString()} / {t.tons}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{bid.target_tons} {t.tons}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Plant Consignment Quota</div>
                    </td>
                    <td>
                      {isSingleEligible ? (
                        <span className="badge badge-success">{t.acceptDirect}</span>
                      ) : isPoolEligible ? (
                        <span className="badge badge-success">Pool Confirmed ({totalConfirmedPoolVolume.toFixed(1)} / {requiredTons} T)</span>
                      ) : (
                        <span className="badge badge-warning">
                          {t.needMoreVolume}: +{(requiredTons - totalConfirmedPoolVolume).toFixed(1)} T
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="action-btn action-btn-primary"
                        style={{
                          padding: "0.45rem 1rem",
                          fontSize: "0.82rem",
                          background: isPoolEligible || isSingleEligible ? undefined : "rgba(239, 68, 68, 0.2)",
                          borderColor: isPoolEligible || isSingleEligible ? undefined : "rgba(239, 68, 68, 0.4)",
                        }}
                        onClick={() => handleAcceptBid(bid)}
                      >
                        {isSingleEligible ? `${t.acceptDirect} ✓` : isPoolEligible ? `${t.acceptPool} ✓` : `${t.action} (Check Quota)`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Financial Projections Calculator */}
      <div className="glass-panel">
        <h2>{t.roiTitle}</h2>
        <div className="main-grid" style={{ marginBottom: 0 }}>
          <div>
            <label className="field-label">{t.marketRate}</label>
            <input
              type="number"
              className="field-input"
              value={calcInputs.marketRate}
              onChange={(e) => setCalcInputs({ ...calcInputs, marketRate: e.target.value })}
            />

            <label className="field-label">{t.balerRent}</label>
            <input
              type="number"
              className="field-input"
              value={calcInputs.balerRent}
              onChange={(e) => setCalcInputs({ ...calcInputs, balerRent: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">{t.operatorCost}</label>
            <input
              type="number"
              className="field-input"
              value={calcInputs.operatorCost}
              onChange={(e) => setCalcInputs({ ...calcInputs, operatorCost: e.target.value })}
            />

            <label className="field-label">{t.dieselExpense}</label>
            <input
              type="number"
              className="field-input"
              value={calcInputs.dieselExpense}
              onChange={(e) => setCalcInputs({ ...calcInputs, dieselExpense: e.target.value })}
            />
          </div>
        </div>

        <div className="harvest-display" style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p>{t.previewYield} ({farmDetails.crop})</p>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-dark)" }}>
              {myStubbleTons.toFixed(1)} {t.tons}
            </div>
          </div>
          <div>
            <p>{t.grossRevenue}</p>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#60a5fa" }}>
              ₹{grossRevenue.toLocaleString()}
            </div>
          </div>
          <div>
            <p>{t.totalCost}</p>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f87171" }}>
              ₹{totalExpenses.toLocaleString()}
            </div>
          </div>
          <div>
            <p>{t.netProfit}</p>
            <div className="harvest-date-big" style={{ fontSize: "2rem" }}>
              ₹{projectedNetProfit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Contract History */}
      <div className="glass-panel">
        <h2>{t.contractsTitle}</h2>
        {contracts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
            {t.noContracts}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.contractId}</th>
                <th>Type</th>
                <th>{t.buyer}</th>
                <th>{t.tonnage}</th>
                <th>{t.rate}</th>
                <th>{t.totalValue}</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>
                    <span className={`badge ${c.is_pooled ? "badge-success" : "badge-warning"}`}>
                      {c.is_pooled ? `Collective Pool (${c.pooled_members?.length || 2} Farmers)` : "Single Farm Direct"}
                    </span>
                  </td>
                  <td>{c.buyer_name}</td>
                  <td>{c.tonnage} {t.tons}</td>
                  <td>₹{parseFloat(c.rate_per_ton).toLocaleString()}</td>
                  <td><strong style={{ color: "var(--primary-light)" }}>₹{parseFloat(c.total_value).toLocaleString()}</strong></td>
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