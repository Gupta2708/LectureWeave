import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../api/endpoints/dashboard';
import {
  BookOpen,
  FileText,
  Folder,
  Upload,
  Plus,
  TrendingUp,
  Clock,
  Search,
  ArrowRight,
  Activity,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard_Professional = () => {
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  
  const [stats, setStats] = useState({
    subject_count: 0,
    lecture_count: 0,
    notes_count: 0,
    documents_count: 0,
    recent_lectures: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardStats();

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = () => {
    navigate('/subjects/new');
  };

  const handleViewAllSubjects = () => {
    navigate('/subjects');
  };

  const handleViewAllNotes = () => {
    navigate('/my-notes');
  };

  const handleLectureClick = (lecture) => {
    navigate(`/lecture/${lecture._id}`, { state: { lecture } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your lectures today
              </p>
            </div>
             {/* <p className='text-xl text-black'>Please use personal internet for this project</p> */}
            
            <button
              onClick={handleCreateSubject}
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Subjects Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewAllSubjects}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.subject_count}
            </div>
            <div className="text-sm text-gray-600">Total Subjects</div>
          </div>

          {/* Lectures Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.lecture_count}
            </div>
            <div className="text-sm text-gray-600">Total Lectures</div>
          </div>

          {/* Notes Card */}
          {/* <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewAllNotes}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.notes_count}
            </div>
            <div className="text-sm text-gray-600">Saved Notes</div>
          </div> */}

          {/* Documents Card */}
          {/* <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.documents_count}
            </div>
            <div className="text-sm text-gray-600">Documents</div>
          </div> */}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handleCreateSubject}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Create Subject</h3>
            <p className="text-sm text-indigo-100">Start organizing your lectures</p>
          </button>

          <button
            onClick={handleViewAllSubjects}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
          >
            <BookOpen className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Start Lecture</h3>
            <p className="text-sm text-green-100">Record and transcribe live</p>
          </button>

          <button
            onClick={handleViewAllNotes}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
          >
            <FileText className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">View Notes</h3>
            <p className="text-sm text-purple-100">Access all saved notes</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                Recent Lectures
              </h2>
              {stats.recent_lectures.length > 0 && (
                <button
                  onClick={handleViewAllSubjects}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {stats.recent_lectures.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No lectures yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your first lecture to see it here
                </p>
                <button
                  onClick={handleCreateSubject}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Subject
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recent_lectures.map((lecture) => (
                  <div
                    key={lecture._id}
                    onClick={() => handleLectureClick(lecture)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {lecture.title || 'Untitled Lecture'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(lecture.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {lecture.status || 'Completed'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Quick Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 mt-0.5">•</span>
              <span>Upload reference documents before starting a lecture for better note quality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 mt-0.5">•</span>
              <span>Speak clearly and pause between topics for accurate transcription</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 mt-0.5">•</span>
              <span>Review and download your notes immediately after each lecture</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard_Professional;
