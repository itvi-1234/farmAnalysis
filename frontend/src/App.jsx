import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/authcontext/Authcontext'
import Landing from './components/landing/Landing'
import Login from './components/auth/login/Login'
import Register from './components/auth/register/Register'
import Home from './pages/Home'
import Header from './components/header/Header'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={<Home />} />
          
          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
