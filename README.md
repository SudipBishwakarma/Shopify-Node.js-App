# Shopify App for Bulk Import of (HS) tariff code
This app incorporates OAuth2 Module for Shopify API, Passportjs & passport-shopify strategy for API authentication, and Agendajs for scheduling background jobs.

# Setup

Run separate worker process for processing background jobs such as *sync_products* or new jobs that you create.

``$ node worker.js``

Run separate http process to run the Express app

``$ npm run start``

**Feel free to use for your own app development.**

Also any pull requests are most welcome.
