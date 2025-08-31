# Biome Configuration Guide

## Overview

This project uses [Biome](https://biomejs.dev/) for code linting and formatting, replacing the previous ESLint and Prettier setup.

## Setup

Biome is configured via the `biome.json` file in the root directory. The configuration includes:

- Linting rules for TypeScript and JavaScript files
- Formatting preferences
- Import sorting settings

## Commands

Run the following commands from the frontend directory:

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Check and auto-fix issues 
pnpm run check:apply