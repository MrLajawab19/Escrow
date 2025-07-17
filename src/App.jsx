import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Buyer from "./pages/Buyer";
import Seller from "./pages/Seller";
import Dispute from "./pages/Dispute";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buyer" element={<Buyer />} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/dispute" element={<Dispute />} />
      </Routes>
    </Router>
  );
}
