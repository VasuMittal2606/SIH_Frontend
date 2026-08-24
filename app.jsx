import { useState } from "react";
import FarmerDashboard from "./pages/farmerdashboard";
import BuyerDashboard from "./pages/buyerdashboard";
import {
  registerUserProfile,
  loginUserProfile,
  isSupabaseConfigured,
} from "./supabaseClient";
import "./app.css";

const translations = {
  en: {
    tagline: "Smart Stubble-to-Biomass & Pooling Marketplace",
    loginTitle: "Sign In to OORVAR",
    signupTitle: "Create Your OORVAR Account",
    loginSub: "Enter your registered credentials to access your portal.",
    signupSub: "Register your farm or biomass enterprise on the network.",
    roleFarmer: "Farmer",
    roleBuyer: "Biomass Buyer",
    roleGovt: "Govt / CHC Official",
    btnLogin: "Sign In & Access Portal",
    btnSignup: "Send OTP & Proceed",
    btnVerifyOtp: "Verify OTP & Complete Registration",
    btnLogout: "Logout",
    navFarmer: "🌾 Farmer Operations Portal",
    navBuyer: "🏭 Biomass Procurement Portal",
    navGovt: "🏛️ Government / CHC Command Center",
  },
  hi: {
    tagline: "स्मार्ट स्टबल-टू-बायोमास एवं पूलिंग मार्केटप्लेस",
    loginTitle: "ऊर्वर (OORVAR) में लॉगिन करें",
    signupTitle: "नया ऊर्वर खाता बनाएं",
    loginSub: "अपने पंजीकृत विवरण दर्ज करें।",
    signupSub: "नेटवर्क पर अपने खेत या उद्यम को पंजीकृत करें।",
    roleFarmer: "किसान",
    roleBuyer: "बायोमास खरीदार",
    roleGovt: "सरकारी / CHC अधिकारी",
    btnLogin: "लॉगिन करें",
    btnSignup: "OTP भेजें और आगे बढ़ें",
    btnVerifyOtp: "OTP सत्यापित करें और खाता बनाएं",
    btnLogout: "लॉग आउट",
    navFarmer: "🌾 किसान संचालन पोर्टल",
    navBuyer: "🏭 बायोमास खरीद पोर्टल",
    navGovt: "🏛️ सरकारी / CHC कमांड सेंटर",
  },
  pa: {
    tagline: "ਸਮਾਰਟ ਪਰਾਲੀ-ਤੋਂ-ਬਾਇਓਮਾਸ ਅਤੇ ਪੂਲਿੰਗ ਮਾਰਕੀਟਪਲੇਸ",
    loginTitle: "ਊਰਵਰ (OORVAR) ਵਿੱਚ ਲੌਗਇਨ ਕਰੋ",
    signupTitle: "ਨਵਾਂ ਊਰਵਰ ਖਾਤਾ ਬਣਾਓ",
    loginSub: "ਆਪਣੇ ਰਜਿਸਟਰਡ ਵੇਰਵੇ ਦਰਜ ਕਰੋ।",
    signupSub: "ਨੈੱਟਵਰਕ 'ਤੇ ਆਪਣਾ ਖੇਤ ਜਾਂ ਐਂਟਰਪ੍ਰਾਈਜ਼ ਦਰਜ ਕਰੋ।",
    roleFarmer: "ਕਿਸਾਨ",
    roleBuyer: "ਬਾਇਓਮਾਸ ਖਰੀਦਦਾਰ",
    roleGovt: "ਸਰਕਾਰੀ / CHC ਅਧਿਕਾਰੀ",
    btnLogin: "ਲੌਗਇਨ ਕਰੋ",
    btnSignup: "OTP ਭੇਜੋ ਅਤੇ ਅੱਗੇ ਵਧੋ",
    btnVerifyOtp: "OTP ਪ੍ਰਮਾਣਿਤ ਕਰੋ ਅਤੇ ਖਾਤਾ ਬਣਾਓ",
    btnLogout: "ਲੌਗ ਆਉਟ",
    navFarmer: "🌾 ਕਿਸਾਨ ਸੰਚਾਲਨ ਪੋਰਟਲ",
    navBuyer: "🏭 ਬਾਇਓਮਾਸ ਖਰੀਦ ਪੋਰਟਲ",
    navGovt: "🏛️ ਸਰਕਾਰੀ / CHC ਕਮਾਂਡ ਸੈਂਟਰ",
  },
};

