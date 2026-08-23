function Sidebar({ setPage, currentPage }) {
  return (
    <aside className="sidebar">

      <button
        className={currentPage === "farmer" ? "active" : ""}
        onClick={() => setPage("farmer")}
      >
        🌾 Farmer Dashboard
      </button>

      <button
        className={currentPage === "buyer" ? "active" : ""}
        onClick={() => setPage("buyer")}
      >
        🏭 Buyer Dashboard
      </button>

      <div className="sidebar-bottom">
        <button>⚙️ Settings</button>
        <button>🚪 Logout</button>
      </div>

    </aside>
  );
}

export default Sidebar;