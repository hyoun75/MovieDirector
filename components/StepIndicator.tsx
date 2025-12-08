
import React from 'react';
import { Step } from '../types';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: Step;
  setStep: (step: Step) => void;
  maxReachedStep: Step;
}

const steps = [
  { id: Step.LYRICS, label: '가사 입력' },
  { id: Step.STORIES, label: '스토리 생성' },
  { id: Step.CHARACTERS, label: '인물 생성' },
  { id: Step.STORYBOARD, label: '콘티 생성' },
  { id: Step.DETAILED_STORYBOARD, label: '세부 콘티 (5초)' },
  { id: Step.IMAGE_PROMPTS, label: '이미지 프롬프트' },
  { id: Step.VIDEO_PROMPTS, label: '동영상 프롬프트' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, setStep, maxReachedStep }) => {
  return (
    <div className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          MV Director AI
        </h1>
        <p className="text-slate-500 text-xs mt-1">Creative Assistant</p>
      </div>

      <nav className="flex-1 space-y-2">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = maxReachedStep > step.id;
          const isAccessible = maxReachedStep >= step.id;

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && setStep(step.id)}
              disabled={!isAccessible}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : isAccessible
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : isActive ? (
                <PlayCircle className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              {step.label}
            </button>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-500">
        <p>Powered by Gemini 2.5 Flash</p>
      </div>
    </div>
  );
};

export default StepIndicator;
