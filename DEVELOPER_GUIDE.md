
# Developer Guide

This guide provides instructions for setting up and running the TM30 Hotel Reporting Tool locally for development purposes.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Linting:** [Biome](https://biomejs.dev/)
- **Package Manager:** [Bun](https://bun.sh/)

## Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/)

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/tm30-reporting-tool.git
   cd tm30-reporting-tool
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root of the project and add the following variables:

   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   GCS_BUCKET_NAME="your-gcs-bucket-name"
   ```

4. **Run the development server:**

   ```bash
   bun run dev
   ```

   The application will be available at `http://localhost:3000`.

## Project Structure

```
.
├── .next
├── node_modules
├── public
│   └── locales
├── src
│   ├── app
│   │   ├── admin
│   │   ├── admin-management
│   │   └── api
│   ├── components
│   │   └── ui
│   └── lib
├── .eslintrc.json
├── .gitignore
├── biome.json
├── bun.lock
├── components.json
├── DATA_CLEANUP.md
├── EMAIL_SETUP.md
├── eslint.config.mjs
├── MIGRATION_GUIDE.md
├── netlify.toml
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── ROOM_AVAILABILITY.md
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

- **`src/app`**: Contains the main application logic, including pages and API routes.
- **`src/components`**: Contains reusable UI components.
- **`src/lib`**: Contains utility functions and database logic.
- **`public`**: Contains static assets, such as images and localization files.

## Available Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Builds the application for production.
- `bun run start`: Starts the production server.
- `bun run lint`: Lints the codebase using Biome and TypeScript.
- `bun run format`: Formats the codebase using Biome.

## Database

The application uses PostgreSQL as its database. The database connection is managed by the `pg` library. The database logic is located in `src/lib/database.ts`.

### Database Schema

- **`submissions`**: Stores information about TM30 submissions.
- **`hotels`**: Stores information about hotels.
- **`admins`**: Stores information about hotel administrators.
- **`super_admins`**: Stores information about super administrators.
- **`room_schedules`**: Stores information about room availability.
- **`accounts`**: Stores information about all user accounts.

## API Routes

The application exposes several API routes for managing data:

- **`/api/admin/cleanup`**: Cleans up old submissions.
- **`/api/admin/export`**: Exports submissions to an Excel file.
- **`/api/admin/get-secure-photo-url`**: Gets a secure URL for a photo.
- **`/api/admin/login`**: Logs in a hotel administrator.
- **`/api/admin/manage-accounts`**: Manages user accounts.
- **`/api/admin/setup-auth`**: Sets up authentication for the application.
- **`/api/cleanup-old-submissions`**: Cleans up old submissions.
- **`/api/cleanup-room-schedule`**: Cleans up the room schedule.
- **`/api/get-submissions`**: Gets a list of submissions.
- **`/api/hotels`**: Manages hotels.
- **`/api/migrate-room-schedule`**: Migrates the room schedule.
- **`/api/submissions`**: Manages submissions.
- **`/api/submit-tm30`**: Submits a TM30 form.
- **`/api/super-admin/login`**: Logs in a super administrator.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
