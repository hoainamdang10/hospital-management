# Data Display Components

This directory contains reusable components for displaying data in tables and other formats.

## Components

### DataTable

A flexible, reusable table component with built-in pagination, loading states, and action buttons.

#### Features
- Responsive design with column hiding
- Built-in loading and empty states
- Pagination support
- Row actions (edit, delete, etc.)
- Custom cell rendering
- Row click handling
- Customizable styling

#### Basic Usage

```tsx
import { DataTable, Column } from '@/components/data-display/DataTable';

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Name',
    accessor: 'full_name',
  },
  {
    key: 'email',
    header: 'Email',
    accessor: 'email',
    className: 'text-sm text-gray-500',
  },
];

const actions = [
  {
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: (user) => handleEdit(user),
  },
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  isLoading={isLoading}
  pagination={{
    currentPage: 1,
    totalPages: 10,
    itemsPerPage: 10,
    totalItems: 100,
    onPageChange: handlePageChange,
  }}
/>
```

### SearchableDataTable

A DataTable with built-in search functionality and header actions.

#### Features
- All DataTable features
- Built-in search bar
- Automatic filtering
- Add button
- Custom header actions

#### Usage

```tsx
import { SearchableDataTable } from '@/components/data-display/SearchableDataTable';

<SearchableDataTable
  data={doctors}
  columns={columns}
  title="Doctors"
  description="Manage hospital doctors"
  searchPlaceholder="Search doctors..."
  searchFields={['full_name', 'specialty', 'email']}
  onAdd={() => setShowAddDialog(true)}
  addButtonLabel="Add Doctor"
  pagination={{
    itemsPerPage: 10,
    onPageChange: handlePageChange,
  }}
/>
```

### TableSkeleton

A loading skeleton for tables.

#### Usage

```tsx
import { TableSkeleton } from '@/components/data-display/TableSkeleton';

<TableSkeleton rows={5} columns={6} />
```

### LoadingSpinner

Various loading states and spinners.

#### Components
- `LoadingSpinner`: Basic spinner
- `LoadingState`: Spinner with message
- `ErrorState`: Error display with retry
- `EmptyState`: Empty data display

#### Usage

```tsx
import { LoadingSpinner, LoadingState, ErrorState, EmptyState } from '@/components/common/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="lg" />

// Loading state with message
<LoadingState message="Loading doctors..." />

// Error state with retry
<ErrorState 
  message="Failed to load data" 
  onRetry={() => refetch()} 
/>

// Empty state
<EmptyState 
  title="No doctors found"
  description="Add your first doctor to get started"
  action={<Button onClick={handleAdd}>Add Doctor</Button>}
/>
```

## Column Configuration

### Column Properties

- `key`: Unique identifier for the column
- `header`: Display text for column header
- `accessor`: Field name or function to get cell value
- `className`: CSS classes for cell content
- `headerClassName`: CSS classes for header cell
- `responsive`: Hide column on smaller screens ('sm', 'md', 'lg', 'xl')
- `hidden`: Hide column completely
- `sortable`: Enable sorting (future feature)

### Custom Cell Rendering

```tsx
const columns: Column<Doctor>[] = [
  {
    key: 'doctor',
    header: 'Doctor',
    accessor: (doctor) => (
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src={doctor.photo_url} />
          <AvatarFallback>{doctor.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-sm font-medium">{doctor.full_name}</div>
      </div>
    ),
  },
];
```

## Action Configuration

### Action Properties

- `label`: Button text (optional if icon provided)
- `icon`: React icon component
- `onClick`: Function called when action is clicked
- `variant`: Button variant ('ghost', 'outline', etc.)
- `size`: Button size ('sm', 'md', 'lg')
- `disabled`: Function to determine if action is disabled
- `hidden`: Function to determine if action is hidden
- `className`: Additional CSS classes

## Pagination

The pagination object supports:

- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `itemsPerPage`: Items per page
- `totalItems`: Total number of items
- `onPageChange`: Function called when page changes
- `showInfo`: Show pagination info text (default: true)
- `showControls`: Show prev/next buttons (default: true)

## Styling

All components use Tailwind CSS and can be customized with:

- `className`: Additional CSS classes for the container
- `tableClassName`: CSS classes for the table element
- `headerClassName`: CSS classes for the table header
- `rowClassName`: CSS classes for table rows (can be function)

## Examples

See the `examples` directory for complete implementation examples:

- `DoctorsDataTableExample.tsx`: Complete doctor management table
