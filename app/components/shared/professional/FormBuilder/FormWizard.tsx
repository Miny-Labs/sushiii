'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FormWizardStep } from './types';
import { FormSection } from './FormSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle,
  SkipForward
} from 'lucide-react';

interface FormWizardProps {
  steps: FormWizardStep[];
  currentStep: number;
  data: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  onFieldChange: (fieldName: string, value: any) => void;
  onFieldBlur: (fieldName: string) => void;
  onStepChange: (step: number) => void;
  disabled?: boolean;
}

export function FormWizard({
  steps,
  currentStep,
  data,
  errors,
  touched,
  dirty,
  onFieldChange,
  onFieldBlur,
  onStepChange,
  disabled = false,
}: FormWizardProps) {
  const currentStepData = steps[currentStep];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Check if current step has errors
  const currentStepFields = currentStepData?.sections.flatMap(section => section.fields) || [];
  const currentStepErrors = currentStepFields.filter(field => 
    errors[field.name] && errors[field.name].length > 0
  );

  const canProceed = currentStepErrors.length === 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = async () => {
    if (isLastStep) return;

    // Validate current step if validation function exists
    if (currentStepData.validation) {
      const isValid = await currentStepData.validation(data);
      if (!isValid) return;
    }

    onStepChange(currentStep + 1);
  };

  const handlePrevious = () => {
    if (isFirstStep) return;
    onStepChange(currentStep - 1);
  };

  const handleSkip = () => {
    if (!currentStepData.canSkip || isLastStep) return;
    onStepChange(currentStep + 1);
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-8">
      {/* Step Navigation */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium font-expanded">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground font-semi-expanded">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center space-x-2 cursor-pointer transition-colors',
                  status === 'completed' && 'text-primary',
                  status === 'current' && 'text-foreground',
                  status === 'upcoming' && 'text-muted-foreground'
                )}
                onClick={() => index <= currentStep && onStepChange(index)}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                    status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                    status === 'current' && 'border-primary text-primary',
                    status === 'upcoming' && 'border-muted-foreground text-muted-foreground'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className={cn(
                    'text-sm font-medium font-expanded',
                    status === 'upcoming' && 'text-muted-foreground'
                  )}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground font-semi-expanded">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      {currentStepData && (
        <div className="space-y-6">
          {/* Step Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {currentStepData.icon && (
                <span className="text-primary">{currentStepData.icon}</span>
              )}
              <h2 className="text-2xl font-bold font-expanded">{currentStepData.title}</h2>
              {currentStepData.optional && (
                <Badge variant="outline" className="font-semi-expanded">
                  Optional
                </Badge>
              )}
            </div>
            {currentStepData.description && (
              <p className="text-muted-foreground font-semi-expanded">
                {currentStepData.description}
              </p>
            )}
          </div>

          {/* Step Errors */}
          {currentStepErrors.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-semi-expanded">
                Please fix {currentStepErrors.length} error(s) before proceeding
              </span>
            </div>
          )}

          {/* Step Sections */}
          <div className="space-y-8">
            {currentStepData.sections.map((section) => (
              <FormSection
                key={section.id}
                section={section}
                data={data}
                errors={errors}
                touched={touched}
                dirty={dirty}
                onFieldChange={onFieldChange}
                onFieldBlur={onFieldBlur}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={disabled}
              className="font-expanded"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Skip button */}
          {currentStepData?.canSkip && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={disabled}
              className="font-expanded"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>
          )}

          {/* Next/Finish button */}
          <Button
            type={isLastStep ? 'submit' : 'button'}
            onClick={isLastStep ? undefined : handleNext}
            disabled={disabled || (!canProceed && !currentStepData?.canSkip)}
            className="font-expanded"
          >
            {isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}