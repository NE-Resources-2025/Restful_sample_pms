import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { getSlotRequests, approveSlotRequest, rejectSlotRequest } from '../services/api';
import ErrorMessage from '../utils/error-msg';
import { FaUser ,FaSearch, FaCheck, FaTimes, FaCalendarAlt, FaCar, FaParking, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IoMdCheckmarkCircle, IoMdCloseCircle, IoMdTime } from 'react-icons/io';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

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
        const { data, pagination: pag } = response;
        if (isMounted) {
          setRequests(data || []);
          setPagination(pag || { page: 1, limit: 10, total: 0, pages: 1 });
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
  }, [pagination.page, search]); // Only depend on page and search

  const handleApprove = async (id) => {
    try {
      const updatedRequest = await approveSlotRequest(id);
      setRequests(requests.map((req) =>
        req.id === id
          ? { ...req, requestStatus: updatedRequest.requestStatus, slotNumber: updatedRequest.slotNumber }
          : req
      ));
      setErrors({ api: '' });
      toast.success('Request approved successfully');
    } catch (error) {
      setErrors({ api: error.response?.data?.error || 'Failed to approve request' });
      toast.error(error.response?.data?.error || 'Failed to approve request');
    }
  };
  
  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:') || 'No reason provided';
    try {
      const updatedRequest = await rejectSlotRequest(id, reason);
      setRequests(requests.map((req) =>
        req.id === id ? { ...req, requestStatus: updatedRequest.requestStatus } : req
      ));
      setErrors({ api: '' });
      toast.success('Request rejected successfully');
    } catch (error) {
      setErrors({ api: error.response?.data?.error || 'Failed to reject request' });
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
  };

  const StatusBadge = ({ status }) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch(status) {
      case 'approved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <IoMdCheckmarkCircle className="mr-1 text-green-500" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <IoMdCloseCircle className="mr-1 text-red-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-amber-100 text-amber-800`}>
            <IoMdTime className="mr-1 text-amber-500" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Parking Slot Requests</h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and manage incoming parking slot requests
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <ErrorMessage message={errors.api} />

        {/* Requests Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          {requests.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">No slot requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
  <tr>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex items-center">
        <FaUser className="mr-2" />
        User Email
      </div>
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex items-center">
        <FaCar className="mr-2" />
        Vehicle
      </div>
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex items-center">
        <FaParking className="mr-2" />
        Slot
      </div>
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Status
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex items-center">
        <FaCalendarAlt className="mr-2" />
        Date
      </div>
    </th>
    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
  {requests.map((r) => (
    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {r.user?.email || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {r.vehicle?.plateNumber || 'N/A'} ({r.vehicle?.vehicleType || 'N/A'})
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {r.slotNumber || 'Not Assigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <StatusBadge status={r.requestStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {r.requestStatus === 'pending' && (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleApprove(r.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaCheck className="mr-1" />
              Approve
            </button>
            <button
              onClick={() => handleReject(r.id)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FaTimes className="mr-1" />
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
              disabled={pagination.page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <FaChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <FaChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}