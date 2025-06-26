import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Loader } from 'lucide-react';

const CourseCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    professorId: user?.userId || ''
  });
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProfessors();
    }
  }, [user]);

  const fetchProfessors = async () => {
    try {
      const res = await axios.get('/admin/users');
      setProfessors(res.data.filter(u => u.role === 'professor'));
    } catch (error) {
      toast.error('Failed to load professors');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/admin/create-course', form);
      toast.success('Course created successfully!');
      navigate('/courses');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Course title"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                required
                value={form.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Course description"
                rows={4}
              />
            </div>
            {user?.role === 'admin' ? (
              <div>
                <label htmlFor="professorId" className="block text-sm font-medium text-gray-700">Assign Professor</label>
                <select
                  id="professorId"
                  name="professorId"
                  required
                  value={form.professorId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select a professor...</option>
                  {professors.map((prof) => (
                    <option key={prof.userId} value={prof.userId}>{prof.username}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="professorId" className="block text-sm font-medium text-gray-700">Professor ID</label>
                <input
                  id="professorId"
                  name="professorId"
                  type="text"
                  required
                  value={form.professorId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                  readOnly
                />
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin" /> : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseCreate; 