import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Play, 
  Upload, 
  Users,
  Calendar,
  ArrowLeft,
  Loader,
  Download,
  Edit,
  X
} from 'lucide-react';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });
  const [materialQuizMap, setMaterialQuizMap] = useState({});
  const [setEnrollments] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [generatingQuiz, setGeneratingQuiz] = useState({});
  const [setQuizzesLoading] = useState(false);
  const [setProfessorName] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseData();
    if (user?.role === 'professor') {
      fetchEnrollments();
    }
    if (user?.role === 'student') {
      axios.get('/courses/enrolled').then(res => {
        const enrolledIds = res.data.map(c => c.courseId);
        setIsEnrolled(enrolledIds.includes(courseId));
      });
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {

      const courseResponse = await axios.get(`/courses/view`);
      const courseData = courseResponse.data.find(c => c.courseId === courseId);
      setCourse(courseData);


      if (courseData && courseData.professorId) {
        try {
          const profRes = await axios.get(`/users/${courseData.professorId}`);
          setProfessorName(profRes.data.username || '');
        } catch {
          setProfessorName('');
        }
      }


      const materialsResponse = await axios.get(`/courses/materials/${courseId}`);
      setMaterials(materialsResponse.data);


      const quizMap = {};
      await Promise.all(materialsResponse.data.map(async (material) => {
        try {
          const quizRes = await axios.get(`/quizzes/by-material/${material.materialID}`);
          quizMap[material.materialID] = quizRes.data && quizRes.data.length > 0;
        } catch {
          quizMap[material.materialID] = false;
        }
      }));
      setMaterialQuizMap(quizMap);

      setQuizzesLoading(true);

      const quizzesResponse = await axios.get(`/quizzes/by-course/${courseId}`);

      if (user?.role === 'student') {

        const latestQuizByMaterial = {};
        quizzesResponse.data.forEach(q => {
          if (!latestQuizByMaterial[q.materialID]) {
            latestQuizByMaterial[q.materialID] = q;
          }
        });
        setQuizzes(Object.values(latestQuizByMaterial));
      } else {
        setQuizzes(quizzesResponse.data);
      }
      setQuizzesLoading(false);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
     
      setLoading(false);
      setQuizzesLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/courses/my-courses/enrollments');
      setEnrollments(res.data);
      const found = res.data.find(e => e.courseId === courseId);
      setEnrolledCount(found ? found.enrolledCount : 0);
    } catch (err) {
      setEnrolledCount(0);
    }
  };

  const handleGenerateQuiz = async (materialId) => {
    setGeneratingQuiz(prev => ({ ...prev, [materialId]: true }));
    try {
      await axios.post(`/courses/materials/${materialId}/generate-quiz`);
      toast.success('Quiz generation started! This may take a few moments.');
      setTimeout(fetchCourseData, 3000);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz');
    } finally {
      setGeneratingQuiz(prev => ({ ...prev, [materialId]: false }));
    }
  };

  const handleUploadInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setUploadForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setUploadForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.file) {
      toast.error('Please provide a title and select a file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('material', uploadForm.file);
      formData.append('courseId', courseId);
      await axios.post('/courses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Material uploaded successfully!');
      setShowUploadModal(false);
      setUploadForm({ title: '', file: null });
      fetchCourseData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

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

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Course not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The course you're looking for doesn't exist.
            </p>
            <div className="mt-6">
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalQuizzes = Object.values(materialQuizMap).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <Link
            to="/courses"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="mt-2 text-gray-600">{course.description}</p>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">

                {(user?.role === 'professor' || user?.role === 'admin') && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {user?.role === 'professor'
                        ? enrolledCount
                        : course.studentCount || 0
                      } students enrolled
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Created {new Date().toLocaleDateString()}</span>
                  {user?.role === 'student' && course.professorName && (
  <span className="ml-4">Taught by: <span className="font-medium text-gray-800">{course.professorName}</span></span>
)}
                </div>
              </div>
            </div>
            
            {(user?.role === 'professor' || user?.role === 'admin') && (
              <Link
                to={`/courses/${courseId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Link>
            )}
          </div>
        </div>


        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              key="overview"
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            {(user?.role !== 'student' || isEnrolled) && (
              <button
                key="materials"
                onClick={() => setActiveTab('materials')}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Materials
              </button>
            )}
          </nav>
        </div>


        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Overview</h2>
              <div className={`grid grid-cols-1 ${user?.role === 'professor' || user?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Materials</p>
                      <p className="text-2xl font-bold text-blue-600">{materials.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Brain className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Quizzes</p>
                      <p className="text-2xl font-bold text-green-600">{totalQuizzes}</p>
                    </div>
                  </div>
                </div>
                

                {(user?.role === 'professor' || user?.role === 'admin') && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-900">Students</p>
                        <p className="text-2xl font-bold text-purple-600">{user?.role === 'professor' ? enrolledCount : course.studentCount || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'materials' && user?.role === 'student' && !isEnrolled ? (
            <div className="p-6 text-center text-gray-500">
              You must be enrolled in this course to view materials and take quizzes.
            </div>
          ) : (
            activeTab === 'materials' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
                  {(user?.role === 'professor' || user?.role === 'admin') && (
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Material
                    </button>
                  )}
                </div>
                

                {showUploadModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowUploadModal(false)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <h3 className="text-lg font-semibold mb-4">Upload Material</h3>
                      <form onSubmit={handleMaterialUpload} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            name="title"
                            value={uploadForm.title}
                            onChange={handleUploadInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Material title"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">File</label>
                          <input
                            type="file"
                            name="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                            onChange={handleUploadInputChange}
                            className="mt-1 block w-full text-sm text-gray-700"
                            required
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            disabled={uploading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {uploading ? <Loader className="h-5 w-5 animate-spin" /> : 'Upload'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                {materials.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No materials yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user?.role === 'student' 
                        ? 'Materials will appear here once uploaded by the professor.'
                        : 'Upload course materials to get started.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materials.map((material) => (
                      <div key={material.materialID} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{material.title}</h3>
                            <p className="text-sm text-gray-500">Uploaded {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {materialQuizMap[material.materialID] ? (
                            <>
                              <Link
                                to={`/quiz/${material.materialID}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Take Quiz
                              </Link>
                              {(user?.role === 'professor' || user?.role === 'admin' || user?.role === 'student') && (
                                <button
                                  onClick={() => handleGenerateQuiz(material.materialID)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 ml-2"
                                  disabled={!!generatingQuiz[material.materialID]}
                                  title="Regenerate Quiz"
                                >
                                  <Brain className="h-4 w-4 mr-1" />
                                  {generatingQuiz[material.materialID] ? <Loader className="h-4 w-4 animate-spin" /> : 'Regenerate Quiz'}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleGenerateQuiz(material.materialID)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              disabled={!!generatingQuiz[material.materialID]}
                            >
                              <Brain className="h-4 w-4 mr-1" />
                              {generatingQuiz[material.materialID] ? <Loader className="h-4 w-4 animate-spin" /> : 'Generate Quiz'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 