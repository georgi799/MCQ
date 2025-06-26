import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Users,
  Loader,
  X
} from 'lucide-react';

const UploadMaterialModal = ({ courseId, onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("material", file);
      formData.append("courseId", courseId);
      await axios.post("/courses/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Material uploaded successfully!");
      setTitle("");
      setFile(null);
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Upload Material</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Material title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={e => setFile(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? <Loader className="h-5 w-5 animate-spin" /> : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setMaterialsMap] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

  const fetchCourses = async () => {
    try {
      const coursesResponse = await axios.get('/courses/view');
      const professorCourses = coursesResponse.data.filter(
        course => course.professorId === user?.userId
      );
      setCourses(professorCourses);
      const materialsObj = {};
      for (const course of professorCourses) {
        const materialsResponse = await axios.get(`/courses/materials/${course.courseId}`);
        materialsObj[course.courseId] = materialsResponse.data;
      }
      setMaterialsMap(materialsObj);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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

  const getEnrollmentInfo = (courseId) => {
    return enrollments.find(e => e.courseId === courseId);
  };

  const openUploadModal = (courseId) => {
    setActiveCourseId(courseId);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setActiveCourseId(null);
  };

  const handleUploadSuccess = () => {
    fetchCourses();
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
            <h1 className="text-3xl font-bold text-gray-900">Professor Dashboard</h1>
           
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No courses assigned</h3>
              <p className="mt-1 text-base text-gray-500">
                You are not assigned to any courses.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course) => {
                const enrollment = getEnrollmentInfo(course.courseId);
                return (
                  <div key={course.courseId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{enrollment ? enrollment.enrolledCount : 0} students enrolled</span>
                        </div>
                      </div>
                      <button
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                        onClick={() => setSelectedCourseId(selectedCourseId === course.courseId ? null : course.courseId)}
                      >
                        {selectedCourseId === course.courseId ? 'Hide Students' : 'View Students'}
                      </button>
                    </div>
                    {selectedCourseId === course.courseId && enrollment && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Enrolled Students:</h4>
                        <ul className="list-disc list-inside text-gray-700">
                          {enrollment.enrolledStudents
                            ? enrollment.enrolledStudents.split(',').map((username) => (
                                <li key={username.trim()}>{username.trim()}</li>
                              ))
                            : <li>No students enrolled.</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showUploadModal && (
        <UploadMaterialModal
          courseId={activeCourseId}
          onClose={closeUploadModal}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default ProfessorDashboard; 