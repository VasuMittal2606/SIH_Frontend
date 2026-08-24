import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "https://your-project.supabase.co" &&
  !SUPABASE_URL.includes("your-project-id")
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const LOCAL_STORAGE_DB_KEY = "oorvar_production_live_v11";

// Clean Zero-Data Initial Schema
const emptyDb = {
  profiles: [],
  farms: [],
  bids: [],
  contracts: [],
  poolInvites: [],
  otpStore: {},
};

export function getLocalDb() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles) && Array.isArray(parsed.farms) && Array.isArray(parsed.bids)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading local DB", e);
  }
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(emptyDb));
  return emptyDb;
}

export function saveLocalDb(db) {
  try {
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event("oorvar_db_updated"));
  } catch (e) {
    console.warn("Error saving local DB", e);
  }
}

export function resetEntireDatabase() {
  localStorage.removeItem(LOCAL_STORAGE_DB_KEY);
  localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(emptyDb));
  window.dispatchEvent(new Event("oorvar_db_updated"));
}

// Distance Matrix
const DISTRICT_DISTANCES = {
  Ludhiana: { Ludhiana: 4.2, Moga: 18.5, Patiala: 42.0, Jalandhar: 28.0, Bathinda: 65.0, Karnal: 110.0, Sangrur: 52.0 },
  Moga: { Ludhiana: 18.5, Moga: 5.0, Patiala: 55.0, Jalandhar: 35.0, Bathinda: 50.0, Karnal: 125.0, Sangrur: 60.0 },
  Patiala: { Ludhiana: 42.0, Moga: 55.0, Patiala: 6.0, Jalandhar: 65.0, Bathinda: 75.0, Karnal: 70.0, Sangrur: 40.0 },
  Sangrur: { Ludhiana: 52.0, Moga: 60.0, Patiala: 40.0, Jalandhar: 75.0, Bathinda: 55.0, Karnal: 85.0, Sangrur: 5.0 },
  Karnal: { Ludhiana: 110.0, Moga: 125.0, Patiala: 70.0, Jalandhar: 130.0, Bathinda: 140.0, Karnal: 5.0, Sangrur: 85.0 },
  Bathinda: { Ludhiana: 65.0, Moga: 50.0, Patiala: 75.0, Jalandhar: 80.0, Bathinda: 6.0, Karnal: 140.0, Sangrur: 55.0 },
};

export function getEstimatedDistance(loc1, loc2) {
  if (!loc1 || !loc2) return 12.0;
  if (loc1 === loc2) return 5.0;
  return DISTRICT_DISTANCES[loc1]?.[loc2] || DISTRICT_DISTANCES[loc2]?.[loc1] || 22.0;
}

// ================= AUTHENTICATION & USER MANAGEMENT =================

export async function registerUserProfile({ phone, role, name, location, password }) {
  const cleanPhone = phone.trim().replace(/\s+/g, "");
  const cleanName = name.trim();

  if (isSupabaseConfigured) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", cleanPhone)
      .single();

    if (existing) {
      throw new Error("Account already exists with this phone number. Please login.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        user_id: cleanPhone,
        role,
        name: cleanName,
        location: location || "Ludhiana",
      }])
      .select()
      .single();

    if (error) throw error;

    if (role === "farmer") {
      const defaultFarmArea = 12;
      const defaultStubbleTons = +(defaultFarmArea * 1.85).toFixed(1);
      await supabase.from("farms").insert([{
        farmer_id: cleanPhone,
        farmer_name: cleanName,
        location: location || "Ludhiana",
        crop: "Paddy",
        farm_area: defaultFarmArea,
        sowing_date: "2026-07-20",
        predicted_harvest: "16 Nov 2026",
        harvest_expected_in_days: 83,
        available_stubble_tons: defaultStubbleTons,
        status: "AVAILABLE",
        is_pre_harvest_listed: true,
      }]);
    }

    return data;
  }

  const db = getLocalDb();
  const existing = db.profiles.find((p) => p.user_id === cleanPhone);
  if (existing) {
    throw new Error("Account already exists with this phone number. Please login.");
  }

  const newProfile = {
    id: `USR-${Date.now()}`,
    user_id: cleanPhone,
    role,
    name: cleanName,
    location: location || "Ludhiana",
    created_at: new Date().toISOString(),
  };

  db.profiles.push(newProfile);

  if (role === "farmer") {
    const defaultFarmArea = 12;
    const defaultStubbleTons = +(defaultFarmArea * 1.85).toFixed(1);
    const newFarm = {
      id: `FARM-${Date.now().toString().slice(-4)}`,
      farmer_id: cleanPhone,
      farmer_name: cleanName,
      location: location || "Ludhiana",
      crop: "Paddy",
      farm_area: defaultFarmArea,
      sowing_date: "2026-07-20",
      predicted_harvest: "16 Nov 2026",
      harvest_expected_in_days: 83,
      available_stubble_tons: defaultStubbleTons,
      status: "AVAILABLE",
      is_pre_harvest_listed: true,
      created_at: new Date().toISOString(),
    };
    if (!db.farms) db.farms = [];
    db.farms.push(newFarm);
  }

  saveLocalDb(db);
  return newProfile;
}

