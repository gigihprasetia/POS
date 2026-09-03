# REST API Contract (Hypothetical)

This document outlines the hypothetical REST API contract if the application were converted from an offline-first IndexedDB architecture to a standard client-server REST architecture.

It maps the existing local database mutations (from `src/lib/db.ts`) into RESTful endpoints, including the hidden business logic and side effects that currently run on the client.

---

## 1. Authentication & Users

### `POST /api/auth/login`

- **Request:** `{ username: string, pin: string, deviceId: string }`
- **Response:** `{ token: string, user: User }`
- **Note:** PIN is hashed using SHA-256 with `deviceId` on the client. Server should verify the hash.

### `GET /api/users`

### `POST /api/users`

### `PUT /api/users/:id`

### `PUT /api/users/:id/pin`

### `DELETE /api/users/:id` (Hard Delete)

---

## 2. Master Data

All master data endpoints implement **Soft Delete** (`isDeleted = 1`) unless specified otherwise, because standard IndexedDB cannot index booleans effectively.

### Products

- **`GET /api/products`**
- **`POST /api/products`**
- **`PUT /api/products/:id`**
- **`DELETE /api/products/:id`**
- **`POST /api/products/import`** (Bulk Excel Import)
  - **Request:** `Array<ProductInput>`

### Categories

- **`GET /api/categories`**
- **`POST /api/categories`**
- **`PUT /api/categories/:id`**
- **`DELETE /api/categories/:id`**

### Suppliers

- **`GET /api/suppliers`**
- **`POST /api/suppliers`**
- **`PUT /api/suppliers/:id`**
- **`DELETE /api/suppliers/:id`**

### Customers

- **`GET /api/customers`**
- **`POST /api/customers`**
- **`PUT /api/customers/:id`**
- **`DELETE /api/customers/:id`**

### Units

- **`GET /api/units`**
- **`POST /api/units`**
- **`PUT /api/units/:id`**
  - **Side Effect:** Must cascade unit name updates to all associated `Products`.
- **`DELETE /api/units/:id`**

---

## 3. Inventory Management

### Stock In

- **`GET /api/stock-in`**
- **`POST /api/stock-in`**
  - **Request:** `{ productId: string, amount: number, supplierId?: string, ... }`
  - **Side Effects:**
    1. Increases `Products.stock` by `amount`.
    2. Recalculates `Products.hpp` (Harga Pokok Penjualan / COGS) if cost changes.
    3. Auto-generates a record in `HppHistory`.

### Stock Out

- **`GET /api/stock-out`**
- **`POST /api/stock-out`**
  - **Request:** `{ productId: string, amount: number, reason: string, ... }`
  - **Side Effects:**
    1. Decreases `Products.stock` by `amount`.

### Stock Opname (Audit)

- **`GET /api/stock-opname`**
- **`POST /api/stock-opname`** (Create Draft)
- **`PUT /api/stock-opname/:id`** (Update Draft Items)
- **`DELETE /api/stock-opname/:id`** (Delete Draft)
- **`POST /api/stock-opname/:id/complete`**
  - **Side Effects:**
    1. Compares `systemStock` vs `actualStock`.
    2. Automatically creates `StockIn` records for surpluses.
    3. Automatically creates `StockOut` records for deficits.
    4. Updates exact stock values on `Products`.
    5. Locks opname status to `COMPLETED`.

---

## 4. Point of Sale (Transactions)

### Transactions

- **`GET /api/transactions`**
- **`POST /api/transactions`**
  - **Request:** `{ customerId?: string, paymentMethodId: string, items: Array<TransactionItem>, total: number, paymentAmount: number, ... }`
  - **Side Effects:**
    1. Decreases `Products.stock` for each item.
    2. If `status` is `COMPLETED` and `paymentAmount < total`, auto-creates a `Debt` record for the customer.
- **`PUT /api/transactions/:id`**
  - **Usage:** Completing an open bill (e.g. paying an unpaid dine-in order).
- **`DELETE /api/transactions/:id`** (Cancel / Refund)
  - **Side Effects:**
    1. Restores `Products.stock` for all items in the transaction.
    2. If a `Debt` was associated with this transaction, delete it.
    3. Marks transaction as deleted / cancelled.

---

## 5. Finances

### Expenses & Categories

- **`GET /api/expense-categories`**
- **`POST /api/expense-categories`**
- **`PUT /api/expense-categories/:id`**
- **`DELETE /api/expense-categories/:id`**
- **`GET /api/expenses`**
- **`POST /api/expenses`**
- **`PUT /api/expenses/:id`**
- **`DELETE /api/expenses/:id`**

### Debts & Payments

- **`GET /api/debts`**
- **`POST /api/debts/:id/payments`**
  - **Request:** `{ amount: number, paymentMethodId: string, ... }`
  - **Side Effects:**
    1. Subtracts `amount` from `Debts.remainingAmount`.
    2. If `remainingAmount <= 0`, updates `Debts.status` to `PAID`.

### Payment Methods

- **`GET /api/payment-methods`**
- **`POST /api/payment-methods`**
- **`PUT /api/payment-methods/:id`**
- **`DELETE /api/payment-methods/:id`** (Hard Delete)

---

## 6. Store Configuration

### Settings

- **`GET /api/settings`**
- **`PUT /api/settings`**
  - **Usage:** Updates store info, theme, multi-user toggles, receipt settings, and cloud configuration.

### Minimum Stock Alerts

- **`PUT /api/settings/min-stock-alert`**
  - **Request:** `{ threshold: number }`
