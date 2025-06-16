# Trustana - Take Home Assignment

This repository presents my solution for the Trustana take-home assignment, focusing on the development of RESTful API endpoints for managing product categories and attributes.

## 1. Technical Stack

I've leveraged the following technologies in this solution:

*   **Backend Framework:** Node.js with TypeScript and NestJS
*   **Database Management:** PostgreSQL, orchestrated via TypeORM
*   **Caching Mechanism:** Redis, integrated through `cache-manager`

## 2. Core Architectural Concepts

My implementation adheres to the following fundamental concepts derived from the assignment specifications:

*   **Product-Category Relationship:** I've designed each product to be exclusively associated with a single leaf node within the category hierarchy.
*   **Category-Attribute Relationship:**
    *   A category node may be linked to multiple attributes.
    *   **Direct Link:** An attribute explicitly associated with a specific category node.
    *   **Inherited Link:** An attribute associated with an ancestor node of a given category. I've ensured such attributes are implicitly inherited by all descendant categories.
    *   **Global Attribute:** An attribute not bound to any specific category. I consider these attributes universally applicable across all products.
*   **Product Attribute Value Assignment:** Products can possess multiple attribute values. The set of attributes applicable to a product comprises its category's direct, inherited, and global attributes.

## 3. Implemented API Endpoints

I have developed the following RESTful API endpoints:

### 3.1. Attribute Listing Endpoint (`GET /attributes`)

This endpoint facilitates the retrieval of attributes, supporting various optional filtering, pagination, and sorting parameters.

**Query Parameters:**

*   `categoryId` (Type: `string | string[]`, Optional): I use this to filter attributes by one or more category node identifiers. If `linkType` is not specified, the response includes all applicable attributes (direct, inherited, and global) for the designated category/categories.
*   `linkType` (Type: `AttributeLinkType | AttributeLinkType[]`, Optional): I use this to filter attributes based on their linkage type (`direct`, `inherited`, or `global`). This parameter is conditionally applicable, requiring the presence of the `categoryId` parameter.
*   `excludeCategoryId` (Type: `string | string[]`, Optional): I use this to exclude attributes that are applicable (direct, inherited, or global) to the specified category nodes. This functionality is designed to identify attributes not currently linked to a given node, aiding in attribute association. This parameter is also conditionally applicable, requiring the presence of the `categoryId` parameter.
*   `keyword` (Type: `string`, Optional): I use this to perform a case-insensitive search or filter on attribute names.
*   `page` (Type: `number`, Optional): Specifies the page number for paginated results (default: `1`).
*   `limit` (Type: `number`, Optional): Defines the maximum number of attributes per page (default: `10`).
*   `sortBy` (Type: `string`, Optional): Designates the attribute field for sorting (e.g., `name`, `createdAt`).
*   `sortOrder` (Type: `ASC | DESC`, Optional): Determines the sorting order (default: `ASC`).

**Default Behavior:**

*   In the absence of any query parameters, the endpoint returns all available attributes.

### 3.2. Category Tree Endpoint (`GET /categories`)

This endpoint provides a hierarchical representation of the category tree, optimized for frontend consumption.

**Query Parameters:**

*   `includeCounts` (Type: `boolean`, Optional): A flag to include the count of directly associated attributes and products for each category node in the response.

## 4. Local Development Setup

To set up and execute the application locally, follow these instructions:

### 4.1. Prerequisites

Ensure the following software components are installed:

*   Node.js (Recommended: v18 or higher)
*   npm package manager
*   PostgreSQL database server
*   Redis server

### 4.2. Repository Cloning

```bash
git clone git@github.com:manureja64/trustana_assignment.git
cd trustana_assignment
```

### 4.3. Dependency Installation

```bash
npm install
```

### 4.4. Environment Configuration

Create a `.env` file in the project's root directory, mirroring the structure of `.env.example`.

```dotenv
# .env example
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=trustana_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Note:** Verify that your PostgreSQL and Redis instances are operational and accessible using the configured credentials.

### 4.5. Database Initialization and Seeding

I'm using TypeORM for Object-Relational Mapping. Database schema creation and initial data population are performed as follows:

```bash
# Populate the database with sample data
npm run seed
```

### 4.6. Application Execution

Initiate the application in development mode:

```bash
nvm use 20
npm run start:dev
```

The application typically becomes accessible at `http://localhost:3000`.

## 5. API Testing

I can test the implemented API endpoints using `curl` or any preferred API client (e.g., Postman, Insomnia). All examples assume the API is running on `http://localhost:3000`.

### 5.1. Attributes API (`/attributes`) Examples

*   **Retrieve all attributes (no parameters):**
    ```bash
    curl "http://localhost:3000/attributes"
    ```

