'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FormBuilderProps, FormState, FormFieldConfig, FormValidationRule } from './types';
import { FormField } from './FormField';
import { FormSection } from './FormSection';
import { FormWizard } from './FormWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Save, 
  RotateCcw, 
  Undo, 
  Redo, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

export function FormBuilder({
  fields = [],
  sections = [],
  wizard = [],
  initialData = {},
  onSubmit,
  onChange,
  onValidation,
  loading = false,
  disabled = false,
  autoSave = false,
  autoSaveInterval = 5000,
  onAutoSave,
  validateOnChange = true,
  validateOnBlur = true,
  showProgress = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  resetText = 'Reset',
  onCancel,
  onReset,
  className,
  layout = 'vertical',
  spacing = 'normal',
  theme = 'professional',
  contextualHelp = true,
  keyboardShortcuts = true,
  undoRedo = true,
  maxUndoSteps = 50,
}: FormBuilderProps) {
  const [formState, setFormState] = useState<FormState>({
    data: { ...initialData },
    errors: {},
    touched: {},
    dirty: {},
    isValid: true,
    isSubmitting: false,
    isAutoSaving: false,
    undoStack: [],
    redoStack: [],
    currentStep: 0,
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const formRef = useRef<HTMLFormElement>(null);

  // Get all fields from sections or direct fields
  const allFields = useMemo(() => {
    if (wizard.length > 0) {
      return wizard.flatMap(step => 
        step.sections.flatMap(section => section.fields)
      );
    }
    if (sections.length > 0) {
      return sections.flatMap(section => section.fields);
    }
    return fields;
  }, [fields, sections, wizard]);

  // Validation function
  const validateField = useCallback(async (field: FormFieldConfig, value: any, allData: Record<string, any>): Promise<string[]> => {
    const errors: string[] = [];

    if (!field.validation) return errors;

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
            errors.push(rule.message);
          }
          break;
        case 'min':
          if (typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'number' && value < rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'max':
          if (typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message);
          } else if (typeof value === 'number' && value > rule.value) {
            errors.push(rule.message);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            errors.push(rule.message);
          }
          break;
        case 'email':
          if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message);
          }
          break;
        case 'url':
          if (typeof value === 'string') {
            try {
              new URL(value);
            } catch {
              errors.push(rule.message);
            }
          }
          break;
        case 'custom':
          if (rule.validator) {
            const isValid = await rule.validator(value, allData);
            if (!isValid) {
              errors.push(rule.message);
            }
          }
          break;
      }
    }

    return errors;
  }, []);

  // Validate all fields
  const validateForm = useCallback(async (data: Record<string, any>): Promise<Record<string, string[]>> => {
    const errors: Record<string, string[]> = {};

    for (const field of allFields) {
      const fieldErrors = await validateField(field, data[field.name], data);
      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors;
      }
    }

    return errors;
  }, [allFields, validateField]);

  // Handle field change
  const handleFieldChange = useCallback(async (fieldName: string, value: any) => {
    const newData = { ...formState.data, [fieldName]: value };
    const field = allFields.find(f => f.name === fieldName);

    // Add to undo stack
    const newUndoStack = undoRedo ? [...formState.undoStack, formState.data].slice(-maxUndoSteps) : [];

    let newErrors = { ...formState.errors };
    if (validateOnChange && field) {
      const fieldErrors = await validateField(field, value, newData);
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
      } else {
        delete newErrors[fieldName];
      }
    }

    const newFormState = {
      ...formState,
      data: newData,
      errors: newErrors,
      dirty: { ...formState.dirty, [fieldName]: true },
      isValid: Object.keys(newErrors).length === 0,
      undoStack: newUndoStack,
      redoStack: [], // Clear redo stack on new change
    };

    setFormState(newFormState);
    onChange?.(newData, fieldName);
    onValidation?.(newErrors);

    // Auto-save
    if (autoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(async () => {
        setFormState(prev => ({ ...prev, isAutoSaving: true }));
        try {
          await onAutoSave(newData);
        } finally {
          setFormState(prev => ({ ...prev, isAutoSaving: false }));
        }
      }, autoSaveInterval);
    }
  }, [formState, allFields, validateOnChange, validateField, onChange, onValidation, autoSave, onAutoSave, autoSaveInterval, undoRedo, maxUndoSteps]);

  // Handle field blur
  const handleFieldBlur = useCallback(async (fieldName: string) => {
    if (!validateOnBlur) return;

    const field = allFields.find(f => f.name === fieldName);
    if (!field) return;

    const fieldErrors = await validateField(field, formState.data[fieldName], formState.data);
    const newErrors = { ...formState.errors };
    
    if (fieldErrors.length > 0) {
      newErrors[fieldName] = fieldErrors;
    } else {
      delete newErrors[fieldName];
    }

    setFormState(prev => ({
      ...prev,
      errors: newErrors,
      touched: { ...prev.touched, [fieldName]: true },
      isValid: Object.keys(newErrors).length === 0,
    }));

    onValidation?.(newErrors);
  }, [validateOnBlur, allFields, validateField, formState.data, formState.errors, onValidation]);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || formState.isSubmitting) return;

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const errors = await validateForm(formState.data);
      
      if (Object.keys(errors).length > 0) {
        setFormState(prev => ({
          ...prev,
          errors,
          isValid: false,
          isSubmitting: false,
        }));
        onValidation?.(errors);
        return;
      }

      await onSubmit(formState.data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [onSubmit, formState.data, formState.isSubmitting, validateForm, onValidation]);

  // Handle reset
  const handleReset = useCallback(() => {
    setFormState({
      data: { ...initialData },
      errors: {},
      touched: {},
      dirty: {},
      isValid: true,
      isSubmitting: false,
      isAutoSaving: false,
      undoStack: [],
      redoStack: [],
      currentStep: 0,
    });
    onReset?.();
  }, [initialData, onReset]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (formState.undoStack.length === 0) return;

    const previousData = formState.undoStack[formState.undoStack.length - 1];
    const newUndoStack = formState.undoStack.slice(0, -1);
    const newRedoStack = [...formState.redoStack, formState.data];

    setFormState(prev => ({
      ...prev,
      data: previousData,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    }));

    onChange?.(previousData);
  }, [formState.undoStack, formState.redoStack, formState.data, onChange]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (formState.redoStack.length === 0) return;

    const nextData = formState.redoStack[formState.redoStack.length - 1];
    const newRedoStack = formState.redoStack.slice(0, -1);
    const newUndoStack = [...formState.undoStack, formState.data];

    setFormState(prev => ({
      ...prev,
      data: nextData,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    }));

    onChange?.(nextData);
  }, [formState.redoStack, formState.undoStack, formState.data, onChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (autoSave && onAutoSave) {
              onAutoSave(formState.data);
            }
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              handleRedo();
            } else {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, autoSave, onAutoSave, formState.data, handleUndo, handleRedo, handleSubmit]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!showProgress) return 0;
    const totalFields = allFields.length;
    const filledFields = allFields.filter(field => {
      const value = formState.data[field.name];
      return value !== undefined && value !== null && value !== '';
    }).length;
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  }, [showProgress, allFields, formState.data]);

  // Render form content
  const renderFormContent = () => {
    if (wizard.length > 0) {
      return (
        <FormWizard
          steps={wizard}
          currentStep={formState.currentStep || 0}
          data={formState.data}
          errors={formState.errors}
          touched={formState.touched}
          dirty={formState.dirty}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          onStepChange={(step) => setFormState(prev => ({ ...prev, currentStep: step }))}
          disabled={disabled}
        />
      );
    }

    if (sections.length > 0) {
      return (
        <div className="space-y-8">
          {sections.map((section) => (
            <FormSection
              key={section.id}
              section={section}
              data={formState.data}
              errors={formState.errors}
              touched={formState.touched}
              dirty={formState.dirty}
              onFieldChange={handleFieldChange}
              onFieldBlur={handleFieldBlur}
              disabled={disabled}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={cn(
        'space-y-6',
        layout === 'horizontal' && 'grid grid-cols-2 gap-6 space-y-0',
        layout === 'inline' && 'flex flex-wrap gap-4 space-y-0'
      )}>
        {fields.map((field) => (
          <FormField
            key={field.id}
            config={field}
            value={formState.data[field.name]}
            error={formState.errors[field.name]}
            touched={formState.touched[field.name]}
            dirty={formState.dirty[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            onBlur={() => handleFieldBlur(field.name)}
            onFocus={() => {}}
            disabled={disabled}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium font-expanded">Progress</span>
            <span className="text-sm text-muted-foreground font-semi-expanded">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Auto-save indicator */}
      {formState.isAutoSaving && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Auto-saving...</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {renderFormContent()}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            {undoRedo && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={formState.undoStack.length === 0}
                  className="font-expanded"
                >
                  <Undo className="mr-2 h-4 w-4" />
                  Undo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={formState.redoStack.length === 0}
                  className="font-expanded"
                >
                  <Redo className="mr-2 h-4 w-4" />
                  Redo
                </Button>
              </>
            )}

            {/* Reset */}
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || formState.isSubmitting}
              className="font-expanded"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {resetText}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status indicators */}
            {Object.keys(formState.dirty).length > 0 && (
              <Badge variant="outline" className="font-semi-expanded">
                Unsaved changes
              </Badge>
            )}

            {!formState.isValid && (
              <Badge variant="destructive" className="font-semi-expanded">
                {Object.keys(formState.errors).length} error(s)
              </Badge>
            )}

            {/* Cancel */}
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading || formState.isSubmitting}
                className="font-expanded"
              >
                {cancelText}
              </Button>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || formState.isSubmitting || !formState.isValid}
              className="font-expanded"
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {submitText}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Keyboard shortcuts help */}
      {keyboardShortcuts && contextualHelp && (
        <div className="text-xs text-muted-foreground font-mono space-y-1">
          <p>Keyboard shortcuts: Ctrl+S (save), Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Shift+Enter (submit)</p>
        </div>
      )}
    </div>
  );
}