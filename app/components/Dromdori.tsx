'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface DromdoriProps {
  sitesprenBase: string;
  compact?: boolean; // Optional prop for smaller sizing
}

export default function Dromdori({ sitesprenBase, compact = false }: DromdoriProps) {
  const [klocDropdownOpen, setKlocDropdownOpen] = useState(false);
  const [kservDropdownOpen, setKservDropdownOpen] = useState(false);
  const klocDropdownRef = useRef<HTMLDivElement>(null);
  const kservDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      if (klocDropdownRef.current && !klocDropdownRef.current.contains(target)) {
        setKlocDropdownOpen(false);
      }
      if (kservDropdownRef.current && !kservDropdownRef.current.contains(target)) {
        setKservDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the base URL for the app
  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const appUrl = getAppUrl();
  
  // Encode the sitespren_base for URL parameters
  const encodedSitespren = encodeURIComponent(sitesprenBase);
  
  // Define the button class based on compact mode
  const buttonClass = compact 
    ? "inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium border rounded transition-colors"
    : "px-2 py-1 text-center text-sm font-medium border rounded transition-colors";
    
  // Define dropdown button class
  const dropdownButtonClass = compact 
    ? "inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium border rounded transition-colors cursor-pointer"
    : "px-2 py-1 text-center text-sm font-medium border rounded transition-colors cursor-pointer";
    
  // Define dropdown menu class
  const dropdownMenuClass = compact
    ? "absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-20"
    : "absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-24";

  return (
    <div className={`inline-flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {/* Internal /drom link */}
      <Link
        href={`/drom?sitesentered=${encodedSitespren}&activefilterchamber=daylight&showmainchamberboxes=no&showtundrachamber=yes&sitesperview=1&speccolumnpage=1`}
        className={`${buttonClass} bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 hover:border-purple-400`}
        title="Open in Drom"
      >
        /drom
      </Link>
      
      {/* Rup Driggs Mar link */}
      <a
        href={`http://${sitesprenBase}/wp-admin/admin.php?page=rup_driggs_mar`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400`}
        title="Rup Driggs Manager"
      >
        =rupdm
      </a>
      
      {/* Grove Driggs Mar link */}
      <a
        href={`http://${sitesprenBase}/wp-admin/admin.php?page=grove_driggs_mar`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400`}
        title="Grove Driggs Manager"
      >
        =grovedm
      </a>
      
      {/* Beacon Driggs Mar link */}
      <a
        href={`http://${sitesprenBase}/wp-admin/admin.php?page=beacon_driggs_mar`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400`}
        title="Beacon Driggs Manager"
      >
        =beacondm
      </a>
      
      {/* kloc dropdown */}
      <div className="relative" ref={klocDropdownRef}>
        <button
          onClick={() => setKlocDropdownOpen(!klocDropdownOpen)}
          className={`${dropdownButtonClass} bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400`}
          title="Location Managers"
        >
          kloc
        </button>
        {klocDropdownOpen && (
          <div className={dropdownMenuClass}>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=rup_locations_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
            >
              =ruploc
            </a>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=grove_locations_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-green-700 hover:bg-green-50"
            >
              =groveloc
            </a>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=beacon_locations_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
            >
              =beaconloc
            </a>
          </div>
        )}
      </div>
      
      {/* kserv dropdown */}
      <div className="relative" ref={kservDropdownRef}>
        <button
          onClick={() => setKservDropdownOpen(!kservDropdownOpen)}
          className={`${dropdownButtonClass} bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100 hover:border-pink-400`}
          title="Service Managers"
        >
          kserv
        </button>
        {kservDropdownOpen && (
          <div className={dropdownMenuClass}>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=rup_services_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
            >
              =rupserv
            </a>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=grove_services_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-green-700 hover:bg-green-50"
            >
              =groveserv
            </a>
            <a
              href={`http://${sitesprenBase}/wp-admin/admin.php?page=beacon_services_mar`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
            >
              =beaconserv
            </a>
          </div>
        )}
      </div>
    </div>
  );
}