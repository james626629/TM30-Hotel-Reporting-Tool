# TM-30 Compliance Automation Platform

A digital check-in solution developed during my internship at KPI Plus to automate the mandatory TM-30 immigration reporting for hotels in Thailand, reducing manual workload and ensuring legal compliance.

## Project Overview

Developed during my internship at KPI Plus, this project addresses a critical operational bottleneck for hotels in Thailand: the manual and time-consuming process of filing TM-30 immigration forms for foreign guests. Under Thai law, hotels must report the stay of foreign nationals within 24 hours or face significant fines.

This platform provides a secure digital pre-check-in workflow where guests can submit all required information, including passport details, before they arrive. The system validates this data and uses it to automatically generate the TM-30 report, ready for submission. This not only guarantees that hotels meet the strict reporting deadline but also significantly reduces the workload on front-desk and revenue teams, allowing smaller establishments to operate more efficiently with less manpower.

## Key Features

- **Digital Pre-Check-In:** A secure, user-friendly form for guests to submit their personal and passport information online before arrival.
- **Automated TM-30 Generation:** Automatically populates the required immigration forms, eliminating manual data entry and reducing human error.
- **Compliance Assurance:** Helps hotels meet the strict 24-hour reporting deadline to avoid legal penalties.
- **Reduced Workload:** Frees up front-desk and revenue staff from the tedious task of chasing guests for incomplete information.
- **Responsive Design:** A mobile-first interface ensures a seamless experience for guests checking in from any device.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI
- **Deployment:** [Vercel](https://vercel.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Install NPM packages:**
    ```
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add the necessary environment variables. You can use the `.env.example` file as a template:
    ```
    # .env.example
    NEXT_PUBLIC_API_URL=http://localhost:3000/api
    DATABASE_URL="your_database_connection_string"
    ```

4.  **Run the development server:**
    ```
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
