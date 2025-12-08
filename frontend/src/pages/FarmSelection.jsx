import React, { useState } from "react";
import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import { useAuth } from "../contexts/authcontext/Authcontext";
import { Navigate, useNavigate } from "react-router-dom";
import { doSignOut } from "../firebase/auth";
import NewFieldMap from "../components/dashboard/NewFieldMap";

const FarmSelection = () => {
  const { currentUser, userLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showDrawer, setShowDrawer] = useState(false);

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!userLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
    
    <Navbar currentUser={currentUser} onLogout={handleLogout} />
    <Sidebar />

    <div className="pt-20 lg:ml-64 px-8">

          <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          Farm Selection
        </h1>
        <p className="text-gray-600 mt-1 text-base">
          Draw your field, add details, and save your farm information.
        </p>
      </div>


      <NewFieldMap showDrawer={showDrawer} setShowDrawer={setShowDrawer} />
    </div>
  </div>
  );
};

export default FarmSelection;
