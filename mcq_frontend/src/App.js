import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ProfessorDashboard from './components/dashboard/ProfessorDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import Quiz from './components/quiz/Quiz';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CourseCreate from './components/courses/CourseCreate';
import CourseEdit from './components/courses/CourseEdit';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {user?.role === 'student' && <StudentDashboard />}
            {user?.role === 'professor' && <ProfessorDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute>
            <CourseList />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/edit" element={
          <ProtectedRoute>
            <CourseEdit />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:materialId" element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        } />
        <Route path="/courses/create" element={
          <ProtectedRoute>
            <CourseCreate />
          </ProtectedRoute>
        } />
      </Routes>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
