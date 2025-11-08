import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormBuilder } from '../FormBuilder';
import { FormFieldConfig } from '../types';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFields: FormFieldConfig[] = [
  {
    id: 'firstName',
    name: 'firstName',
    label: 'First Name',
    type: 'text',
    required: true,
    validation: [
      { type: 'required', message: 'First name is required' }
    ]
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    validation: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email' }
    ]
  }
];

describe('FormBuilder', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with fields', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    // Check if form elements are rendered
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        loading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('handles disabled state', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        disabled={true}
      />
    );

    // Form should be disabled - check if first input is disabled
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs[0]).toBeDisabled();
  });

  it('shows progress when enabled', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        showProgress={true}
      />
    );

    // Look for progress indicator
    expect(screen.getByText(/progress/i)).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        initialData={{ firstName: 'John', email: 'john@example.com' }}
      />
    );

    // Check if initial data is rendered
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('handles auto-save when enabled', () => {
    const mockOnAutoSave = jest.fn();
    
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        autoSave={true}
        onAutoSave={mockOnAutoSave}
      />
    );

    // Form should render with auto-save enabled
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('renders keyboard shortcuts when enabled', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        keyboardShortcuts={true}
      />
    );

    // Look for keyboard shortcuts text
    expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
  });
});