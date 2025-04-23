# Financial Records for Stocks

This project extension adds four new data models to store and manage financial record data for stocks. Each model is related to the Stock table via the `symbol` field.

## New Data Models

1. **EpsRecord**
   - Stores Earnings Per Share data for stocks.
   - Fields: symbol, reportDate, eps, epsNganh, epsRate
   - Unique constraint on [symbol, reportDate]

2. **PeRecord**
   - Stores Price-to-Earnings ratio data for stocks.
   - Fields: symbol, reportDate, pe, peNganh, peRate
   - Unique constraint on [symbol, reportDate]

3. **RoaRoeRecord**
   - Stores Return on Assets (ROA) and Return on Equity (ROE) data for stocks.
   - Fields: symbol, reportDate, roa, roe, roeNganh
   - Unique constraint on [symbol, reportDate]

4. **FinancialRatioRecord**
   - Stores debt and asset-related financial ratios for stocks.
   - Fields: symbol, reportDate, debtEquity, assetsEquity, debtEquityPct
   - Unique constraint on [symbol, reportDate]

## API Endpoints

For each of the data models above, the following REST endpoints are available:

### EPS Records (`/api/eps-records`)

- `GET /api/eps-records` - List all EPS records (with pagination and filtering)
- `GET /api/eps-records/:id` - Get a specific EPS record by ID
- `GET /api/eps-records/symbol/:symbol` - Get all EPS records for a specific stock symbol
- `POST /api/eps-records` - Create a new EPS record
- `PUT /api/eps-records/:id` - Update an existing EPS record
- `DELETE /api/eps-records/:id` - Delete an EPS record
- `POST /api/eps-records/import` - Import EPS records from CSV or Excel file

### PE Records (`/api/pe-records`)

- `GET /api/pe-records` - List all PE records (with pagination and filtering)
- `GET /api/pe-records/:id` - Get a specific PE record by ID
- `GET /api/pe-records/symbol/:symbol` - Get all PE records for a specific stock symbol
- `POST /api/pe-records` - Create a new PE record
- `PUT /api/pe-records/:id` - Update an existing PE record
- `DELETE /api/pe-records/:id` - Delete a PE record
- `POST /api/pe-records/import` - Import PE records from CSV or Excel file

### ROA/ROE Records (`/api/roa-roe-records`)

- `GET /api/roa-roe-records` - List all ROA/ROE records (with pagination and filtering)
- `GET /api/roa-roe-records/:id` - Get a specific ROA/ROE record by ID
- `GET /api/roa-roe-records/symbol/:symbol` - Get all ROA/ROE records for a specific stock symbol
- `POST /api/roa-roe-records` - Create a new ROA/ROE record
- `PUT /api/roa-roe-records/:id` - Update an existing ROA/ROE record
- `DELETE /api/roa-roe-records/:id` - Delete a ROA/ROE record
- `POST /api/roa-roe-records/import` - Import ROA/ROE records from CSV or Excel file

### Financial Ratio Records (`/api/financial-ratio-records`)

- `GET /api/financial-ratio-records` - List all Financial Ratio records (with pagination and filtering)
- `GET /api/financial-ratio-records/:id` - Get a specific Financial Ratio record by ID
- `GET /api/financial-ratio-records/symbol/:symbol` - Get all Financial Ratio records for a specific stock symbol
- `POST /api/financial-ratio-records` - Create a new Financial Ratio record
- `PUT /api/financial-ratio-records/:id` - Update an existing Financial Ratio record
- `DELETE /api/financial-ratio-records/:id` - Delete a Financial Ratio record
- `POST /api/financial-ratio-records/import` - Import Financial Ratio records from CSV or Excel file

## Data Import Support

All APIs include a CSV and Excel file import function that supports:
- Mapping fields from the file to the database model
- Validating required fields
- Updating existing records or creating new ones based on the [symbol, reportDate] unique constraint
- Handling errors for individual records without failing the entire batch
- Format validation (number parsing, date parsing)

## API Query Parameters

All list endpoints support the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Number of records per page (default: 10)
- `sortBy` - Field to sort by (default: reportDate)
- `sortOrder` - Sort order: asc or desc (default: desc)
- `symbol` - Filter by stock symbol

## Database Structure

The data models have been added to the Prisma schema and are related to the Stock model via the symbol field. The migration `add_financial_records` creates the database tables and relationships.

## Technical Notes

1. All records are linked to the Stock table through the stock symbol.
2. All float values are nullable to handle cases where data is not available.
3. Each record has a unique constraint on [symbol, reportDate] to prevent duplicates.
4. All APIs include proper error handling for common scenarios like:
   - Record not found
   - Stock symbol not found
   - Duplicate records
   - Invalid input data 