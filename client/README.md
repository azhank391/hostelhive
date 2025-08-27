# Hostel Management System

A comprehensive hostel management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Management**: Comprehensive dashboard for hostel owners
- **Hostel Management**: Manage multiple hostels and their details
- **Room Management**: Track room availability and assignments
- **Student Management**: Manage student registrations and information
- **Warden Management**: Oversee warden assignments and responsibilities
- **Complaint Management**: Handle and track student complaints
- **Visitor Management**: Monitor visitor entries and exits
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   ├── register/         # Registration page
│   ├── forgot-password/  # Password reset page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── modals/           # Modal components
│   ├── sections/         # Page sections
│   └── ui/               # UI components
└── index.css             # Global styles
```

## Pages

- **Home** (`/`) - Landing page with features and pricing
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Dashboard** (`/dashboard`) - Main dashboard
- **Hostels** (`/dashboard/hostels`) - Hostel management
- **Rooms** (`/dashboard/rooms`) - Room management
- **Students** (`/dashboard/students`) - Student management
- **Wardens** (`/dashboard/wardens`) - Warden management
- **Complaints** (`/dashboard/complaints`) - Complaint management
- **Visitors** (`/dashboard/visitors`) - Visitor management

## Development

This project uses:
- **TypeScript** for type safety
- **ESLint** for code quality
- **Tailwind CSS** for styling
- **Next.js App Router** for routing

## License

This project is private and proprietary.
