import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Mail, 
  Target, 
  TrendingUp, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Users,
  Send,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  TrendingDown,
  BarChart3,
  Zap,
  Search
} from 'lucide-react';
import { dashboardAPI, clientAPI } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { clientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('segments');

  useEffect(() => {
    if (clientId) {
      fetchDashboardData();
    }
  }, [clientId]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getOverview(clientId);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await clientAPI.sync(clientId);
      await fetchDashboardData();
      alert('Data synced successfully!');
    } catch (error) {
      alert('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, change, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm font-semibold ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="ml-1">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {data.client.clientName}
          </h1>
          <p className="text-gray-600 mt-1">
            Last synced: {data.client.lastSyncAt 
              ? new Date(data.client.lastSyncAt).toLocaleString()
              : 'Never'}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Top Metrics - Clean & Simple */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total Campaigns</p>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalCampaigns}</p>
        </div>
        
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total Segments</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalSegments || 0}</p>
        </div>
        
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total Emails</p>
            <Mail className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalEmails || 0}</p>
        </div>
        
        <div className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total Sent</p>
            <Send className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalEmailsSent.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'segments', label: 'Segments', icon: Users, badge: data.summary.totalSegments || 0 },
              { key: 'campaigns', label: 'Campaigns', icon: Target, badge: data.summary.totalCampaigns },
              { key: 'emails', label: 'Emails', icon: Mail, badge: data.summary.totalEmails }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.key 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'segments' && (
            <SegmentsTab clientId={clientId} />
          )}
          {activeTab === 'campaigns' && (
            <CampaignsTab clientId={clientId} />
          )}
          {activeTab === 'emails' && (
            <EmailsTab clientId={clientId} />
          )}
        </div>
      </div>
    </div>
  );
}

