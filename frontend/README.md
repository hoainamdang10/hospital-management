# Hospital Management System

A hospital management system built with React, TypeScript, and Tailwind CSS. This project helps manage patient records, appointments, and hospital operations.

## Features

- Patient management and medical records
- Doctor scheduling and availability
- Appointment booking system
- Billing and payment processing
- Staff management
- Reports and analytics
- Responsive design for mobile and desktop
- Dark/light theme support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd hospital-management-system
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start development server

   ```bash
   npm run dev
   ```

4. Open your browser and go to `http://localhost:5173`

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

## Project Structure

```
src/
├── components/        # UI components
│   ├── auth/         # Login/authentication
│   ├── billing/      # Payment components
│   ├── doctor/       # Doctor management
│   ├── patient/      # Patient management
│   ├── layout/       # Layout components
│   └── ui/           # Base UI components
├── app/              # App pages
└── utils/            # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Original Design

Based on the Figma design: https://www.figma.com/design/Ydz6JIJk4Ny6bkctzxbJP3/Hospital-Management-System

## License

MIT License
