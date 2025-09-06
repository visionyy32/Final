import { useState, useEffect } from 'react'
import { parcelService } from '../services/supabaseService'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const OrderHistory = ({ userData }) => {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalParcels: 0,
    totalSpent: 0,
    avgDeliveryTime: 0,
    mostCommonDestination: '',
    statusCounts: {}
  })

  useEffect(() => {
    const loadParcels = async () => {
      try {
        setLoading(true)
        const { data, error } = await parcelService.getUserParcels()
        
        if (error) {
          console.error('Error loading parcels:', error)
          return
        }
        
        const userParcels = data?.filter(parcel => parcel.user_id === userData?.id) || []
        setParcels(userParcels)
        
        // Calculate statistics
        calculateStats(userParcels)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (userData?.id) {
      loadParcels()
    }
  }, [userData])
  
  const calculateStats = (parcels) => {
    if (!parcels.length) return
    
    // Calculate status counts
    const statusCounts = parcels.reduce((acc, parcel) => {
      acc[parcel.status] = (acc[parcel.status] || 0) + 1
      return acc
    }, {})
    
    // Calculate total spent
    const totalSpent = parcels.reduce((total, parcel) => total + (parcel.cost || 0), 0)
    
    // Calculate average delivery time for delivered parcels
    const deliveredParcels = parcels.filter(p => p.status === 'Delivered')
    let avgDeliveryTime = 0
    
    if (deliveredParcels.length) {
      const totalDays = deliveredParcels.reduce((sum, parcel) => {
        const created = new Date(parcel.created_at)
        const delivered = new Date(parcel.updated_at)
        const days = Math.round((delivered - created) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      
      avgDeliveryTime = (totalDays / deliveredParcels.length).toFixed(1)
    }
    
    // Find most common destination
    const destinationCounts = parcels.reduce((acc, parcel) => {
      acc[parcel.destination] = (acc[parcel.destination] || 0) + 1
      return acc
    }, {})
    
    const mostCommonDestination = Object.entries(destinationCounts)
      .sort((a, b) => b[1] - a[1])
      .shift()?.[0] || 'None'
    
    setStats({
      totalParcels: parcels.length,
      totalSpent: totalSpent.toFixed(2),
      avgDeliveryTime,
      mostCommonDestination,
      statusCounts
    })
  }
  
  const pieChartData = {
    labels: Object.keys(stats.statusCounts),
    datasets: [
      {
        data: Object.values(stats.statusCounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderWidth: 1
      },
    ],
  }
  
  // Monthly activity chart data
  const getMonthlyData = () => {
    const last6Months = Array.from({length: 6}, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return date.toLocaleString('default', { month: 'short' })
    }).reverse()
    
    const monthlyCounts = last6Months.map(month => {
      return parcels.filter(parcel => {
        const parcelMonth = new Date(parcel.created_at)
          .toLocaleString('default', { month: 'short' })
        return parcelMonth === month
      }).length
    })
    
    return {
      labels: last6Months,
      datasets: [
        {
          label: 'Parcels Sent',
          data: monthlyCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Shipping History</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your shipping history...</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Total Shipments</h3>
              <p className="text-3xl font-bold text-slate-900">{stats.totalParcels}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Total Spent</h3>
              <p className="text-3xl font-bold text-slate-900">KSh {stats.totalSpent}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Avg. Delivery Time</h3>
              <p className="text-3xl font-bold text-slate-900">{stats.avgDeliveryTime} days</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Common Destination</h3>
              <p className="text-3xl font-bold text-slate-900">{stats.mostCommonDestination}</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Shipment Status</h3>
              <div className="h-64">
                <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Monthly Activity</h3>
              <div className="h-64">
                <Bar 
                  data={getMonthlyData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Parcel History Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-700 p-6 border-b">Parcel History</h3>
            
            {parcels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcels.map(parcel => (
                      <tr key={parcel.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{parcel.tracking_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(parcel.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parcel.origin || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parcel.destination || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            parcel.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            parcel.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                            parcel.status === 'Pending Pickup' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {parcel.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          KSh {parcel.cost ? parcel.cost.toFixed(2) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No shipment history found.</p>
                <p className="mt-2 text-sm">Start shipping with TrackFlow to see your history here!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default OrderHistory