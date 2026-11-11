import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import JobDetails from './pages/JobDetails';
import CondidatForm from './pages/CondidatForm';
import JobForm from './pages/JobForm';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/job-details/:id" element={<JobDetails />} />
        <Route
          path="/condidat-form/:id"
          element={
            <ProtectedRoute role="candidate">
              <CondidatForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-form"
          element={
            <ProtectedRoute role="manager">
              <JobForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="manager">
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
