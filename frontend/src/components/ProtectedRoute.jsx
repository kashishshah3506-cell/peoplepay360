import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path to match your layout

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 💡 CRUCIAL FIX: Wait until the AuthContext finishes evaluating tokens. 
  // Otherwise, 'user' is briefly null, triggering an accidental redirect that crashes the router tree.
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