function GovtDashboard({ currentUser, lang }) {
  const [fleetList, setFleetList] = useState([
    { hub: "Ludhiana Central CHC", district: "Ludhiana", totalBalers: 14, allocated: 11, status: "Active" },
    { hub: "Karnal Sector-4 CHC", district: "Karnal", totalBalers: 10, allocated: 7, status: "Active" },
    { hub: "Bathinda Rural CHC", district: "Bathinda", totalBalers: 12, allocated: 4, status: "Maintenance" },
    { hub: "Moga East CHC", district: "Moga", totalBalers: 8, allocated: 8, status: "Active" },
    { hub: "Kurukshetra Central", district: "Kurukshetra", totalBalers: 9, allocated: 9, status: "Active" },
  ]);

  const toggleFleetStatus = (index) => {
    setFleetList((prev) => {
      const updated = [...prev];
      updated[index].status = updated[index].status === "Active" ? "Maintenance" : "Active";
      return updated;
    });
  };

  const totalBalers = fleetList.reduce((sum, f) => sum + f.totalBalers, 0);
  const totalAllocated = fleetList.reduce((sum, f) => sum + f.allocated, 0);
  const utilizationRate = Math.round((totalAllocated / Math.max(1, totalBalers)) * 100);

  return (
    <div>
      <div className="welcome-section">
        <h1>🏛️ Welcome, {currentUser?.name || "Officer"}</h1>
        <p>
          Logged in as ID: <strong>{currentUser?.user_id}</strong> • Role: <strong>Government / CHC Command</strong>
          {isSupabaseConfigured && " • Connected to Supabase Cloud Database"}
        </p>
      </div>

      <div className="metrics-grid">
        <div className="stat-card">
          <h3>Biomass Recovered</h3>
          <h2>14,650 <span style={{ fontSize: "1rem", fontWeight: 600 }}>Tons</span></h2>
          <p className="stat-accent">Diverted from open burning</p>
        </div>
        <div className="stat-card">
          <h3>Emissions Prevented</h3>
          <h2>2,930 <span style={{ fontSize: "1rem", fontWeight: 600 }}>tCO₂e</span></h2>
          <p>Equiv. to ~1,250 passenger vehicles</p>
        </div>
        <div className="stat-card">
          <h3>Machinery Utilization</h3>
          <h2 className="stat-accent">{utilizationRate}%</h2>
          <p>{totalAllocated} / {totalBalers} CRM Balers Deployed</p>
        </div>
        <div className="stat-card">
          <h3>Economic Value Generated</h3>
          <h2>₹3.15 <span style={{ fontSize: "1rem", fontWeight: 600 }}>Cr</span></h2>
          <p>Farmer & CHC Operator Revenue</p>
        </div>
      </div>

      {/* Machinery Fleet Manager */}
      <div className="glass-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>🚜 Custom Hiring Centre (CHC) Baler Machinery Status Manager</h2>
          <span className="badge badge-success">GPS Integrated Telematics</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Hub / Station Name</th>
              <th>District</th>
              <th>Total Fleet</th>
              <th>Deployed</th>
              <th>Operational Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fleetList.map((f, idx) => (
              <tr key={f.hub}>
                <td>
                  <div style={{ fontWeight: 700 }}>{f.hub}</div>
                </td>
                <td>{f.district}</td>
                <td>{f.totalBalers} Balers</td>
                <td>{f.allocated} Deployed</td>
                <td>
                  <span className={`badge ${f.status === "Active" ? "badge-success" : "badge-warning"}`}>
                    {f.status}
                  </span>
                </td>
                <td>
                  <button
                    className="action-btn action-btn-secondary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                    onClick={() => toggleFleetStatus(idx)}
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Regional Analytics */}
      <div className="main-grid">
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <h2>🗺️ Regional Stubble Supply & Demand Clusters</h2>
          <div className="detail-row">
            <strong>Ludhiana District:</strong> <span style={{ color: "var(--primary-light)" }}>Real-time telemetry active</span>
          </div>
          <div className="detail-row">
            <strong>Moga District:</strong> <span style={{ color: "var(--primary-light)" }}>Real-time telemetry active</span>
          </div>
          <div className="detail-row">
            <strong>Karnal District:</strong> Pellet plant logistics monitored
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <h2>🌱 Environmental Compliance & Air Quality Impact</h2>
          <div className="harvest-display" style={{ textAlign: "center" }}>
            <p>AQI Smog Mitigation Factor</p>
            <div className="harvest-date-big" style={{ fontSize: "2.2rem" }}>
              -34% PM2.5 / PM10
            </div>
            <p style={{ marginTop: "0.4rem" }}>
              Active Stubble Diversion Window: <strong style={{ color: "var(--primary-light)" }}>10–20 Days Post-Harvest</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Auth Modes: 'LOGIN' | 'SIGNUP' | 'OTP_VERIFY'
  const [authMode, setAuthMode] = useState("LOGIN");
  const [selectedRole, setSelectedRole] = useState("farmer");

  // Input States
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState(""); // ONLY asked on SignUp!
  const [locationInput, setLocationInput] = useState("Ludhiana");
  const [passwordInput, setPasswordInput] = useState("");

  // OTP State (ONLY for SignUp!)
  const [otpInput, setOtpInput] = useState("");
  const [currentOtpCode, setCurrentOtpCode] = useState("123456");
  const [authError, setAuthError] = useState("");
  const [pendingSignUpPayload, setPendingSignUpPayload] = useState(null);

  const [lang, setLang] = useState("en");
  const t = translations[lang] || translations.en;

  // 1. Handle Direct Sign In (NO OTP on Sign In!)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const cleanPhone = phoneInput.trim().replace(/\s+/g, "");
    if (!cleanPhone) return;

    try {
      const user = await loginUserProfile({ phone: cleanPhone, role: selectedRole });
      setCurrentUser(user);
      setPhoneInput("");
      setPasswordInput("");
    } catch (err) {
      setAuthError(`⚠️ ${err.message || "Account not found."} Please click 'Sign Up (New User)' above to create your account.`);
    }
  };

  // 2. Handle Sign Up Submit (Triggers OTP verification for mobile)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const cleanPhone = phoneInput.trim().replace(/\s+/g, "");
    const cleanName = nameInput.trim();

    if (!cleanPhone || !cleanName) {
      setAuthError("Please provide your full name and mobile number.");
      return;
    }

    try {
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      setCurrentOtpCode(generatedOtp);
      setPendingSignUpPayload({
        phone: cleanPhone,
        role: selectedRole,
        name: cleanName,
        location: locationInput,
        password: passwordInput,
      });

      setAuthMode("OTP_VERIFY");
    } catch (err) {
      setAuthError(err.message || "Sign up failed.");
    }
  };

  // 3. Handle Sign Up OTP Verification
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!pendingSignUpPayload) return;

    if (otpInput.trim() !== currentOtpCode && otpInput.trim() !== "123456") {
      setAuthError("Invalid OTP code. Please enter the 6-digit code shown above or 123456.");
      return;
    }

    try {
      const newUser = await registerUserProfile(pendingSignUpPayload);
      setCurrentUser(newUser);
      setAuthMode("LOGIN");
      setOtpInput("");
      setPendingSignUpPayload(null);
    } catch (err) {
      setAuthError(err.message || "Account registration failed.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPhoneInput("");
    setNameInput("");
    setPasswordInput("");
    setOtpInput("");
    setAuthError("");
    setAuthMode("LOGIN");
  };

  return (
    <>
      {/* ========= HEADER WITH OORVAR LOGO ========= */}
      <header>
        <div className="brand-container">
          <img
            src="/oorvar_logo.png"
            alt="OORVAR Logo"
            className="brand-logo"
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              objectFit: "contain",
              background: "#ffffff",
              padding: "4px",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
            }}
          />
          <div className="logo-text">
            <h1>OORVAR</h1>
            <p>{t.tagline}</p>
          </div>
        </div>

        <div className="header-actions">
          {currentUser && (
            <span className="user-profile-badge" style={{ display: "inline-block" }}>
              {currentUser.role === "farmer" ? `🌾 Farmer: ${currentUser.name}` :
               currentUser.role === "buyer" ? `🏭 Buyer: ${currentUser.name}` :
               `🏛️ Govt: ${currentUser.name}`}
            </span>
          )}
          <select
            className="lang-picker"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
          {currentUser && (
            <button className="btn-logout" style={{ display: "inline-block" }} onClick={handleLogout}>
              {t.btnLogout}
            </button>
          )}
        </div>
      </header>

      {/* ========= AUTHENTICATION SCREEN ========= */}
      {!currentUser && (
        <div className="auth-overlay">
          <div className="auth-card">
            {/* Mode Switch Tabs: Sign In vs Sign Up */}
            {authMode !== "OTP_VERIFY" && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode("LOGIN"); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    background: authMode === "LOGIN" ? "var(--primary)" : "transparent",
                    color: authMode === "LOGIN" ? "#fff" : "var(--text-muted)",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "var(--transition)"
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("SIGNUP"); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    background: authMode === "SIGNUP" ? "var(--primary)" : "transparent",
                    color: authMode === "SIGNUP" ? "#fff" : "var(--text-muted)",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "var(--transition)"
                  }}
                >
                  Sign Up (New User)
                </button>
              </div>
            )}

            <div className="auth-header" style={{ textAlign: "center" }}>
              <img
                src="/oorvar_logo.png"
                alt="OORVAR"
                style={{ width: "64px", height: "64px", borderRadius: "14px", background: "#fff", padding: "6px", margin: "0 auto 12px", display: "block", boxShadow: "0 0 25px rgba(16,185,129,0.3)" }}
              />
              <h2>{authMode === "LOGIN" ? t.loginTitle : authMode === "SIGNUP" ? t.signupTitle : "📱 Mobile Registration OTP"}</h2>
              <p>{authMode === "LOGIN" ? t.loginSub : authMode === "SIGNUP" ? t.signupSub : `Enter the verification code to activate your account.`}</p>
            </div>

            {authError && (
              <div className="alert-banner alert-error" style={{ marginBottom: "1rem" }}>
                {authError}
                {authMode === "LOGIN" && (
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("SIGNUP"); setAuthError(""); }}
                      style={{
                        background: "rgba(16,185,129,0.2)",
                        border: "1px solid var(--primary)",
                        color: "#34d399",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      👉 Click here to Sign Up Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {authMode === "LOGIN" && (
              <form onSubmit={handleLoginSubmit}>
                <label style={{ fontSize: "0.82rem", fontWeight: 800, display: "block", marginBottom: "0.6rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Select Your Portal Role:
                </label>

                <div className="role-selector-grid">
                  {[
                    { key: "farmer", label: t.roleFarmer, icon: <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.87 12.5 17 8 17 8z"/> },
                    { key: "buyer", label: t.roleBuyer, icon: <path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v11h22V10c0-1.1-.9-2-2-2zM8 5h8v3H8V5zm12 14H4v-7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v7z"/> },
                    { key: "govt", label: t.roleGovt, icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/> },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`role-option${selectedRole === key ? " selected" : ""}`}
                      onClick={() => setSelectedRole(key)}
                    >
                      <input type="radio" name="loginRole" value={key} />
                      <svg viewBox="0 0 24 24">{icon}</svg>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div className="form-group">
                  <label>Registered Mobile Number / User ID</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
                  {t.btnLogin}
                </button>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {authMode === "SIGNUP" && (
              <form onSubmit={handleSignUpSubmit}>
                <label style={{ fontSize: "0.82rem", fontWeight: 800, display: "block", marginBottom: "0.6rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Registering As:
                </label>

                <div className="role-selector-grid">
                  {[
                    { key: "farmer", label: t.roleFarmer, icon: <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.87 12.5 17 8 17 8z"/> },
                    { key: "buyer", label: t.roleBuyer, icon: <path d="M19 8h-1V3H6v5H5c-1.1 0-2 .9-2 2v11h22V10c0-1.1-.9-2-2-2zM8 5h8v3H8V5zm12 14H4v-7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v7z"/> },
                    { key: "govt", label: t.roleGovt, icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/> },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className={`role-option${selectedRole === key ? " selected" : ""}`}
                      onClick={() => setSelectedRole(key)}
                    >
                      <input type="radio" name="signupRole" value={key} />
                      <svg viewBox="0 0 24 24">{icon}</svg>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div className="form-group">
                  <label>Full Name / Business Organization</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={selectedRole === "farmer" ? "e.g. Gurpreet Singh" : selectedRole === "buyer" ? "e.g. Punjab Bio-Energy Corp" : "Officer Name"}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>10-Digit Mobile Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Operating District</label>
                  <select
                    className="form-control"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                  >
                    <option value="Ludhiana">Ludhiana (Punjab)</option>
                    <option value="Patiala">Patiala (Punjab)</option>
                    <option value="Sangrur">Sangrur (Punjab)</option>
                    <option value="Bathinda">Bathinda (Punjab)</option>
                    <option value="Jalandhar">Jalandhar (Punjab)</option>
                    <option value="Moga">Moga (Punjab)</option>
                    <option value="Karnal">Karnal (Haryana)</option>
                    <option value="Kurukshetra">Kurukshetra (Haryana)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Create Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
                  {t.btnSignup}
                </button>
              </form>
            )}

            {/* 3. SIGN UP OTP VERIFICATION FORM */}
            {authMode === "OTP_VERIFY" && (
              <form onSubmit={handleOtpVerify}>
                <div style={{
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "1.2rem",
                  textAlign: "center",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.15)"
                }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                    📲 Registration OTP for <strong>{pendingSignUpPayload?.phone}</strong>:
                  </p>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#34d399", letterSpacing: "5px", margin: "6px 0" }}>
                    {currentOtpCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(currentOtpCode)}
                    style={{
                      marginTop: "6px",
                      background: "rgba(16, 185, 129, 0.25)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Click to Auto-Fill OTP ({currentOtpCode})
                  </button>
                </div>

                <div className="form-group">
                  <label>Enter 6-Digit Registration Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="••••••"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    style={{ fontSize: "1.4rem", letterSpacing: "6px", textAlign: "center" }}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
                  {t.btnVerifyOtp}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.2rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = String(Math.floor(100000 + Math.random() * 900000));
                      setCurrentOtpCode(newCode);
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--primary-light)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Resend Code 🔄
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("SIGNUP"); setAuthError(""); }}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    ← Edit Registration Info
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========= STRICT ISOLATED PORTALS ========= */}
      {currentUser && (
        <div id="appContainer" style={{ display: "block" }}>
          {currentUser.role === "farmer" && (
            <div className="dashboard-panel active">
              <FarmerDashboard currentUser={currentUser} lang={lang} />
            </div>
          )}

          {currentUser.role === "buyer" && (
            <div className="dashboard-panel active">
              <BuyerDashboard currentUser={currentUser} lang={lang} />
            </div>
          )}

          {currentUser.role === "govt" && (
            <div className="dashboard-panel active">
              <GovtDashboard currentUser={currentUser} lang={lang} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;