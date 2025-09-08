'use client';

import { useState } from 'react';

interface KarmaWizardSidebarProps {
  currentStep: number;
  session?: any;
  onNavigateToStep?: (stepNumber: number) => void;
}

export default function KarmaWizardSidebar({ currentStep, session, onNavigateToStep }: KarmaWizardSidebarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const steps = [
    { number: 1, title: 'Designate Basic Session Info', description: 'Set up your wizard session' },
    { number: 2, title: 'Fetch and Analyze Content', description: 'Retrieve and examine existing content' },
    { number: 3, title: 'Generate AI Images', description: 'Create images using AI APIs' },
    { number: 4, title: 'Upload to WordPress', description: 'Send images to your WordPress site' },
    { number: 5, title: 'Update Content References', description: 'Integrate images into your content' }
  ];

  const getStepStatus = (stepNumber: number) => {
    if (!session) {
      // No session yet - only step 1 is available
      return stepNumber === 1 ? 'available' : 'locked';
    }

    if (stepNumber < currentStep) {
      return 'completed';
    } else if (stepNumber === currentStep) {
      return 'current';
    } else if (stepNumber <= (session.steps_completed + 1)) {
      return 'available';
    } else {
      return 'locked';
    }
  };

  const handleStepClick = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    if (status === 'locked') return;
    
    if (onNavigateToStep && session) {
      onNavigateToStep(stepNumber);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Karma Wizard Steps</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => window.open('/karmawiz', '_blank')}
                className="px-2 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-xs"
                style={{ fontSize: '12px' }}
              >
                new session
              </button>
              <button
                onClick={() => window.open('/karmajar', '_blank')}
                className="px-2 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-xs"
                style={{ fontSize: '12px' }}
              >
                /karmajar
              </button>
            </div>
          </div>
          {session ? (
            <p className="text-sm text-gray-600">Session: {session.session_name}</p>
          ) : (
            <p className="text-sm text-gray-600">Create a session to begin</p>
          )}
        </div>

        {/* Session ID Fields */}
        {session && (
          <div className="mb-6 space-y-4">
            {/* Session ID Section */}
            <div className="border border-black rounded overflow-hidden">
              <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                <span style={{ fontSize: '12px', color: '#394990' }}>
                  fk data badge
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-gray-700">
                    Session ID
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={session.session_id || ''}
                      readOnly
                      className="w-10 px-1 py-1 text-xs border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 font-mono"
                      title={session.session_id || ''}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(session.session_id || '');
                        } catch (err) {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = session.session_id || '';
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        }
                      }}
                      className="w-3.5 h-6 bg-gray-500 text-white rounded-r-md hover:bg-gray-600 flex items-center justify-center text-xs"
                      title="Copy Session ID"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sitespren Section */}
            <div className="border border-black rounded overflow-hidden">
              <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                <span style={{ fontSize: '12px', color: '#394990' }}>
                  fk data badge
                </span>
              </div>
              <div className="p-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  janky_rel_sitespren_id
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={session.janky_rel_sitespren_id || ''}
                    readOnly
                    className="w-12 px-2 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono"
                    placeholder="ID"
                  />
                  <input
                    type="text"
                    value={session.sitespren_base || ''}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="Sitespren base URL"
                  />
                </div>
              </div>
            </div>
            
            {/* Gcon Pieces Section */}
            <div className="border border-black rounded overflow-hidden">
              <div className="w-full h-3.5 bg-blue-200 flex items-center px-2">
                <span style={{ fontSize: '12px', color: '#394990' }}>
                  fk data badge
                </span>
              </div>
              <div className="p-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  rel_gcon_piece_id
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={session.rel_gcon_piece_id || ''}
                    readOnly
                    className="w-12 px-2 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono"
                    placeholder="ID"
                  />
                  <input
                    type="text"
                    value={session.gcon_post_name || ''}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="Post name"
                  />
                </div>
                <input
                  type="text"
                  value={session.gcon_meta_title || ''}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="Meta title"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const isClickable = status !== 'locked' && session;

            return (
              <div
                key={step.number}
                className={`relative flex items-start p-4 rounded-lg border transition-all duration-200 ${
                  status === 'current'
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : status === 'available'
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleStepClick(step.number)}
              >
                {/* Step Number/Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${
                  status === 'current'
                    ? 'bg-blue-500 text-white'
                    : status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'available'
                    ? 'bg-gray-300 text-gray-700'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {status === 'completed' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {step.number === 1 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTooltip(!showTooltip);
                          }}
                          className="w-4 h-4 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-gray-600"
                        >
                          ?
                        </button>
                        {showTooltip && (
                          <div className="absolute left-0 top-6 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
                            <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
{`Karma Wizard - Step 1
Enhance your content with AI-generated images and automated WordPress integration

How it works: Enter the ID of a content piece (gcon_pieces) that you want to enhance with images. The wizard will guide you through fetching page info, generating images, and updating your WordPress site.`}
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const text = `Karma Wizard - Step 1
Enhance your content with AI-generated images and automated WordPress integration

How it works: Enter the ID of a content piece (gcon_pieces) that you want to enhance with images. The wizard will guide you through fetching page info, generating images, and updating your WordPress site.`;
                                try {
                                  await navigator.clipboard.writeText(text);
                                } catch (err) {
                                  const textArea = document.createElement('textarea');
                                  textArea.value = text;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                }
                              }}
                              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Copy to Clipboard
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <h4 className={`text-sm font-medium mb-1 ${
                      status === 'current'
                        ? 'text-blue-900'
                        : status === 'completed'
                        ? 'text-green-900'
                        : status === 'available'
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                  </div>
                  <p className={`text-xs ${
                    status === 'current'
                      ? 'text-blue-700'
                      : status === 'completed'
                      ? 'text-green-700'
                      : status === 'available'
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>

                  {/* Status Indicator */}
                  <div className="mt-2">
                    {status === 'current' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Current Step
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                    {status === 'locked' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-10 top-16 w-0.5 h-4 ${
                    status === 'completed' || (status === 'current' && step.number < steps.length)
                      ? 'bg-green-300'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Session Progress */}
        {session && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Progress</h4>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(session.steps_completed / session.total_steps_planned) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {session.steps_completed} of {session.total_steps_planned} steps completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}