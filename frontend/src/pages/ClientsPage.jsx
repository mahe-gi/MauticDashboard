
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, ExternalLink, CheckCircle, XCircle, Users, BarChart3 } from 'lucide-react';
import { clientAPI } from '../api/api';
import AddClientModal from '../components/AddClientModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingClientId, setSyncingClientId] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll();
      setClients(response.data.clients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await clientAPI.delete(id);
      fetchClients();
    } catch (error) {
      alert('Failed to delete client');
    }
  };

  const handleSync = async (id) => {
    setSyncingClientId(id);
    try {
      await clientAPI.sync(id);
      alert('Sync completed successfully!');
      fetchClients(); // Refresh the list to show updated lastSyncAt
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || error.message || 'Failed to sync data';
      
      // Add hint if available
      if (errorData?.hint) {
        errorMessage += '\n\n💡 Tip: ' + errorData.hint;
      }
      
      alert(errorMessage);
    } finally {
      setSyncingClientId(null);
    }
  };

  const handleViewDashboard = (id) => {
    navigate(`/dashboard/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mautic Clients</h1>
          <p className="text-gray-600 mt-2">
            Manage your Mautic instances and sync data
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No clients yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first Mautic client to get started
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Mautic URL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Added On
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client, index) => (
                  <tr 
                    key={client.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          client.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Users className={`w-5 h-5 ${
                            client.isActive ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{client.clientName}</div>
                          {!client.hasToken && (
                            <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded inline-block">
                              ⚠️ No auth token
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={client.baseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
                      >
                        {client.baseUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {client.lastSyncAt ? (
                        <div>
                          <div className="font-medium">{new Date(client.lastSyncAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(client.lastSyncAt).toLocaleTimeString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Never synced</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDashboard(client.id)}
                          className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-semibold"
                          title="View Dashboard"
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => handleSync(client.id)}
                          disabled={syncingClientId === client.id || !client.hasToken}
                          className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                            !client.hasToken
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                          }`}
                          title={client.hasToken ? 'Sync data' : 'No auth token - add client with username/password'}
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              syncingClientId === client.id ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}
