# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Development Log

### November 7, 2026 — Full-Stack Backend and Database Foundation

This development session focused on transitioning Hangout from a frontend-only React prototype into a full-stack application with a Java backend and PostgreSQL database infrastructure.

#### Backend Development

A Spring Boot backend was created using Java 21 and Maven. The backend now exposes a REST API for managing events and runs independently from the React frontend on port `8080`.

The initial event API supports the core CRUD operations:

- `GET /events` — retrieve all events
- `POST /events` — create a new event
- `PUT /events/{id}` — update an existing event
- `DELETE /events/{id}` — delete an event

An `Event` model was introduced to represent event data on the backend. Events currently contain a unique ID, name, date, time, and a temporary list of invited friends.

#### Frontend–Backend Integration

The React frontend was updated to communicate with the Spring Boot API using HTTP requests rather than managing all event data exclusively in React state.

Event creation, editing, deletion, and retrieval now flow through the backend REST API. The frontend automatically retrieves the current event list from the backend when the application loads.

Cross-Origin Resource Sharing (CORS) was configured to allow the React development server on port `5173` to communicate with the Spring Boot server on port `8080`.

The temporary friend-selection system was also integrated into the API so selected friends are transferred between the frontend and backend with each event.

#### PostgreSQL Setup

PostgreSQL 18.6 was installed and configured for local development.

A dedicated `hangout` database was created and connectivity was verified using PostgreSQL's command-line client.

Spring Data JPA and the PostgreSQL JDBC driver were added to the backend. Spring Boot was successfully connected to the PostgreSQL database through Hibernate and HikariCP.

Database credentials are not stored directly in the repository. The PostgreSQL password is referenced through the `DB_PASSWORD` environment variable to prevent credentials from being committed to source control.

#### Current Architecture

The application now has the following development architecture:

`React Frontend → REST API → Spring Boot Backend → PostgreSQL`

The frontend runs on port `5173`, while the backend API runs on port `8080`. PostgreSQL provides the database layer for the next stage of development.

#### Current Limitation

Although the PostgreSQL connection is established, event data is still temporarily stored in an in-memory Java `ArrayList`. Restarting the Spring Boot server therefore clears existing events.

The next development milestone is to convert the `Event` model into a JPA entity and introduce an `EventRepository`, replacing the temporary in-memory storage with persistent PostgreSQL storage.