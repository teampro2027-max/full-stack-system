import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';

const ProtectedRoute = () => {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
