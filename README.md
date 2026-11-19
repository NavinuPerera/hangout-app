# hangout-app
A web app for organizing group events, splitting expenses, tracking balances, and creating shared group funds.

## Development Journal

### November 18, 2026 — User Authentication Backend

Development continued on the account system for Hangout. The main goal of this session was to establish a secure backend authentication flow before connecting authentication to the React frontend.

#### Completed

- Added user registration through `POST /auth/register`
- Added login through `POST /auth/login`
- Added BCrypt password hashing so plaintext passwords are never stored in PostgreSQL
- Added duplicate email protection
- Added email normalization before account lookup and creation
- Added session-based authentication
- Added `GET /auth/me` to retrieve the currently authenticated user
- Added `POST /auth/logout` to invalidate the user's session
- Configured CORS to support authenticated requests from the React frontend
- Tested registration and login against PostgreSQL
- Verified that an authenticated session persists across separate API requests
- Verified that `/auth/me` returns the correct logged-in user
- Verified that logout invalidates the session and subsequent `/auth/me` requests return `401 Unauthorized`
- Authentication responses only expose safe account information and never return password hashes

#### Current Authentication Flow

```text
User registers
      ↓
Password hashed with BCrypt
      ↓
User stored in PostgreSQL
      ↓
User logs in
      ↓
Password verified against stored hash
      ↓
Server creates authenticated session
      ↓
/auth/me identifies current user
      ↓
User logs out
      ↓
Session invalidated
```

### Current Project Progress

The main application architecture is now established:

```text
React
   ↓ REST API
Spring Boot
   ↓ Spring Data JPA
PostgreSQL
```

Completed major foundations:

- React frontend and event dashboard
- Responsive UI/UX foundation
- Spring Boot REST API
- PostgreSQL integration
- JPA database persistence
- Event create, read, update and delete operations
- Persistent event storage
- User database model
- User registration
- Secure password hashing
- User login
- Session-based authentication
- Current-user lookup
- Logout and session invalidation

### Next Steps

The backend portion of the core account system is now largely complete. The next milestone is connecting authentication to the React frontend.

Remaining account work:

1. Build the React sign-up interface
2. Build the React login interface
3. Send authenticated requests with session credentials
4. Restore the logged-in user when the application loads
5. Add logout to the frontend
6. Display the current user's account information
7. Connect events and future application data to the authenticated user
8. Perform an end-to-end account flow test

Once the core account system is complete, development will move into the social functionality of Hangout:

**Users → Friends → Friend Requests → Event Invitations → RSVP → Expenses → Group Pots → Payments**

Temporary development data, including the hardcoded friend list, will be replaced with real registered Hangout users as the friends system is implemented.

### Longer-Term Work

After the main product features are implemented, additional work will include password recovery, email verification, account/profile management, stronger validation and security hardening, automated testing, final UI/UX refinement, deployment, monitoring, and production infrastructure.

The project is currently transitioning from its technical foundation into the full multi-user application stage.
