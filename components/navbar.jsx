function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        🌾 ResidueLink
      </div>

      <div className="nav-right">
        <span>EN</span>
        <span>हिंदी</span>
        <span>ਪੰਜਾਬੀ</span>

        <div className="profile">
          👤
          <span>Profile</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;