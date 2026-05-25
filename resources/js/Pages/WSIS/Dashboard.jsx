import { Link } from '@inertiajs/react';
import Layout from './Layout';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  TicketIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/outline';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { FaTasks } from 'react-icons/fa';


const Dashboard = () => {
  // Sample data
  const stats = [
    { name: 'Good Compliance', value: '170', change: '+75%', changeType: 'increase', icon: FaTasks },
    { name: 'Poor Compliance', value: '60', change: '+25%', changeType: 'increase', icon: CalendarIcon },
    { name: 'Safety Passport Compliance', value: '100', change: '0%', changeType: 'decrease', icon: UserGroupIcon },
    { name: 'Non-Conformance', value: '0', change: '0%', changeType: 'increase', icon: TicketIcon },
  ];

  const recentBookings = [
    { id: 1, customer: 'John Doe', court: 'Tennis #1', date: '2023-06-15', time: '14:00 - 16:00', amount: 'RM 60' },
    { id: 2, customer: 'Jane Smith', court: 'Badminton #2', date: '2023-06-15', time: '16:00 - 17:00', amount: 'RM 30' },
    { id: 3, customer: 'Mike Johnson', court: 'Squash #3', date: '2023-06-16', time: '09:00 - 10:00', amount: 'RM 25' },
    { id: 4, customer: 'Sarah Williams', court: 'Tennis #1', date: '2023-06-16', time: '11:00 - 13:00', amount: 'RM 90' },
  ];

  return (
    <Layout>
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

      
      {/* Welcome banner */}
      {/* <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-slate-800 font-bold">Good morning, Admin ✨</h1>
      </div> */}

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow shadow-slate-400 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium RM{
                  stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="-ml-0.5 mr-1 h-3 w-3 text-green-500" aria-hidden="true" />
                  ) : (
                    <ArrowDownIcon className="-ml-0.5 mr-1 h-3 w-3 text-red-500" aria-hidden="true" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white shadow shadow-slate-400 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Incident Statistic</h2>
            <div className="flex space-x-3">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Week</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-700">Month</button>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-700">Year</button>
            </div>
          </div>
          <div className="h-80">
            <LineChart />
          </div>
        </div>

        {/* Booking Types Chart */}
        <div className="bg-white shadow shadow-slate-400 rounded-lg p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Man-Hour</h2>
          <div className="h-80">
            <BarChart />
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white shadow shadow-slate-400 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Bookings</h3>
            <Link href="/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Court
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.court}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default Dashboard;