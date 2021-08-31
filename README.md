# Walkspan Backend API

## Requirements
- Install Node.js v12.xx.x The installer can be found at https://nodejs.org/en/

## Setup Instructions
1) Navigate to the same directory as this project in your favorite terminal
2) Run `npm install`

## How to start the server
1) Run `npm start`
2) It should be fully accessible at http://localhost:3000

## How to deploy to production
- As soon as code is merged into the `main` branch of this repo a production deploy is triggered for https://api.walkspan.com
- These deploys can be viewed [here](https://github.com/walk-span/api/actions)
- See https://www.serverless.com/ for more information on the architecture

## About the database
- Currently the database is a sqllite database
- This is because it's cheaper to use a file insteasd of a hosted database for a small read-only dataset
- Once Walkspan further expands as a business we plan on migrating this onto a hosted database such as Amazon Aurora

