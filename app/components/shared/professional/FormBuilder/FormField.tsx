'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FormFieldProps, FormFieldType } from './types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Upload, 
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FormField({
  config,
  value,
  error,
  touched,
  dirty,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  readonly = false,
  autoFocus = false,
  suggestions = [],
  onSuggestionSelect,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const hasError = error && error.length > 0;
  const isRequired = config.required;

  const handleChange = useCallback((newValue: any) => {
    onChange(newValue);
  }, [onChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    if (config.multiple) {
      handleChange(files);
    } else {
      handleChange(files[0] || null);
    }
  }, [handleChange, config.multiple]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleChange(suggestion);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
  }, [handleChange, onSuggestionSelect]);

  const renderField = useMemo(() => {
    const baseProps = {
      id: config.id,
      name: config.name,
      disabled: disabled || config.disabled,
      readOnly: readonly || config.readonly,
      autoFocus: autoFocus || config.autoFocus,
      onFocus,
      onBlur,
      className: cn(
        'minimal-input font-semi-expanded',
        hasError && 'border-destructive focus:ring-destructive',
        config.className
      ),
    };

    switch (config.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <div className="relative">
            <Input
              {...baseProps}
              type={config.type}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={config.placeholder}
              autoComplete={config.autoComplete}
              pattern={config.pattern}
              min={config.min}
              max={config.max}
            />
            {suggestions.length > 0 && showSuggestions && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm font-semi-expanded"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              {...baseProps}
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={config.placeholder}
              autoComplete={config.autoComplete}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.valueAsNumber || e.target.value)}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            rows={config.rows || 4}
            className={cn(baseProps.className, 'resize-y')}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={handleChange}
            disabled={baseProps.disabled}
          >
            <SelectTrigger className={baseProps.className}>
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <div className="flex items-center space-x-2">
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((val: any) => {
                const option = config.options?.find(opt => opt.value === val);
                return option ? (
                  <Badge key={val} variant="secondary" className="gap-1">
                    {option.label}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const newValues = selectedValues.filter((v: any) => v !== val);
                        handleChange(newValues);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ) : null;
              })}
            </div>
            <Select
              value=""
              onValueChange={(newValue) => {
                if (!selectedValues.includes(newValue)) {
                  handleChange([...selectedValues, newValue]);
                }
              }}
              disabled={baseProps.disabled}
            >
              <SelectTrigger className={baseProps.className}>
                <SelectValue placeholder={config.placeholder || 'Select options...'} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled || selectedValues.includes(option.value)}
                  >
                    <div className="flex items-center space-x-2">
                      {option.icon && <span>{option.icon}</span>}
                      <span>{option.label}</span>
                      {selectedValues.includes(option.value) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={config.id}
              checked={!!value}
              onCheckedChange={handleChange}
              disabled={baseProps.disabled}
            />
            <label
              htmlFor={config.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-semi-expanded"
            >
              {config.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {config.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${config.id}-${option.value}`}
                  name={config.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={baseProps.disabled || option.disabled}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label
                  htmlFor={`${config.id}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-semi-expanded"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'date':
        return (
          <Input
            {...baseProps}
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            min={config.min}
            max={config.max}
          />
        );

      case 'datetime':
        return (
          <Input
            {...baseProps}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            min={config.min}
            max={config.max}
          />
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor={config.id}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors',
                  hasError && 'border-destructive',
                  baseProps.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground font-semi-expanded">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  {config.accept && (
                    <p className="text-xs text-muted-foreground">
                      {config.accept.split(',').join(', ')}
                    </p>
                  )}
                </div>
                <input
                  {...baseProps}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept={config.accept}
                  multiple={config.multiple}
                />
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                    <span className="text-sm font-semi-expanded">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index);
                        setSelectedFiles(newFiles);
                        handleChange(config.multiple ? newFiles : null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'custom':
        if (config.customComponent) {
          const CustomComponent = config.customComponent;
          return (
            <CustomComponent
              {...baseProps}
              {...config.customProps}
              value={value}
              onChange={handleChange}
              error={hasError}
            />
          );
        }
        return null;

      default:
        return (
          <Input
            {...baseProps}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
          />
        );
    }
  }, [config, value, disabled, readonly, autoFocus, onFocus, onBlur, hasError, showPassword, suggestions, showSuggestions, selectedFiles, handleChange, handleFileChange, handleSuggestionClick]);

  if (config.hidden) {
    return null;
  }

  return (
    <div className={cn(
      'space-y-2',
      config.width === 'half' && 'w-1/2',
      config.width === 'third' && 'w-1/3',
      config.width === 'quarter' && 'w-1/4',
      config.className
    )}>
      {/* Label */}
      {config.type !== 'checkbox' && (
        <div className="flex items-center space-x-2">
          <label
            htmlFor={config.id}
            className={cn(
              'text-sm font-medium font-expanded',
              hasError && 'text-destructive',
              (disabled || config.disabled) && 'opacity-50'
            )}
          >
            {config.label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          
          {config.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">{config.helpText}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {dirty && (
            <Badge variant="outline" className="text-xs">
              Modified
            </Badge>
          )}
        </div>
      )}

      {/* Field */}
      <div className="relative">
        {renderField}
      </div>

      {/* Description */}
      {config.description && (
        <p className="text-xs text-muted-foreground font-semi-expanded">
          {config.description}
        </p>
      )}

      {/* Error */}
      {hasError && (
        <div className="flex items-center space-x-1 text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs font-semi-expanded">{error[0]}</span>
        </div>
      )}
    </div>
  );
}