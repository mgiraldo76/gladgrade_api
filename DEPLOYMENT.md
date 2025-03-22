# Deploying to Google Cloud Run

This document outlines the steps to deploy the Gladgrade API to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed locally
- Access to Google Cloud project

## Build and Deploy

1. **Build the Docker image**

   ```bash
   docker build -t gladgrade-api .