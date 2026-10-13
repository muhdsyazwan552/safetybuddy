import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiUsers, 
  FiClock, 
  FiDollarSign, 
  FiCalendar, 
  FiChevronRight,
  FiHome,
  FiBriefcase,
  FiFileText,
  FiSettings,
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dummy projects data
  const projects = [
    {
      id: 1,
      title: "Oceanview Tower Construction",
      logo: "🏗️",
      type: "Commercial Building",
      status: "In Progress",
      startDate: "2023-06-15",
      duration: "18 months",
      budget: "$12.5M",
      team: { staff: 24, subcontractors: 8 },
      progress: 65,
      highlights: ["LEED Gold Certification", "Smart Building Systems", "Seismic Retrofitting"]
    },
    {
      id: 2,
      title: "Riverside Residential Complex",
      logo: "🏘️",
      type: "Residential Development",
      status: "Planning",
      startDate: "2023-09-01",
      duration: "24 months",
      budget: "$8.2M",
      team: { staff: 18, subcontractors: 5 },
      progress: 15,
      highlights: ["Sustainable Materials", "Community Amenities", "Flood Prevention"]
    }
  ];

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Projects Dashboard" />

      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-auto mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>

            {/* Logo and desktop nav */}
            <div className="flex items-center">
              <div className="mb-0 px-3 text-center">
            <img
              className="block w-auto h-12"
              src="/images/logo.png"
            />
          </div>
             
            </div>

            {/* Right side items */}
            <div className="hidden md:ml-6 md:flex md:items-center">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <span className="sr-only">Notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">John Doe</span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <FiUser />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link href="/dashboard" className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                <FiHome className="inline mr-2" /> Dashboard
              </Link>
              <Link href="/projects" className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                <FiBriefcase className="inline mr-2" /> Projects
              </Link>
              <Link href="/reports" className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                <FiFileText className="inline mr-2" /> Reports
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <FiUser />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">John Doe</div>
                  <div className="text-sm font-medium text-gray-500">Project Manager</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link href="#" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Your Profile</Link>
                <Link href="#" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Settings</Link>
                <Link href="#" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Sign out</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Portfolio</h1>
          <p className="text-gray-600">{projects.length} Active Projects</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors duration-200">
            <FiPlus className="mr-2" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              {/* Project Header */}
              <div className="p-6 pb-0 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-2xl">
                    {project.logo}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                    <p className="text-sm text-gray-500">{project.type}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === "In Progress" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-purple-100 text-purple-800"
                }`}>
                  {project.status}
                </span>
              </div>

              {/* Project Details */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <FiCalendar className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium">{project.startDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FiClock className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium">{project.duration}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-sm font-medium">{project.budget}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FiUsers className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Team</p>
                    <p className="text-sm font-medium">
                      {project.team.staff} staff, {project.team.subcontractors} subs
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{project.progress}% complete</p>
              </div>

              {/* Project Highlights */}
              {/* <div className="p-6 pt-2">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h3>
                <ul className="space-y-1">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-sm text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div> */}

              {/* Action Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                  View Project Details <FiChevronRight className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;