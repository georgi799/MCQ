import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  ArrowRight,
  Loader
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalQuizzes: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch enrolled courses
      const coursesResponse = await axios.get('/courses/enrolled');
      setEnrolledCourses(coursesResponse.data);
      setStats(prev => ({ ...prev, totalCourses: coursesResponse.data.length }));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="flex items-center justify-center h-64 w-full">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full">
        <Navbar />
      </div>
      <div className="w-full flex flex-col items-center flex-1 py-12 px-2 sm:px-4">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10 flex flex-col items-center">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 text-center">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-8 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 text-center">My Courses</h2>
            </div>
            <div className="p-8">
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No courses enrolled</h3>
                  <p className="mt-1 text-base text-gray-500">
                    Browse available courses to get started
                  </p>
                  <div className="mt-8">
                    <Link
                      to="/courses"
                      className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Courses
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrolledCourses.map((course) => (
                    <div key={course.courseId} className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{course.title}</h3>
                          <p className="text-base text-gray-500">{course.description}</p>
                        </div>
                      </div>
                      <Link
                        to={`/courses/${course.courseId}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ArrowRight className="h-6 w-6" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 