# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EN0VA is a Next.js 15 web application with Web3/blockchain integration, built using the v0.dev platform. It features a terminal/cyberpunk aesthetic and includes a dashboard ("backroom") with multiple sections for attestations, governance, hyperstition markets, ICO functionality, and more.

## Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build the application 
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

## Architecture

### Framework Stack
- **Next.js 15** with React 19 and TypeScript
- **App Router** architecture (not pages router)
- **Tailwind CSS v4** for styling
- **Web3 Integration**: wagmi v2 + viem for Ethereum interaction
- **UI Components**: Extensive use of Radix UI primitives
- **State Management**: @tanstack/react-query for server state

### Key Structure
- `app/` - Next.js app router pages and layouts
  - `backroom/` - Main dashboard area with protected sections
- `components/` - Reusable UI components and providers
- `lib/` - Utilities including wagmi configuration
- Global styling uses monospace fonts (Roboto Mono) with terminal theme

### Web3 Configuration
- Configured for Ethereum mainnet and Sepolia testnet
- Uses injected and MetaMask connectors via wagmi
- Wallet connection state managed in backroom layout

### Styling Approach
- Terminal/cyberpunk aesthetic with custom CSS classes
- Responsive design with mobile-first approach
- Uses backdrop blur effects and dark theme throughout

## Important Notes

- ESLint and TypeScript errors are ignored during builds (see next.config.mjs)
- Images are unoptimized in Next.js config
- Project auto-syncs with v0.dev deployments
- Uses absolute imports with `@/*` path mapping