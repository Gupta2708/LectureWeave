import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../api/endpoints/subjects';
import {
  Plus,
  Folder,
  BookOpen,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const SubjectsManagement = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await listSubjects();

      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await createSubject(formData);

      if (response.data.success) {
        toast.success('Subject created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', code: '', description: '' });
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await updateSubject(editingSubject._id, formData);

      if (response.data.success) {
        toast.success('Subject updated successfully!');
        setEditingSubject(null);
        setFormData({ name: '', code: '', description: '' });
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject?')) {
      return;
    }
    
    try {
      const response = await deleteSubject(subjectId);

      if (response.data.success) {
        toast.success('Subject deleted successfully!');
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingSubject(null);
    setShowCreateModal(true);
  };

  const openEditModal = (subject) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || ''
    });
    setEditingSubject(subject);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '' });
  };

  const handleStartLecture = (subject) => {
    navigate(`/subjects/${subject._id}/setup`, { 
      state: { 
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code
      } 
    });
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-gray-600 mt-1">
                Manage your subjects and start lectures
              </p>
            </div>
            
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Subject
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No subjects found' : 'No subjects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try a different search term' 
                : 'Create your first subject to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Subject
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div
                key={subject._id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Folder className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject._id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{subject.code}</p>
                  
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{subject.lecture_count || 0} lectures</span>
                    </div>
                    <button
                      onClick={() => handleStartLecture(subject)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      Start Lecture
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3 text-xs">
                    <button onClick={() => navigate(`/subjects/${subject._id}/chat`)} className="text-indigo-700">Chat</button>
                    <button onClick={() => navigate(`/subjects/${subject._id}/flashcards`)} className="text-indigo-700">Flashcards</button>
                    <button onClick={() => navigate(`/subjects/${subject._id}/quizzes`)} className="text-indigo-700">Quiz</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingSubject ? handleUpdateSubject : handleCreateSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Machine Learning"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., CS-401"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of the subject..."
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingSubject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsManagement;