export async function loginUserProfile({ phone, role }) {
  const cleanPhone = phone.trim().replace(/\s+/g, "");

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", cleanPhone)
      .single();

    if (!data) {
      throw new Error("Account not found.");
    }
    if (data.role !== role) {
      throw new Error(`This account is registered as a ${data.role.toUpperCase()}, not a ${role.toUpperCase()}.`);
    }

    if (role === "farmer") {
      const { data: farmList } = await supabase
        .from("farms")
        .select("*")
        .eq("farmer_id", cleanPhone);

      if (!farmList || farmList.length === 0) {
        const defaultFarmArea = 12;
        const defaultStubbleTons = +(defaultFarmArea * 1.85).toFixed(1);
        await supabase.from("farms").insert([{
          farmer_id: cleanPhone,
          farmer_name: data.name,
          location: data.location || "Ludhiana",
          crop: "Paddy",
          farm_area: defaultFarmArea,
          sowing_date: "2026-07-20",
          predicted_harvest: "16 Nov 2026",
          harvest_expected_in_days: 83,
          available_stubble_tons: defaultStubbleTons,
          status: "AVAILABLE",
          is_pre_harvest_listed: true,
        }]);
      }
    }

    return data;
  }

  const db = getLocalDb();
  const profile = db.profiles.find((p) => p.user_id === cleanPhone);
  if (!profile) {
    throw new Error("Account not found.");
  }
  if (profile.role !== role) {
    throw new Error(`This account is registered as a ${profile.role.toUpperCase()}, not a ${role.toUpperCase()}.`);
  }

  if (role === "farmer") {
    if (!db.farms) db.farms = [];
    const hasFarm = db.farms.find((f) => f.farmer_id === cleanPhone);
    if (!hasFarm) {
      const defaultFarmArea = 12;
      const defaultStubbleTons = +(defaultFarmArea * 1.85).toFixed(1);
      db.farms.push({
        id: `FARM-${Date.now().toString().slice(-4)}`,
        farmer_id: cleanPhone,
        farmer_name: profile.name,
        location: profile.location || "Ludhiana",
        crop: "Paddy",
        farm_area: defaultFarmArea,
        sowing_date: "2026-07-20",
        predicted_harvest: "16 Nov 2026",
        harvest_expected_in_days: 83,
        available_stubble_tons: defaultStubbleTons,
        status: "AVAILABLE",
        is_pre_harvest_listed: true,
        created_at: new Date().toISOString(),
      });
      saveLocalDb(db);
    }
  }

  return profile;
}

// ================= FARM MANAGEMENT & POOLING DIRECTORY =================

export async function getFarmerFarms(farmerId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("farmer_id", String(farmerId).trim());
    if (error) console.error("Supabase getFarmerFarms error", error);
    return data || [];
  }

  const db = getLocalDb();
  return (db.farms || []).filter((f) => String(f.farmer_id).trim() === String(farmerId).trim());
}

export async function saveFarmerFarm(farmData) {
  const cleanId = String(farmData.farmer_id).trim();

  // Always sync localStorage first for zero-latency UI consistency
  const db = getLocalDb();
  if (!db.farms) db.farms = [];
  const index = db.farms.findIndex((f) => String(f.farmer_id).trim() === cleanId);
  let savedRecord = {
    ...farmData,
    farmer_id: cleanId,
    status: farmData.status || "AVAILABLE",
  };

  if (index >= 0) {
    db.farms[index] = { ...db.farms[index], ...savedRecord };
    savedRecord = db.farms[index];
  } else {
    savedRecord = { id: `FARM-${cleanId.slice(-4)}`, ...savedRecord };
    db.farms.push(savedRecord);
  }
  saveLocalDb(db);

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from("farms")
        .select("*")
        .eq("farmer_id", cleanId);

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from("farms")
          .update({
            farmer_name: farmData.farmer_name,
            location: farmData.location,
            crop: farmData.crop,
            farm_area: farmData.farm_area,
            sowing_date: farmData.sowing_date,
            predicted_harvest: farmData.predicted_harvest,
            harvest_expected_in_days: farmData.harvest_expected_in_days,
            available_stubble_tons: farmData.available_stubble_tons,
            is_manual_override: farmData.is_manual_override,
            is_pre_harvest_listed: farmData.is_pre_harvest_listed,
            status: farmData.status || "AVAILABLE",
          })
          .eq("farmer_id", cleanId)
          .select();
        if (error) console.error("Supabase update farm error", error);
        return data?.[0] || savedRecord;
      } else {
        const { data, error } = await supabase
          .from("farms")
          .insert([{
            ...savedRecord,
          }])
          .select();
        if (error) console.error("Supabase insert farm error", error);
        return data?.[0] || savedRecord;
      }
    } catch (e) {
      console.error("Supabase farm sync error", e);
    }
  }

  return savedRecord;
}

