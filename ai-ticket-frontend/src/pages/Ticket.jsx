import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function Ticket() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchTicket = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: "GET",
        }
      );
      const data = await res.json();
      setTicket(data.ticketSingle);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket not found</h2>
            <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
            <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tickets
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Ticket Details</h1>
          </div>

          {/* Ticket Content */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{ticket.title}</h2>
              {ticket.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              )}
            </div>

            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
            </div>

            {/* Metadata Section */}
            {ticket.status && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {ticket.priority && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Priority</span>
                      <p className="text-gray-900">{ticket.priority}</p>
                    </div>
                  )}

                  {ticket.assignedTo && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Assigned To</span>
                      <p className="text-gray-900">{ticket.assignedTo?.email}</p>
                    </div>
                  )}

                  {ticket.createdAt && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created</span>
                      <p className="text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {ticket.relatedSkills?.length > 0 && (
                  <div className="mb-6">
                    <span className="text-sm font-medium text-gray-500 block mb-2">Related Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.relatedSkills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.helpfulNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">Helpful Notes</span>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {ticket.helpfulNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
