'use client';

import { useState } from 'react';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';
import KarmaWizardSidebar from './KarmaWizardSidebar';

interface KarmaWizardSession {
  session_id: string;
  session_name: string;
  rel_gcon_piece_id: string;
  user_id: string;
  steps_completed: number;
  step_left_off_at: number;
  total_steps_planned: number;
  session_status: string;
  created_at: string;
  updated_at: string;
}

interface WizardStepProps {
  session: KarmaWizardSession;
  currentStep: number;
  onNavigateToStep: (stepNumber: number) => void;
  onUpdateProgress: (stepNumber: number, completed?: boolean) => void;
}

export default function WizardStep({ 
  session, 
  currentStep, 
  onNavigateToStep, 
  onUpdateProgress 
}: WizardStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const stepTitles = {
    1: 'Analyze Content',
    2: 'Generate Images', 
    3: 'Upload to WordPress',
    4: 'Update Content'
  };

  const stepDescriptions = {
    1: 'Fetch and analyze the existing content from your gcon_piece',
    2: 'Generate AI images using your configured API keys',
    3: 'Upload the generated images to your WordPress site',
    4: 'Update the content with references to the new images'
  };

  const handleStepComplete = (stepNumber: number) => {
    onUpdateProgress(stepNumber, true);
    
    // Auto-advance to next step if not the last step
    if (stepNumber < session.total_steps_planned) {
      setTimeout(() => {
        onNavigateToStep(stepNumber + 1);
      }, 1000);
    }
  };

  const renderProgressBar = () => {
    const progress = (session.steps_completed / session.total_steps_planned) * 100;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Step {session.steps_completed} of {session.total_steps_planned} completed</span>
          <span>Session: {session.session_name}</span>
        </div>
      </div>
    );
  };

  const renderStepIndicators = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {Array.from({ length: session.total_steps_planned }, (_, i) => i + 1).map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <button
              onClick={() => onNavigateToStep(stepNum)}
              disabled={isProcessing}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium text-sm
                ${stepNum === currentStep
                  ? 'bg-blue-600 text-white border-blue-600'
                  : stepNum <= session.steps_completed
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-400 border-gray-300'
                }
                ${!isProcessing && 'hover:bg-opacity-80 cursor-pointer'}
                ${isProcessing && 'cursor-not-allowed opacity-50'}
                transition-all duration-200
              `}
            >
              {stepNum <= session.steps_completed ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNum
              )}
            </button>
            {stepNum < session.total_steps_planned && (
              <div 
                className={`
                  w-12 h-0.5 mx-2
                  ${stepNum < session.steps_completed ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    const stepProps = {
      session,
      isProcessing,
      setIsProcessing,
      onStepComplete: handleStepComplete,
      onNavigateToStep
    };

    switch (currentStep) {
      case 1:
        return <Step1 {...stepProps} />;
      case 2:
        return <Step2 {...stepProps} />;
      case 3:
        return <Step3 {...stepProps} />;
      case 4:
        return <Step4 {...stepProps} />;
      case 5:
        return <Step5 {...stepProps} />;
      default:
        return (
          <div className="text-center py-8">
            <div className="text-xl text-red-600">Invalid step number: {currentStep}</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <KarmaWizardSidebar 
        currentStep={currentStep} 
        session={session}
        onNavigateToStep={onNavigateToStep}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Karma Wizard - {stepTitles[currentStep as keyof typeof stepTitles]}
                </h1>
                <p className="text-gray-600">
                  {stepDescriptions[currentStep as keyof typeof stepDescriptions]}
                </p>
              </div>

              {renderProgressBar()}
              {renderStepIndicators()}
            </div>

            {/* Main Step Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderStepContent()}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center mt-6">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={() => onNavigateToStep(currentStep - 1)}
                    disabled={isProcessing}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous Step
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Step {currentStep} of {session.total_steps_planned}
              </div>

              <div>
                {currentStep < session.total_steps_planned && (
                  <button
                    onClick={() => onNavigateToStep(currentStep + 1)}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step →
                  </button>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-500">
                Session: {session.session_name} | 
                Gcon Piece: {session.rel_gcon_piece_id} | 
                Status: <span className="capitalize">{session.session_status}</span>
              </div>
              <div className="mt-2">
                <a 
                  href="/karmajar" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Return to Karmajar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}