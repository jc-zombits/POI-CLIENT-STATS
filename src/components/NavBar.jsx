"use client"

import Link from "next/link";
import { Home, Menu, Users, Folder, Info, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function NavigationBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-gray-900 backdrop-blur-md shadow-md fixed w-full top-0 z-10 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button className="flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200">
              <Menu className="h-5 w-5 mr-2" />
              <span className="font-medium">Menu</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 relative">
            <Link 
              href="/" 
              className="flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
            >
              <Home className="h-5 w-5 mr-2" />
              <span className="font-medium">Home</span>
            </Link>

            <Link 
              href="/usuarios" 
              className="flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
            >
              <Users className="h-5 w-5 mr-2" />
              <span className="font-medium">Usuarios</span>
            </Link>

            {/* Menú Maestro con subitems */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200 ${isDropdownOpen ? 'bg-gray-700' : ''}`}
              >
                <Folder className="h-5 w-5 mr-2" />
                <span className="font-medium">Maestro</span>
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 overflow-hidden">
                  <Link 
                    href="/maestro/modulos" 
                    className="block px-4 py-3 hover:bg-gray-700 text-gray-200 transition-colors duration-200 border-b border-gray-700"
                  >
                    Módulos
                  </Link>
                  <Link 
                    href="/maestro/actividades" 
                    className="block px-4 py-3 hover:bg-gray-700 text-gray-200 transition-colors duration-200 border-b border-gray-700"
                  >
                    Actividades
                  </Link>
                  <Link 
                    href="/maestro/proyectos" 
                    className="block px-4 py-3 hover:bg-gray-700 text-gray-200 transition-colors duration-200"
                  >
                    Proyectos
                  </Link>
                </div>
              )}
            </div>

            <Link 
              href="/maestro/cumplimiento" 
              className="flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
            >
              {/* Cambiar el icono por uno más adecuado */}
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">Cumplimiento</span>
            </Link>

            <Link 
              href="/about" 
              className="flex items-center text-gray-200 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
            >
              <Info className="h-5 w-5 mr-2" />
              <span className="font-medium">About</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}