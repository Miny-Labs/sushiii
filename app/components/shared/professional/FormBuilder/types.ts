import { ReactNode } from 'react';

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url'
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'datetime'
  | 'file' 
  | 'rich-text'
  | 'json'
  | 'code'
  | 'custom';

export interface FormValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData: any) => boolean | Promise<boolean>;
}

export interface FormFieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  helpText?: ReactNode;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  validation?: FormValidationRule[];
  options?: FormFieldOption[];
  multiple?: boolean;
  accept?: string; // for file inputs
  rows?: number; // for textarea
  cols?: number; // for textarea
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  className?: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  conditionalLogic?: ConditionalLogic;
  autoSave?: boolean;
  debounceMs?: number;
  suggestions?: string[] | ((query: string) => Promise<string[]>);
  customComponent?: React.ComponentType<any>;
  customProps?: Record<string, any>;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  fields: FormFieldConfig[];
  className?: string;
  conditionalLogic?: ConditionalLogic;
}

export interface FormWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  sections: FormSectionConfig[];
  validation?: (data: any) => Promise<boolean>;
  canSkip?: boolean;
  optional?: boolean;
}

export interface FormBuilderProps {
  fields?: FormFieldConfig[];
  sections?: FormSectionConfig[];
  wizard?: FormWizardStep[];
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  onChange?: (data: Record<string, any>, field?: string) => void;
  onValidation?: (errors: Record<string, string[]>) => void;
  loading?: boolean;
  disabled?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (data: Record<string, any>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showProgress?: boolean;
  submitText?: string;
  cancelText?: string;
  resetText?: string;
  onCancel?: () => void;
  onReset?: () => void;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'inline';
  spacing?: 'compact' | 'normal' | 'relaxed';
  theme?: 'default' | 'minimal' | 'professional';
  contextualHelp?: boolean;
  keyboardShortcuts?: boolean;
  undoRedo?: boolean;
  maxUndoSteps?: number;
}

export interface FormState {
  data: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isAutoSaving: boolean;
  undoStack: Record<string, any>[];
  redoStack: Record<string, any>[];
  currentStep?: number;
}

export interface FormFieldProps {
  config: FormFieldConfig;
  value: any;
  error?: string[];
  touched?: boolean;
  dirty?: boolean;
  onChange: (value: any) => void;
  onBlur: () => void;
  onFocus: () => void;
  disabled?: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}