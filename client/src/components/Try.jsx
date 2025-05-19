import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { getSlotRequests, approveSlotRequest, rejectSlotRequest } from '../services/api';
import ErrorMessage from '../utils/error-msg';

export default function SlotRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({ api: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      try {
        const response = await getSlotRequests({
          page: pagination.page,
          limit: pagination.limit,
          search,
        });
        console.log('API Response:', response);
        const { data, meta } = response;
        if (isMounted) {
          setRequests(data || []);
          setPagination(
            meta
              ? {
                  page: meta.currentPage,
                  limit: meta.limit,
                  total: meta.totalItems,
                  pages: meta.totalPages,
                }
              : { page: 1, limit: 10, total: 0, pages: 1 }
          );
          setErrors({ api: '' });
        }
      } catch (error) {
        console.error('API Error:', error);
        if (isMounted) {
          setErrors({ api: error.response?.data?.error || 'Failed to load requests' });
          setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
          setRequests([]);
        }
      }
    };

    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, [pagination, search]);

  useEffect(() => {
    console.log('Requests updated:', requests);
    console.log('Pagination updated:', pagination);
  }, [requests, pagination]);

  const handleApprove = async (id) => {
    console.log('Approve button clicked for ID:', id);
    try {
      await approveSlotRequest(id);
      setErrors({ api: '' });
      const { data, meta } = await getSlotRequests({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      console.log('Post-approve data:', data, 'Meta:', meta);
      setRequests(data || []);
      setPagination(
        meta
          ? {
              page: meta.currentPage,
              limit: meta.limit,
              total: meta.totalItems,
              pages: meta.totalPages,
            }
          : { page: 1, limit: 10, total: 0, pages: 1 }
      );
    } catch (error) {
      console.error('Approve error:', error);
      setErrors({ api: error.response?.data?.error || 'Failed to approve request' });
    }
  };

  const handleReject = async (id) => {
    console.log('Reject button clicked for ID:', id);
    try {
      await rejectSlotRequest(id);
      setErrors({ api: '' });
      const { data, meta } = await getSlotRequests({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      console.log('Post-reject data:', data, 'Meta:', meta);
      setRequests(data || []);
      setPagination(
        meta
          ? {
              page: meta.currentPage,
              limit: meta.limit,
              total: meta.totalItems,
              pages: meta.totalPages,
            }
          : { page: 1, limit: 10, total: 0, pages: 1 }
      );
    } catch (error) {
      console.error('Reject error:', error);
      setErrors({ api: error.response?.data?.error || 'Failed to reject request' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Slot Requests</h1>
        <ErrorMessage message={errors.api} />

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          {requests.length === 0 ? (
            <p className="text-gray-500">No requests found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-gray-600">Vehicle</th>
                    <th className="py-3 px-4 text-gray-600">Slot</th>
                    <th className="py-3 px-4 text-gray-600">Status</th>
                    <th className="py-3 px-4 text-gray-600">Date</th>
                    <th className="py-3 px-4 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">{r.vehicle?.plateNumber || 'N/A'}</td>
                      <td className="py-3 px-4">{r.slot?.slotNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            r.requestStatus === 'approved'
                              ? 'bg-success-green text-white'
                              : r.requestStatus === 'rejected'
                              ? 'bg-error-red text-white'
                              : 'bg-warning-amber text-white'
                          }`}
                        >
                          {r.requestStatus}
                          {console.log('Request:', r.id, r.requestStatus)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {r.requestStatus === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="bg-success-green text-white px-3 py-1 rounded-lg hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              className="bg-error-red text-white px-3 py-1 rounded-lg hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span className="text-gray-600">Page {pagination.page} of {pagination.pages}</span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}