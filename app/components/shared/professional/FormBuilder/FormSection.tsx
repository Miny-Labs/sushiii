'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FormSectionConfig } from './types';
import { FormField } from './FormField';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FormSectionProps {
  section: FormSectionConfig;
  data: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  onFieldChange: (fieldName: string, value: any) => void;
  onFieldBlur: (fieldName: string) => void;
  disabled?: boolean;
}

export function FormSection({
  section,
  data,
  errors,
  touched,
  dirty,
  onFieldChange,
  onFieldBlur,
  disabled = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.collapsed || false);

  // Check conditional logic
  const shouldShow = React.useMemo(() => {
    if (!section.conditionalLogic) return true;

    const { field, operator, value, action } = section.conditionalLogic;
    const fieldValue = data[field];

    let conditionMet = false;
    switch (operator) {
      case 'equals':
        conditionMet = fieldValue === value;
        break;
      case 'not_equals':
        conditionMet = fieldValue !== value;
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(String(value));
        break;
      case 'not_contains':
        conditionMet = !String(fieldValue).includes(String(value));
        break;
      case 'greater_than':
        conditionMet = Number(fieldValue) > Number(value);
        break;
      case 'less_than':
        conditionMet = Number(fieldValue) < Number(value);
        break;
    }

    return action === 'show' ? conditionMet : !conditionMet;
  }, [section.conditionalLogic, data]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={cn('space-y-6', section.className)}>
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {section.collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          <h3 className="text-lg font-semibold font-expanded">{section.title}</h3>
        </div>
        {section.description && (
          <p className="text-sm text-muted-foreground font-semi-expanded">
            {section.description}
          </p>
        )}
      </div>

      {/* Section Fields */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {section.fields.map((field) => {
            // Check field conditional logic
            const shouldShowField = React.useMemo(() => {
              if (!field.conditionalLogic) return true;

              const { field: condField, operator, value, action } = field.conditionalLogic;
              const fieldValue = data[condField];

              let conditionMet = false;
              switch (operator) {
                case 'equals':
                  conditionMet = fieldValue === value;
                  break;
                case 'not_equals':
                  conditionMet = fieldValue !== value;
                  break;
                case 'contains':
                  conditionMet = String(fieldValue).includes(String(value));
                  break;
                case 'not_contains':
                  conditionMet = !String(fieldValue).includes(String(value));
                  break;
                case 'greater_than':
                  conditionMet = Number(fieldValue) > Number(value);
                  break;
                case 'less_than':
                  conditionMet = Number(fieldValue) < Number(value);
                  break;
              }

              return action === 'show' ? conditionMet : !conditionMet;
            }, [field.conditionalLogic, data]);

            if (!shouldShowField) {
              return null;
            }

            return (
              <div
                key={field.id}
                className={cn(
                  field.width === 'full' && 'md:col-span-2',
                  field.width === 'half' && 'md:col-span-1',
                  field.width === 'third' && 'md:col-span-1',
                  field.width === 'quarter' && 'md:col-span-1'
                )}
              >
                <FormField
                  config={field}
                  value={data[field.name]}
                  error={errors[field.name]}
                  touched={touched[field.name]}
                  dirty={dirty[field.name]}
                  onChange={(value) => onFieldChange(field.name, value)}
                  onBlur={() => onFieldBlur(field.name)}
                  onFocus={() => {}}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}