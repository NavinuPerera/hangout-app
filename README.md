# hangout-app
A web app for organizing group events, splitting expenses, tracking balances, and creating shared group funds.

## Development Journal

## Current Features

### Authentication
- User registration and login
- Session-based authentication
- Secure password hashing with BCrypt
- User-specific application data

### Friends
- Search for registered users
- Send friend requests
- Accept or decline requests
- View accepted friends
- Invite accepted friends to events

### Events
- Create, edit, and delete events
- Persistent event storage with PostgreSQL
- Events are associated with their host account
- Invite friends to events
- Accept or decline event invitations
- View both hosted and accepted events under **Your Events**
- Hosting and Going event roles
- Shared attendee list with RSVP statuses
- Host-only event management permissions

### Tech Stack

**Frontend:** React, JavaScript, Vite  
**Backend:** Java, Spring Boot, Spring Data JPA, Hibernate  
**Database:** PostgreSQL  
**API:** REST/JSON  
**Version Control:** Git & GitHub

## In Development

### Expense Splitting
The next major feature is shared event expenses. Users will be able to:

- Add expenses to an event
- Select which attendee paid
- Select which attendees participated in the expense
- Split expenses equally between participants
- Track each attendee's share
- Calculate net balances showing who owes whom
- View expense history for an event

## Planned Features

- Custom expense splits
- Group gift pots
- Payment/settlement integration
- UI/UX improvements
- Expanded automated testing
- Production deployment
