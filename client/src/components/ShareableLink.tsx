"use client";
import { useState } from 'react';
import { CopyIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';

export function ShareableLink() {
  const { currentHostel } = useHostel();
  const [copied, setCopied] = useState(false);

  if (!currentHostel) return null;

  const hostelUrl = `http://${currentHostel.subdomain || currentHostel.id}.localhost:3000/`;

  const copyToClipboard = async () => {
    if (!currentHostel) return;
    
    try {
      await navigator.clipboard.writeText(hostelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = hostelUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openHostelHomepage = () => {
    if (!currentHostel) return;
    window.open(hostelUrl, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-xs text-blue-700 font-medium">
        Share {currentHostel.name}:
      </span>
      
      <div className="flex items-center gap-2">
        <a
          href={hostelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline truncate max-w-[180px] sm:max-w-[200px]"
          title={`${currentHostel.name} - ${hostelUrl}`}
        >
          {hostelUrl}
        </a>
        
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title={`Copy ${currentHostel.name} link`}
          >
            {copied ? (
              <CheckIcon className="h-3 w-3 text-green-600" />
            ) : (
              <CopyIcon className="h-3 w-3" />
            )}
          </button>
          
          <button
            onClick={openHostelHomepage}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title={`Open ${currentHostel.name} homepage`}
          >
            <ExternalLinkIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
