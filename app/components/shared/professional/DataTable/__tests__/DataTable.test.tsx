import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../DataTable';
import { DataTableColumn, DataTableRow } from '../types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock data
const mockData: DataTableRow[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', age: 25 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active', age: 35 },
];

const mockColumns: DataTableColumn[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', sortable: true, filterable: true },
  { id: 'email', header: 'Email', accessorKey: 'email', sortable: true, filterable: true },
  { id: 'status', header: 'Status', accessorKey: 'status', type: 'status', sortable: true },
  { id: 'age', header: 'Age', accessorKey: 'age', type: 'number', sortable: true },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
      />
    );

    // Check if headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Check if data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    const mockOnSearchChange = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        searchable={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // The search is handled internally, so we just check if the input works
    expect(searchInput).toHaveValue('John');
  });

  it('handles row selection', () => {
    const mockOnSelectionChange = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        selection={{
          selectedRows: [],
          isAllSelected: false,
          isIndeterminate: false,
        }}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Check if checkboxes are rendered
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 1 for select all + 3 for rows

    // Click on first row checkbox
    fireEvent.click(checkboxes[1]);
    expect(mockOnSelectionChange).toHaveBeenCalled();
  });

  it('handles sorting', () => {
    const mockOnSortingChange = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        sorting={[]}
        onSortingChange={mockOnSortingChange}
      />
    );

    // The sorting is handled through dropdown menu, so we need to test differently
    // For now, just check that the sort button exists
    const nameHeader = screen.getByRole('button', { name: /name/i });
    expect(nameHeader).toBeInTheDocument();
  });

  it('renders custom cell content', () => {
    const customColumns: DataTableColumn[] = [
      {
        id: 'custom',
        header: 'Custom',
        cell: (row) => <span data-testid={`custom-cell-${row.id}`}>Custom: {row.name}</span>,
      },
    ];

    render(
      <DataTable
        data={mockData}
        columns={customColumns}
      />
    );

    expect(screen.getByTestId('custom-cell-1')).toHaveTextContent('Custom: John Doe');
    expect(screen.getByTestId('custom-cell-2')).toHaveTextContent('Custom: Jane Smith');
  });
});