*   **Filter by a single category ID (all applicable attributes):**
    *(Replace `your-category-id-1` with an actual category ID from your seeded data)*
    ```bash
    curl "http://localhost:3000/attributes?categoryId=your-category-id-1"
    ```

*   **Filter by multiple category IDs (all applicable attributes):**
    *(Replace with actual category IDs)*
    ```bash
    curl "http://localhost:3000/attributes?categoryId=your-category-id-1,your-category-id-2"
    ```

*   **Filter by category ID and `direct` link type:**
    *(Replace with an actual category ID)*
    ```bash
    curl "http://localhost:3000/attributes?categoryId=your-category-id-1&linkType=direct"
    ```

*   **Filter by category ID and multiple link types (`direct`, `inherited`, `global`):**
    *(Replace with an actual category ID)*
    ```bash
    curl "http://localhost:3000/attributes?categoryId=your-category-id-1&linkType=direct,inherited,global"
    ```

*   **Filter attributes *not* applicable to a specific category (bonus):**
    *(Replace `filter-by-category-id` and `exclude-category-id` with actual category IDs)*
    ```bash
    curl "http://localhost:3000/attributes?categoryId=filter-by-category-id&excludeCategoryId=exclude-category-id"
    ```
    *This query returns attributes applicable to `filter-by-category-id` but not applicable to `exclude-category-id`.*

*   **Filter by keyword:**
    ```bash
    curl "http://localhost:3000/attributes?keyword=color"
    ```

*   **With pagination and sorting:**
    ```bash
    curl "http://localhost:3000/attributes?page=2&limit=5&sortBy=name&sortOrder=DESC"
    ```

*   **Combined filtering example:**
    ```bash
    curl "http://localhost:3000/attributes?categoryId=your-category-id-1&linkType=direct,global&keyword=size&page=1&limit=10&sortBy=createdAt&sortOrder=ASC"
    ```

### 5.2. Categories API (`/categories`) Examples

*   **Retrieve the category tree:**
    ```bash
    curl "http://localhost:3000/categories"
    ```

*   **Retrieve the category tree with associated attribute and product counts:**
    ```bash
    curl "http://localhost:3000/categories?includeCounts=true"
    ```

## 6. Advanced Considerations (Bonus Points)

### 6.1. API Endpoint Operability

The provided setup instructions enable the local execution and testing of all implemented API endpoints.

### 6.2. Database and Endpoint Models

I've defined the database schema through TypeORM entities (`Attribute`, `Category`, `CategoryAttribute`). API request and response structures are managed via Data Transfer Objects (DTOs), specifically `GetAttributesDto` and `PaginationDto`.

### 6.3. Caching Strategy

I've implemented caching for the `GET /attributes` endpoint using `cache-manager` with Redis. I find this strategy beneficial due to the potential for frequent requests for attribute lists, particularly when filtered by categories. Caching reduces database load and enhances response times for repetitive queries with identical parameters. I perform cache invalidation upon attribute creation, update, or deletion to maintain data consistency.

### 6.4. Performance at Scale (10M+ Products)

To accommodate a scale of 10 million+ products, I would consider the following performance optimization strategies:

*   **Database Indexing:** I would ensure comprehensive indexing on foreign keys (`categoryId`, `attributeId`, `parentId`) and frequently queried columns (`name`) for optimizing read performance.
*   **Advanced Caching:** Beyond the current Redis implementation, I would explore more granular caching (e.g., per category, per attribute type) and the adoption of a distributed caching solution.
*   **Database Sharding/Partitioning:** For extremely large datasets, I would consider sharding the database based on logical partitions (e.g., `categoryId`) to distribute the data and query load across multiple database instances.
*   **Read Replicas:** I would utilize PostgreSQL read replicas to enable horizontal scaling of read operations, offloading the primary database.
*   **Query Optimization:** I would prioritize continuous monitoring and optimization of complex database queries, especially those involving joins and aggregations.
*   **Data Denormalization:** For specific read-heavy operations, I might consider strategic data denormalization to reduce join complexity, acknowledging the associated trade-offs in data consistency.
*   **Load Balancing and Horizontal Scaling:** I would deploy multiple instances of the NestJS application behind a load balancer to distribute incoming API requests, enhancing throughput and availability.
*   **Connection Pooling:** I would implement efficient database connection management to minimize overhead and improve resource utilization.

### 6.5. Integration and End-to-End Testing

While not included in this deliverable, a robust testing suite would typically comprise:

*   **Unit and Integration Tests:** I would utilize frameworks such as Jest to validate individual components and their interactions.
*   **End-to-End (E2E) API Tests:** I would employ tools like Supertest to ensure the correctness and robustness of the API endpoints from an external perspective.
