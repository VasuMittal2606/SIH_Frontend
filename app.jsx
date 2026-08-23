import { useState } from "react";

import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";

import FarmerDashboard from "./pages/farmerdashboard";
import BuyerDashboard from "./pages/buyerdashboard";

import "./app.css";

function App() {
  const [page, setPage] = useState("farmer");

  return (
    <div className="app">
      <Navbar />

      <div className="layout">
        <Sidebar
          setPage={setPage}
          currentPage={page}
        />

        <main className="content">
          {page === "farmer" && <FarmerDashboard />}

          {page === "buyer" && <BuyerDashboard />}
        </main>
      </div>
    </div>
  );
}

export default App;