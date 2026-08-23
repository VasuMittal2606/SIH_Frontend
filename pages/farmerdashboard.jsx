function FarmerDashboard() {
  return (
    <div className="dashboard">

      {/* Welcome */}
      <div className="welcome">
        <h1>Good Morning, Farmer 👋</h1>
        <p>
          Manage your stubble and connect with nearby biomass buyers.
        </p>
      </div>


      {/* Statistics */}
      <div className="stats">

        <div className="card">
          <h3>Farm Area</h3>
          <h2>12 Acres</h2>
          <p>Punjab</p>
        </div>

        <div className="card">
          <h3>Predicted Harvest</h3>
          <h2>18 Nov 2026</h2>
          <p>25 days remaining</p>
        </div>

        <div className="card">
          <h3>Stubble Available</h3>
          <h2>28 Tons</h2>
          <p>Ready for listing</p>
        </div>

        <div className="card">
          <h3>Buyer Offers</h3>
          <h2>5</h2>
          <p>New offers</p>
        </div>

      </div>


      {/* Farm + Harvest */}
      <div className="main-grid">

        {/* Farm Details */}
        <div className="panel">

          <h2>🌾 Farm & Crop Details</h2>

          <div className="details">

            <p>
              <strong>Crop:</strong> Paddy
            </p>

            <p>
              <strong>Variety:</strong> PR 126
            </p>

            <p>
              <strong>Sowing Date:</strong> 20 July 2026
            </p>

            <p>
              <strong>Farm Size:</strong> 12 Acres
            </p>

            <p>
              <strong>Location:</strong> Ludhiana, Punjab
            </p>

          </div>

          <button className="primary-btn">
            Edit Farm Details
          </button>

        </div>


        {/* Harvest Prediction */}
        <div className="panel">

          <h2>📅 Harvest Prediction</h2>

          <div className="harvest-date">
            <h1>18 Nov</h1>
            <p>Predicted Harvest Date</p>
          </div>

          <p>
            Your stubble listing will automatically become visible
            to nearby buyers 10 days before harvest.
          </p>

          <button className="primary-btn">
            Create Instant Sell Request
          </button>

        </div>

      </div>


      {/* Buyer Offers */}
      <div className="panel offers">

        <h2>🤝 Nearby Buyer Offers</h2>


        <div className="offer">

          <div>
            <h3>GreenBio Energy</h3>
            <p>📍 8.4 km away</p>
          </div>

          <div>
            <strong>₹2,100 / ton</strong>
          </div>

          <button className="accept-btn">
            View Offer
          </button>

        </div>


        <div className="offer">

          <div>
            <h3>Punjab Biomass Ltd.</h3>
            <p>📍 14.2 km away</p>
          </div>

          <div>
            <strong>₹2,000 / ton</strong>
          </div>

          <button className="accept-btn">
            View Offer
          </button>

        </div>

      </div>

    </div>
  );
}

export default FarmerDashboard;