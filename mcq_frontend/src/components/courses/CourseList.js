import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Users,
  Play, 
  Plus, 
  Search,
  Filter,
  Loader,
  Eye,
  Edit
} from 'lucide-react';

const CourseList = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [enrollments, setEnrollments] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'professor') {
      fetchEnrollments();
    }
    if (user?.role === 'student') {
      fetchEnrolledCourses();
    }

  }, []);

  const fetchCourses = async () => {
    try {
      let response;
      if (user?.role === 'admin') {
        response = await axios.get('/admin/courses');
      } else if (user?.role === 'professor') {
        response = await axios.get('/courses/my-courses');
      } else {
        response = await axios.get('/courses/view');
      }
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const enrollmentsResponse = await axios.get('/courses/my-courses/enrollments');
      setEnrollments(enrollmentsResponse.data);
    } catch (error) {

    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const res = await axios.get('/courses/enrolled');
      setEnrolledCourseIds(res.data.map(c => c.courseId));
    } catch (error) {
    }
  };

  const getEnrollmentInfo = (courseId) => {
    return enrollments.find(e => e.courseId === courseId);
  };

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`/courses/enroll/${courseId}`);
      toast.success('Successfully enrolled in course!');
      fetchCourses(); // Refresh the list
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to enroll in course';
      toast.error(message);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'enrolled') return matchesSearch && (course.isEnrolled || enrolledCourseIds.includes(course.courseId));
    if (filterRole === 'available') return matchesSearch && !(course.isEnrolled || enrolledCourseIds.includes(course.courseId));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'student' 
                  ? 'Browse and enroll in courses to start learning'
                  : user?.role === 'professor'
                
                }
              </p>
            </div>
            {user?.role === 'admin' && (
              <Link
                to="/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {user?.role === 'student' && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Courses</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="available">Available</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No courses are available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.courseId} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    {course.isEnrolled && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Enrolled
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  {(user?.role === 'professor' || user?.role === 'admin') && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {user?.role === 'professor'
                          ? getEnrollmentInfo(course.courseId)?.enrolledCount ?? 0
                          : course.enrolledCount ?? course.studentCount ?? 0
                        } students
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/courses/${course.courseId}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      
                      {user?.role === 'student' && !enrolledCourseIds.includes(course.courseId) && (
                        <button
                          onClick={() => handleEnroll(course.courseId)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Enroll
                        </button>
                      )}
                      {user?.role === 'student' && enrolledCourseIds.includes(course.courseId) && (
                        <button
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                          disabled
                        >
                          <svg className="h-4 w-4 mr-1 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Enrolled
                        </button>
                      )}
                      
                      {(user?.role === 'professor' || user?.role === 'admin') && (
                        <Link
                          to={`/courses/${course.courseId}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-50 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      )}
                    </div>
                    
                    {course.isEnrolled && (
                      <Link
                        to={`/courses/${course.courseId}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Continue
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList; 