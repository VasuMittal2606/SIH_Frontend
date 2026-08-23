function BuyerDashboard() {
  return (
    <div className="dashboard">

      {/* Welcome */}
      <div className="welcome">

        <h1>Buyer Dashboard 👋</h1>

        <p>
          Find nearby stubble suppliers and manage procurement.
        </p>

      </div>


      {/* Statistics */}
      <div className="stats">

        <div className="card">
          <h3>Required Tonnage</h3>
          <h2>150 Tons</h2>
          <p>This month</p>
        </div>

        <div className="card">
          <h3>Nearby Farms</h3>
          <h2>24</h2>
          <p>Within 50 km</p>
        </div>

        <div className="card">
          <h3>Active Offers</h3>
          <h2>8</h2>
          <p>Awaiting response</p>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <h2>32 Tons</h2>
          <p>This month</p>
        </div>

      </div>


      {/* Nearby Farms */}
      <div className="panel">

        <h2>🔎 Nearby Stubble Listings</h2>


        <div className="farm-list">

          {/* Farm 1 */}
          <div className="farm">

            <div>
              <h3>Farm #RL1024</h3>

              <p>
                📍 8.4 km away • Ludhiana
              </p>

              <p>
                🌾 Paddy • 28 Tons available
              </p>
            </div>

            <div>

              <strong>₹2,100 / ton</strong>

              <button className="primary-btn small">
                Make Offer
              </button>

            </div>

          </div>


          {/* Farm 2 */}
          <div className="farm">

            <div>
              <h3>Farm #RL1031</h3>

              <p>
                📍 12.7 km away • Moga
              </p>

              <p>
                🌾 Paddy • 35 Tons available
              </p>
            </div>

            <div>

              <strong>₹2,050 / ton</strong>

              <button className="primary-btn small">
                Make Offer
              </button>

            </div>

          </div>


          {/* Farm 3 */}
          <div className="farm">

            <div>
              <h3>Farm #RL1048</h3>

              <p>
                📍 19.3 km away • Khanna
              </p>

              <p>
                🌾 Paddy • 20 Tons available
              </p>
            </div>

            <div>

              <strong>₹2,000 / ton</strong>

              <button className="primary-btn small">
                Make Offer
              </button>

            </div>

          </div>

        </div>

      </div>


      {/* Buy Requirement + Tracker */}
      <div className="main-grid">


        {/* Buy Requirement */}
        <div className="panel">

          <h2>📦 Post Buy Requirement</h2>

          <label>
            Required Tonnage
          </label>

          <input
            type="number"
            placeholder="Enter tons"
          />


          <label>
            Starting Price / Ton
          </label>

          <input
            type="number"
            placeholder="₹ per ton"
          />


          <label>
            Procurement Radius
          </label>

          <input
            type="number"
            placeholder="Distance in km"
          />


          <button className="primary-btn">
            Post Buy Request
          </button>

        </div>


        {/* Procurement Tracker */}
        <div className="panel">

          <h2>🚚 Procurement Tracker</h2>

          <div className="tracker">

            <p>
              🟢 Confirmed Pickups:
              <strong> 6</strong>
            </p>

            <p>
              🟡 In Progress:
              <strong> 3</strong>
            </p>

            <p>
              🔵 Completed:
              <strong> 12</strong>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default BuyerDashboard;