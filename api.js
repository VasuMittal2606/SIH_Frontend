const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://oorvar-backend.onrender.com";

/**
 * Fetch ML harvest prediction and stubble availability from FastAPI backend
 * @param {Object} farmData - { crop, location, farm_area, sowing_date }
 */
export async function fetchHarvestPrediction(farmData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/farmer/dashboard-prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(farmData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "API Error" }));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.warn("FastAPI ML prediction API unreachable/error:", error.message);
    return null;
  }
}

/**
 * Dispatch real SMS OTP to user's mobile number
 * @param {string} phone
 */
export async function sendRealSmsOtp(phone) {
  const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to send SMS OTP" }));
    throw new Error(errorData.detail || "Could not dispatch SMS to mobile.");
  }

  return await response.json();
}

/**
 * Verify real SMS OTP code
 * @param {string} phone
 * @param {string} code
 */
export async function verifyRealSmsOtp(phone, code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, code }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Invalid OTP code" }));
    throw new Error(errorData.detail || "Invalid verification code.");
  }

  return await response.json();
}