function SegmentsTab({ clientId }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSegments, setTotalSegments] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchSegments();
  }, [clientId, currentPage]);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getSegments(clientId, { page: currentPage, limit: itemsPerPage });
      setSegments(response.data.segments);
      setTotalPages(response.data.pagination.totalPages);
      setTotalSegments(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Contact Segments</h3>
          <p className="text-sm text-gray-600 mt-1">
            Segment data from Mautic Contacts → Segments
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{segments.length}</p>
          <p className="text-xs text-gray-600">Total Segments</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Segments Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  # Contacts
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Modified Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {segments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">No segments data available yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create segments in your Mautic instance under Contacts → Segments
                    </p>
                  </td>
                </tr>
              ) : (
                segments.map((segment, index) => (
                  <tr key={segment.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-900">{segment.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                        {segment.contactCount || 'No Contacts'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(segment.dateAdded).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(segment.dateModified).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {segment.createdBy || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSegments)} of {totalSegments} segments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-semibold">About Segments</p>
            <p className="text-xs text-blue-800 mt-1">
              Segments are dynamic groups of contacts based on filters. Segments data is synced from Mautic's segment endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({ clientId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchCampaigns();
  }, [clientId, currentPage]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getCampaigns(clientId, { page: currentPage, limit: itemsPerPage });
      setCampaigns(response.data.campaigns);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCampaigns(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Calculate total statistics
  const totalContacts = campaigns.reduce((acc, campaign) => acc + (campaign.totalContacts || 0), 0);
  const publishedCount = campaigns.filter(c => c.isPublished).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Marketing Campaigns</h3>
          <p className="text-sm text-gray-600 mt-1">
            Campaign data from Mautic Components → Campaigns
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
          <p className="text-xs text-gray-600">Total Campaigns</p>
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-700" />
            <p className="text-xs text-purple-700 font-semibold">Total Campaigns</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">{campaigns.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-700" />
            <p className="text-xs text-green-700 font-semibold">Published</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{publishedCount}</p>
          <p className="text-xs text-green-700 mt-1">
            {campaigns.length > 0 ? Math.round((publishedCount / campaigns.length) * 100) : 0}% of total
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-700" />
            <p className="text-xs text-blue-700 font-semibold">Total Contacts</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{totalContacts.toLocaleString()}</p>
          <p className="text-xs text-blue-700 mt-1">
            Avg {campaigns.length > 0 ? Math.round(totalContacts / campaigns.length) : 0} per campaign
          </p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">All Campaigns</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Campaign Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Contacts
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No campaigns found. Create campaigns in your Mautic instance under Components → Campaigns.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign, index) => (
                  <tr key={campaign.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 transition-colors`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-700 font-bold text-sm">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">{campaign.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-sm text-gray-600 truncate" title={campaign.description}>
                        {campaign.description || <span className="text-gray-400 italic">No description</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900 text-base">
                        {campaign.totalContacts.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                        campaign.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {campaign.isPublished ? '✓ Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCampaigns)} of {totalCampaigns} campaigns
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-semibold">About Campaign Data</p>
            <p className="text-xs text-blue-800 mt-1">
              This shows campaign information from Mautic. For email performance metrics, check the <strong>Emails</strong> tab. 
              Mautic stores email statistics separately from campaigns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailsTab({ clientId }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchEmails();
  }, [clientId, currentPage]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getEmails(clientId, { page: currentPage, limit: itemsPerPage });
      setEmails(response.data.emails);
      setTotalPages(response.data.pagination.totalPages);
      setTotalEmails(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Calculate total statistics
  const totalStats = emails.reduce((acc, email) => ({
    sent: acc.sent + (email.sentCount || 0),
    opened: acc.opened + (email.readCount || 0),
    clicked: acc.clicked + (email.clickedCount || 0),
    failed: acc.failed + (email.failedCount || 0),
  }), { sent: 0, opened: 0, clicked: 0, failed: 0 });

  const avgOpenRate = totalStats.sent > 0 ? ((totalStats.opened / totalStats.sent) * 100).toFixed(1) : 0;
  const avgClickRate = totalStats.sent > 0 ? ((totalStats.clicked / totalStats.sent) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Email Templates & Statistics</h3>
          <p className="text-sm text-gray-600 mt-1">
            Individual email performance from Mautic Channels → Emails
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{totalEmails}</p>
          <p className="text-xs text-gray-600">Total Emails</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-green-700" />
            <p className="text-xs text-green-700 font-semibold">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{totalStats.sent.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-blue-700" />
            <p className="text-xs text-blue-700 font-semibold">Total Opened</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalStats.opened.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="w-4 h-4 text-orange-700" />
            <p className="text-xs text-orange-700 font-semibold">Total Clicked</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">{totalStats.clicked.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-700" />
            <p className="text-xs text-red-700 font-semibold">Total Failed</p>
          </div>
          <p className="text-2xl font-bold text-red-900">{totalStats.failed.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-700" />
            <p className="text-xs text-purple-700 font-semibold">Avg Open Rate</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{avgOpenRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="w-4 h-4 text-pink-700" />
            <p className="text-xs text-pink-700 font-semibold">Avg Click Rate</p>
          </div>
          <p className="text-2xl font-bold text-pink-900">{avgClickRate}%</p>
        </div>
      </div>

      {/* Email Statistics Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">All Email Templates</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Stats
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Modified Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">No emails found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create emails in your Mautic instance under Channels → Emails
                    </p>
                  </td>
                </tr>
              ) : (
                emails.map((email, index) => (
                  <tr key={email.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-900">{email.name || email.subject || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded inline-flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                        Uncategorized
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {email.sentCount} Sent
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-teal-500" />
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                            {email.readCount} Read ({email.openRate.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {email.publishedAt ? new Date(email.publishedAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'Not published'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {email.publishedAt ? new Date(email.publishedAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 'Not published'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Razaq D
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {email.mauticEmailId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEmails)} of {totalEmails} emails
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
