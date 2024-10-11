# CryptoSync

## Project Overview

CryptoSync is an automated, decentralized platform built on the TRON blockchain, designed for portfolio rebalancing. By integrating with Sunswap Dex, CryptoSync helps retail crypto investors manage their portfolios efficiently, minimize emotional decision-making, and automate rebalancing based on predefined strategies.

## Features
- **Automated Rebalancing:** Automatically adjusts portfolio allocations based on user-defined thresholds.
- **Take-Profit & Stop-Loss:** Enables users to set and manage risk management parameters.
- **Customizable Settings:** Modify allocation targets, rebalancing thresholds, and risk management preferences at any time.
- **Emergency Withdraw:** Withdraw all assets instantly in case of market volatility or other unforeseen circumstances.
- **Secure & Decentralized:** Users retain full control over their funds, with no external access by third parties.

## Setup Instructions

To set up the CryptoSync project locally, follow the steps below:

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd cryptosync-frontend
   ```

2. **Install Dependencies:**
   Run the following command to install all necessary dependencies:
   ```bash
   yarn
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the `cryptosync-frontend` folder and add the following environment variables:
   ```bash
   NEXT_PUBLIC_MONGODB_URI="MONGODB_URL"    # MongoDB URL for local storage
   NEXT_PUBLIC_PRIVATE_KEY="PRIVATE_KEY"    # Private key for calling getter functions
   ```

   - **MONGODB_URL:** The MongoDB URI where your data will be stored locally.
   - **PRIVATE_KEY:** The private key required for calling getter functions.

4. **Start the Development Server:**
   After setting up the environment variables, start the project by running:
   ```bash
   yarn dev
   ```

   This will launch the app in development mode, accessible at `http://localhost:3000`.

## Usage Instructions

1. **Connect your wallet** and visit the site: [CryptoSync](https://crypto-sync-seven.vercel.app/)
2. **Create Your Pool**: Click on the "Create Your Pool" button and set up your asset allocations, rebalancing thresholds, and risk management parameters.
3. **Approve Tokens**: Approve the tokens and deploy your pool via your wallet.
4. **Monitor and Adjust**: Manage your pool through the dashboard, track performance, and adjust parameters as needed.

## Demo and Resources

- **Live Demo**: [Watch Demo](https://youtu.be/zok9NclVzLU)