// Stubble Pooling Directory: Returns uncontracted neighbor farms
export async function getNeighboringFarmsForPooling(currentFarmerId, location) {
  const cleanId = String(currentFarmerId).trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .neq("farmer_id", cleanId)
      .eq("status", "AVAILABLE");
    if (error) console.error("Supabase getNeighboringFarmsForPooling error", error);
    return data || [];
  }

  const db = getLocalDb();
  return (db.farms || []).filter(
    (f) => String(f.farmer_id).trim() !== cleanId && f.status === "AVAILABLE"
  );
}

// ================= STUBBLE POOL INVITATIONS & CONFIRMATIONS =================

export async function sendPoolInvitation(senderUser, recipientFarm) {
  const senderId = String(senderUser?.user_id || senderUser?.phone || "").trim();
  const recipientId = String(recipientFarm?.farmer_id || recipientFarm?.id || "").trim();

  if (isSupabaseConfigured) {
    const { data: existing } = await supabase
      .from("pool_invitations")
      .select("*")
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`);

    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from("pool_invitations")
        .update({ status: "PENDING", created_at: new Date().toISOString() })
        .eq("id", existing[0].id)
        .select()
        .single();
      if (error) console.error("Supabase update pool invite error", error);
      return data || existing[0];
    }

    const { data, error } = await supabase
      .from("pool_invitations")
      .insert([{
        sender_id: senderId,
        sender_name: senderUser.name || "Farmer",
        sender_location: senderUser.location || "Ludhiana",
        recipient_id: recipientId,
        recipient_name: recipientFarm.farmer_name || "Neighbor Farmer",
        recipient_farm_id: recipientFarm.id || null,
        tonnage: parseFloat(recipientFarm.available_stubble_tons) || 20.0,
        status: "PENDING",
      }])
      .select()
      .single();
    if (error) console.error("Supabase create pool invite error", error);
    return data;
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];

  const existingIndex = db.poolInvites.findIndex(
    (inv) =>
      (String(inv.sender_id).trim() === senderId && String(inv.recipient_id).trim() === recipientId) ||
      (String(inv.sender_id).trim() === recipientId && String(inv.recipient_id).trim() === senderId)
  );

  const inviteData = {
    id: existingIndex >= 0 ? db.poolInvites[existingIndex].id : `INV-${Date.now().toString().slice(-4)}`,
    sender_id: senderId,
    sender_name: senderUser.name || "Farmer",
    sender_location: senderUser.location || "Ludhiana",
    recipient_id: recipientId,
    recipient_name: recipientFarm.farmer_name || "Neighbor Farmer",
    recipient_farm_id: recipientFarm.id || null,
    tonnage: parseFloat(recipientFarm.available_stubble_tons) || 20.0,
    status: "PENDING",
    created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  if (existingIndex >= 0) {
    db.poolInvites[existingIndex] = inviteData;
  } else {
    db.poolInvites.unshift(inviteData);
  }

  saveLocalDb(db);
  return inviteData;
}

export async function getAllUserPoolInvitations(farmerId) {
  const cleanId = String(farmerId || "").trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("pool_invitations")
      .select("*")
      .or(`sender_id.eq.${cleanId},recipient_id.eq.${cleanId}`);
    if (error) console.error("Supabase getAllUserPoolInvitations error", error);
    return data || [];
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];
  return (db.poolInvites || []).filter(
    (inv) => String(inv.recipient_id).trim() === cleanId || String(inv.sender_id).trim() === cleanId
  );
}

export async function getInboundPoolInvitations(farmerId) {
  const cleanId = String(farmerId || "").trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("pool_invitations")
      .select("*")
      .eq("recipient_id", cleanId)
      .eq("status", "PENDING");
    if (error) console.error("Supabase getInboundPoolInvitations error", error);
    return data || [];
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];
  return (db.poolInvites || []).filter(
    (inv) => String(inv.recipient_id).trim() === cleanId && inv.status === "PENDING"
  );
}

export async function getSentPoolInvitations(farmerId) {
  const cleanId = String(farmerId || "").trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("pool_invitations")
      .select("*")
      .eq("sender_id", cleanId);
    if (error) console.error("Supabase getSentPoolInvitations error", error);
    return data || [];
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];
  return (db.poolInvites || []).filter(
    (inv) => String(inv.sender_id).trim() === cleanId
  );
}

export async function respondToPoolInvitation(inviteId, accept) {
  const statusStr = accept ? "ACCEPTED" : "DECLINED";

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("pool_invitations")
      .update({ status: statusStr, responded_at: new Date().toISOString() })
      .eq("id", inviteId)
      .select()
      .single();
    if (error) console.error("Supabase respondToPoolInvitation error", error);
    return data;
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];

  const invite = db.poolInvites.find((inv) => inv.id === inviteId);
  if (invite) {
    invite.status = statusStr;
    invite.responded_at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    saveLocalDb(db);
  }
  return invite;
}

export async function cancelPoolInvitation(inviteId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("pool_invitations")
      .delete()
      .eq("id", inviteId);
    if (error) console.error("Supabase cancelPoolInvitation error", error);
    return;
  }

  const db = getLocalDb();
  if (!db.poolInvites) db.poolInvites = [];
  db.poolInvites = db.poolInvites.filter((inv) => inv.id !== inviteId);
  saveLocalDb(db);
}

// ================= BIDS MANAGEMENT =================

export async function getFarmerRelevantBids(farmerId, farmerLocation) {
  const cleanId = String(farmerId || "").trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("status", "ACTIVE")
      .or(`target_farmer_id.eq.${cleanId},target_farmer_id.is.null`);
    if (error) console.error("Supabase getFarmerRelevantBids error", error);
    return data || [];
  }

  const db = getLocalDb();
  return (db.bids || []).filter(
    (b) => b.status === "ACTIVE" && (!b.target_farmer_id || b.target_farmer_id === cleanId)
  );
}

export async function getBuyerActiveBids(buyerId) {
  const cleanId = String(buyerId || "").trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("buyer_id", cleanId)
      .eq("status", "ACTIVE");
    if (error) console.error("Supabase getBuyerBids error", error);
    return data || [];
  }

  const db = getLocalDb();
  return (db.bids || []).filter((b) => b.buyer_id === cleanId && b.status === "ACTIVE");
}

export async function createBid(bidData) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("bids")
      .insert([{
        ...bidData,
        status: "ACTIVE",
      }])
      .select()
      .single();
    if (error) console.error("Supabase createBid error", error);
    return data;
  }

  const db = getLocalDb();
  bidData.id = `BID-${Date.now().toString().slice(-4)}`;
  bidData.status = "ACTIVE";
  bidData.created_at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!db.bids) db.bids = [];
  db.bids.unshift(bidData);
  saveLocalDb(db);
  return bidData;
}

// ================= SUPPLY FEED =================
export async function getAvailableFarmsForBuyer(buyerLocation, radiusKm = 50) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("status", "AVAILABLE");
    if (error) console.error("Supabase getAvailableFarmsForBuyer error", error);
    return data || [];
  }

  const db = getLocalDb();
  return (db.farms || []).filter((f) => f.status === "AVAILABLE");
}

// ================= CONTRACTS & TRANSACTIONS =================

export async function getUserContracts(userId, role) {
  const cleanId = String(userId || "").trim();

  if (isSupabaseConfigured) {
    const queryField = role === "farmer" ? "farmer_id" : "buyer_id";
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq(queryField, cleanId)
      .order("created_at", { ascending: false });
    if (error) console.error("Supabase getUserContracts error", error);
    return data || [];
  }

  const db = getLocalDb();
  if (role === "farmer") {
    return (db.contracts || []).filter(
      (c) => c.farmer_id === cleanId || (c.pooled_members && c.pooled_members.some((m) => m.farmer_id === cleanId))
    );
  }
  if (role === "buyer") {
    return (db.contracts || []).filter((c) => c.buyer_id === cleanId);
  }
  return db.contracts || [];
}

// Single Farm Bid Acceptance
export async function acceptBidAndCreateContract(bid, farmerUser, farm) {
  const stubbleTons = parseFloat(farm?.available_stubble_tons) || 20.0;
  const contractData = {
    id: `CON-${Date.now().toString().slice(-4)}`,
    bid_id: bid.id,
    farm_id: farm?.id || null,
    farmer_id: farmerUser.user_id,
    buyer_id: bid.buyer_id,
    farmer_name: farmerUser.name,
    buyer_name: bid.buyer_name,
    location: farmerUser.location,
    tonnage: stubbleTons,
    rate_per_ton: parseFloat(bid.offered_rate),
    total_value: stubbleTons * parseFloat(bid.offered_rate),
    status: "CONFIRMED_PICKUP",
    is_pooled: false,
    pickup_date: farm?.predicted_harvest || "Immediate Scheduled Pickup",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("contracts")
      .insert([contractData])
      .select()
      .single();
    if (error) console.error("Supabase insert contract error", error);

    await supabase.from("bids").update({ status: "COMPLETED" }).eq("id", bid.id);
    await supabase.from("farms").update({ status: "CONTRACTED" }).eq("farmer_id", farmerUser.user_id);
    return data || contractData;
  }

  const db = getLocalDb();
  if (!db.contracts) db.contracts = [];
  db.contracts.unshift(contractData);

  const matchedBid = (db.bids || []).find((b) => b.id === bid.id);
  if (matchedBid) {
    matchedBid.status = "COMPLETED";
  }

  const matchedFarm = (db.farms || []).find((f) => f.farmer_id === farmerUser.user_id);
  if (matchedFarm) {
    matchedFarm.status = "CONTRACTED";
  }

  saveLocalDb(db);
  return contractData;
}

// Stubble Pooling Contract Finalization
export async function acceptPooledBidAndCreateContract(bid, leaderFarmer, myFarmTons, acceptedNeighborFarms) {
  const totalPooledTons = myFarmTons + acceptedNeighborFarms.reduce((sum, f) => sum + (parseFloat(f.available_stubble_tons) || 0), 0);
  const rate = parseFloat(bid.offered_rate);

  const pooledMembers = [
    {
      farmer_id: leaderFarmer.user_id,
      farmer_name: `${leaderFarmer.name} (Pool Leader)`,
      location: leaderFarmer.location,
      tonnage: myFarmTons,
      payout: myFarmTons * rate,
    },
    ...acceptedNeighborFarms.map((nf) => ({
      farmer_id: nf.farmer_id,
      farmer_name: nf.farmer_name,
      location: nf.location,
      tonnage: parseFloat(nf.available_stubble_tons),
      payout: parseFloat(nf.available_stubble_tons) * rate,
    })),
  ];

  const contractData = {
    id: `POOL-CON-${Date.now().toString().slice(-4)}`,
    bid_id: bid.id,
    farmer_id: leaderFarmer.user_id,
    buyer_id: bid.buyer_id,
    farmer_name: `${leaderFarmer.name} & Stubble Pool (${pooledMembers.length} Farmers)`,
    buyer_name: bid.buyer_name,
    location: leaderFarmer.location,
    tonnage: totalPooledTons,
    rate_per_ton: rate,
    total_value: totalPooledTons * rate,
    status: "CONFIRMED_PICKUP",
    is_pooled: true,
    pooled_members: pooledMembers,
    pickup_date: "Scheduled Collective Cluster Logistics",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("contracts")
      .insert([contractData])
      .select()
      .single();
    if (error) console.error("Supabase insert pooled contract error", error);

    await supabase.from("bids").update({ status: "COMPLETED" }).eq("id", bid.id);
    await supabase.from("farms").update({ status: "CONTRACTED" }).eq("farmer_id", leaderFarmer.user_id);
    for (const nf of acceptedNeighborFarms) {
      await supabase.from("farms").update({ status: "CONTRACTED" }).eq("farmer_id", nf.farmer_id);
    }
    return data || contractData;
  }

  const db = getLocalDb();
  if (!db.contracts) db.contracts = [];
  db.contracts.unshift(contractData);

  const matchedBid = (db.bids || []).find((b) => b.id === bid.id);
  if (matchedBid) {
    matchedBid.status = "COMPLETED";
  }

  const leaderFarm = (db.farms || []).find((f) => f.farmer_id === leaderFarmer.user_id);
  if (leaderFarm) {
    leaderFarm.status = "CONTRACTED";
  }

  const pooledFarmerIds = new Set(acceptedNeighborFarms.map((f) => f.farmer_id));
  (db.farms || []).forEach((f) => {
    if (pooledFarmerIds.has(f.farmer_id)) {
      f.status = "CONTRACTED";
    }
  });

  db.poolInvites = (db.poolInvites || []).filter(
    (inv) => !pooledFarmerIds.has(inv.sender_id) && !pooledFarmerIds.has(inv.recipient_id)
  );

  saveLocalDb(db);
  return contractData;
}
