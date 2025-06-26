import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import toast from 'react-hot-toast';
import {FileText, Upload, Loader, X } from 'lucide-react';

const CourseEdit = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [setEditLoading] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {

      const courseResponse = await axios.get('/courses/view');
      const courseData = courseResponse.data.find(c => c.courseId === courseId);
      if (!courseData) {
        toast.error('Course not found.');
        navigate('/courses');
        return;
      }

      if (user.role !== 'admin' && courseData.professorId !== user.userId) {
        toast.error('You are not authorized to edit this course.');
        navigate('/courses');
        return;
      }
      setCourse(courseData);
      setEditForm({ title: courseData.title, description: courseData.description });

      const materialsResponse = await axios.get(`/courses/materials/${courseId}`);
      setMaterials(materialsResponse.data);
    } catch (error) {
      toast.error('Failed to load course data.');
    } finally {
      setLoading(false);
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
      setUploadForm({ title: '', file: null });
      fetchCourseData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };


  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {

      toast.success('Course info updated!');
      fetchCourseData();
    } catch (error) {
      toast.error('Failed to update course info.');
    } finally {
      setEditLoading(false);
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
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            
          </div>

          <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10" onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
                disabled
              />
            </div>

          </form>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Material</h2>
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
              <button
                type="submit"
                disabled={uploading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? <Loader className="h-5 w-5 animate-spin" /> : 'Upload'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Materials</h2>
            {materials.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-gray-900">No materials uploaded</h4>
                <p className="mt-1 text-sm text-gray-500">Upload course materials to get started.</p>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEdit; 