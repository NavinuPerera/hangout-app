import { useEffect, useState } from 'react'
import './App.css'

// ==========================================
// UI-ONLY HELPERS (display formatting + icons)
// None of these touch state, the API, or event data.
// ==========================================

const ICONS = {
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.6 3.5 2.6 3.5 5.5" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  wallet: (
    <>
      <path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M3 7l2-3h12M16 14h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
}

function Icon({ name, size = 18 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

// Initial + a stable color per name
function Avatar({ name }) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360
  return (
    <span className="avatar" style={{ '--hue': hash }} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

// "2026-11-14" -> local Date (avoids the UTC off-by-one bug)
function parseEventDate(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatTime(value) {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatLongDate(date) {
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function whenLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date - today) / 86400000)
  if (diff === 0) return { text: 'Today', soon: true }
  if (diff === 1) return { text: 'Tomorrow', soon: true }
  if (diff > 1 && diff <= 7) return { text: `In ${diff} days`, soon: false }
  if (diff < 0) return { text: 'Past', soon: false }
  return null
}


function FriendsPanel() {
  const FRIENDS_API = 'http://localhost:8080/friends'

  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadFriendsData()
  }, [])

  async function api(path, options = {}) {
    const response = await fetch(`${FRIENDS_API}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })

    if (!response.ok) {
      let errorMessage = 'Something went wrong.'
      try {
        const body = await response.json()
        errorMessage = body.error || errorMessage
      } catch {
        // Keep the default message when the server has no JSON body.
      }
      throw new Error(errorMessage)
    }

    const contentType = response.headers.get('content-type') || ''
    return contentType.includes('application/json')
      ? response.json()
      : null
  }

  async function loadFriendsData() {
    setLoading(true)

    try {
      const [friendData, incomingData, outgoingData] = await Promise.all([
        api(''),
        api('/requests/incoming'),
        api('/requests/outgoing'),
      ])

      setFriends(friendData || [])
      setIncoming(incomingData || [])
      setOutgoing(outgoingData || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function searchUsers(event) {
    event.preventDefault()

    const cleaned = query.trim()
    if (!cleaned) {
      setResults([])
      setMessage('Enter a name or email to search.')
      return
    }

    setSearching(true)
    setMessage('')

    try {
      const data = await api(`/search?query=${encodeURIComponent(cleaned)}`)
      setResults(data || [])

      if (!data || data.length === 0) {
        setMessage('No users found.')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSearching(false)
    }
  }

  async function sendRequest(receiverId) {
    setMessage('')

    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      })

      setMessage('Friend request sent.')
      setResults((current) =>
        current.filter((user) => user.id !== receiverId)
      )
      await loadFriendsData()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function respondToRequest(requestId, action) {
    setMessage('')

    try {
      await api(`/requests/${requestId}/${action}`, {
        method: 'POST',
      })

      setMessage(
        action === 'accept'
          ? 'Friend request accepted.'
          : 'Friend request rejected.'
      )

      await loadFriendsData()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const cardStyle = {
    background: 'var(--surface, #ffffff)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: '18px',
    padding: '20px',
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px 0',
    borderBottom: '1px solid var(--border, #e5e7eb)',
  }

  const userInfo = (user) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
      <Avatar name={user.name || user.email || '?'} />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: 'block' }}>{user.name || 'Hangout user'}</strong>
        <span style={{ opacity: 0.7, overflowWrap: 'anywhere' }}>{user.email}</span>
      </div>
    </div>
  )

  return (
    <main className="page" id="friends">
      <section className="hero-section">
        <div>
          <h1>Friends</h1>
          <p className="hero-description">
            Find people on Hangout, manage requests, and build your real friends list.
          </p>
        </div>
      </section>

      {message && (
        <div
          style={{
            ...cardStyle,
            marginBottom: '20px',
            padding: '14px 18px',
          }}
          role="status"
        >
          {message}
        </div>
      )}

      <section style={{ ...cardStyle, marginBottom: '24px' }}>
        <div className="section-heading">
          <div>
            <h2>Find friends</h2>
            <p style={{ marginTop: '6px', opacity: 0.7 }}>
              Search by name or email.
            </p>
          </div>
        </div>

        <form
          onSubmit={searchUsers}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          <input
            type="search"
            placeholder="Search name or email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ flex: '1 1 260px' }}
          />
          <button className="primary-button" type="submit" disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {results.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {results.map((user) => (
              <div style={rowStyle} key={user.id}>
                {userInfo(user)}
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => sendRequest(user.id)}
                >
                  <Icon name="plus" size={16} />
                  Add friend
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ ...cardStyle, marginBottom: '24px' }}>
        <div className="section-heading">
          <h2>Incoming requests</h2>
          <span className="event-count">{incoming.length}</span>
        </div>

        {loading ? (
          <p>Loading requests...</p>
        ) : incoming.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No incoming friend requests.</p>
        ) : (
          incoming.map((request) => (
            <div style={rowStyle} key={request.requestId}>
              {userInfo(request.user)}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => respondToRequest(request.requestId, 'accept')}
                >
                  <Icon name="check" size={16} />
                  Accept
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => respondToRequest(request.requestId, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section style={{ ...cardStyle, marginBottom: '24px' }}>
        <div className="section-heading">
          <h2>Pending requests</h2>
          <span className="event-count">{outgoing.length}</span>
        </div>

        {loading ? (
          <p>Loading requests...</p>
        ) : outgoing.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No outgoing requests are pending.</p>
        ) : (
          outgoing.map((request) => (
            <div style={rowStyle} key={request.requestId}>
              {userInfo(request.user)}
              <span className="when-pill">Pending</span>
            </div>
          ))
        )}
      </section>

      <section style={cardStyle}>
        <div className="section-heading">
          <h2>Your friends</h2>
          <span className="event-count">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </span>
        </div>

        {loading ? (
          <p>Loading friends...</p>
        ) : friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <Icon name="users" size={32} />
            </div>
            <h3>No friends yet</h3>
            <p>Search for another Hangout account and send a friend request.</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div style={rowStyle} key={friend.id}>
              {userInfo(friend)}
              <span className="when-pill">Friends</span>
            </div>
          ))
        )}
      </section>
    </main>
  )
}

function InvitationsPanel() {
  const INVITATIONS_API = 'http://localhost:8080/invitations'

  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadInvitations()
  }, [])

  async function loadInvitations() {
    setLoading(true)

    try {
      const response = await fetch(INVITATIONS_API, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load invitations')
      }

      const data = await response.json()
      setInvitations(data || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function respond(invitationId, action) {
    setMessage('')

    try {
      const response = await fetch(
        `${INVITATIONS_API}/${invitationId}/${action}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        let errorMessage = 'Failed to update RSVP.'
        try {
          const body = await response.json()
          errorMessage = body.error || errorMessage
        } catch {
          // Keep default message.
        }
        throw new Error(errorMessage)
      }

      setMessage(action === 'accept' ? 'Invitation accepted.' : 'Invitation declined.')
      await loadInvitations()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const cardStyle = {
    background: 'var(--surface, #ffffff)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: '18px',
    padding: '20px',
  }

  return (
    <main className="page" id="invitations">
      <section className="hero-section">
        <div>
          <h1>Invitations</h1>
          <p className="hero-description">
            Events your friends have invited you to.
          </p>
        </div>
      </section>

      {message && (
        <div style={{ ...cardStyle, marginBottom: '20px', padding: '14px 18px' }} role="status">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading invitations...</p>
      ) : invitations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Icon name="mail" size={32} />
          </div>
          <h3>No invitations yet</h3>
          <p>When a friend invites you to an event, it will appear here.</p>
        </div>
      ) : (
        <div className="events-grid">
          {invitations.map((invitation) => {
            const event = invitation.event
            const date = parseEventDate(event?.date)
            const status = invitation.status || 'PENDING'

            return (
              <article className="event-card" key={invitation.invitationId}>
                <div className="event-card-top">
                  {date && (
                    <div className="date-badge" aria-hidden="true">
                      <span className="date-badge-month">
                        {date.toLocaleDateString([], { month: 'short' })}
                      </span>
                      <span className="date-badge-day">{date.getDate()}</span>
                    </div>
                  )}

                  <div className="event-card-main">
                    <h3>{event?.name || 'Event'}</h3>
                    <div className="event-meta">
                      <span className="meta-row">
                        <Icon name="calendar" size={16} />
                        {date ? formatLongDate(date) : event?.date}
                      </span>
                      <span className="meta-row">
                        <Icon name="clock" size={16} />
                        {formatTime(event?.time)}
                      </span>
                    </div>
                  </div>

                  <span className={status === 'ACCEPTED' ? 'when-pill is-soon' : 'when-pill'}>
                    {status}
                  </span>
                </div>

                <div className="invited-section">
                  <p className="invited-label">Invited by</p>
                  {invitation.sender ? (
                    <div className="friend-list">
                      <span className="friend-chip">
                        <Avatar name={invitation.sender.name || invitation.sender.email} />
                        {invitation.sender.name || invitation.sender.email}
                      </span>
                    </div>
                  ) : (
                    <p className="invited-empty">Hangout user</p>
                  )}
                </div>

                {status === 'PENDING' && (
                  <div className="event-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => respond(invitation.invitationId, 'accept')}
                    >
                      <Icon name="check" size={16} />
                      Accept
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => respond(invitation.invitationId, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}


function App() {

  // Spring Boot API
  const API_URL = 'http://localhost:8080/events'

  const [showForm, setShowForm] = useState(false)
  const [activeView, setActiveView] = useState('events')

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')

  const [events, setEvents] = useState([])

  // Real accepted friends loaded from the Friends API
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(true)

  const [selectedFriends, setSelectedFriends] = useState([])
  const [selectedFriendIds, setSelectedFriendIds] = useState([])

  // null = creating a new event
  // an ID = editing an existing event
  const [editingEventId, setEditingEventId] = useState(null)


  // ==========================================
  // LOAD EVENTS FROM SPRING BOOT
  // ==========================================

  useEffect(() => {
    fetchEvents()
    fetchFriends()
  }, [])


  async function fetchFriends() {

    setFriendsLoading(true)

    try {

      const response = await fetch('http://localhost:8080/friends', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load friends')
      }

      const data = await response.json()

      setFriends(data)

    } catch (error) {

      console.error('Error loading friends:', error)
      setFriends([])

    } finally {

      setFriendsLoading(false)

    }
  }


  async function fetchEvents() {

    try {

      const response = await fetch(API_URL, {
        credentials: 'include'  
      })

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()

      setEvents(data)

    } catch (error) {

      console.error('Error loading events:', error)

    }
  }


  // ==========================================
  // UI ONLY: modal behavior (Esc closes, page doesn't scroll behind it)
  // Calls your existing clearForm(). No data logic.
  // ==========================================

  useEffect(() => {
    if (!showForm) return

    function onKeyDown(e) {
      if (e.key === 'Escape') clearForm()
    }

    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm])


  // ==========================================
  // FRIEND SELECTION
  // ==========================================

  function toggleFriend(friend) {

    const friendName = friend.name || friend.email

    if (selectedFriendIds.includes(friend.id)) {

      setSelectedFriendIds(
        selectedFriendIds.filter(
          (id) => id !== friend.id
        )
      )

      setSelectedFriends(
        selectedFriends.filter(
          (name) => name !== friendName
        )
      )

    } else {

      setSelectedFriendIds([
        ...selectedFriendIds,
        friend.id
      ])

      setSelectedFriends([
        ...selectedFriends,
        friendName
      ])

    }
  }


  // ==========================================
  // VALIDATION
  // ==========================================

  function eventCheck() {

    if (eventName.trim() === '') {

      alert('Please enter an event name.')
      return false

    }

    if (eventDate === '') {

      alert('Please choose a date.')
      return false

    }

    if (eventTime === '') {

      alert('Please choose a time.')
      return false

    }

    if (selectedFriends.length === 0) {

      alert('Please invite at least one friend.')
      return false

    }

    return true
  }


  async function createInvitations(eventId) {

    const requests = selectedFriendIds.map((receiverId) =>
      fetch(`http://localhost:8080/invitations/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ receiverId })
      })
    )

    const responses = await Promise.all(requests)

    const failed = responses.find((response) => !response.ok)

    if (failed) {
      let errorMessage = 'Event was created, but one or more invitations failed.'

      try {
        const body = await failed.json()
        errorMessage = body.error || errorMessage
      } catch {
        // Keep default message.
      }

      throw new Error(errorMessage)
    }
  }


  // ==========================================
  // CREATE EVENT
  // ==========================================

  async function createEvent() {

    if (!eventCheck()) {
      return
    }

    const newEvent = {
      name: eventName,
      date: eventDate,
      time: eventTime,
      friends: selectedFriends
    }

    try {

      const response = await fetch(API_URL, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      credentials: 'include',

      body: JSON.stringify(newEvent)

    })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const createdEvent = await response.json()

      await createInvitations(createdEvent.id)

      setEvents([
        ...events,
        createdEvent
      ])

      clearForm()

    } catch (error) {

      console.error('Error creating event:', error)

    }
  }


  // ==========================================
  // DELETE EVENT
  // ==========================================

  async function deleteEvent(idToDelete) {

    try {

      const response = await fetch(
      `${API_URL}/${idToDelete}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    )

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      setEvents(
        events.filter(
          (event) =>
            event.id !== idToDelete
        )
      )

    } catch (error) {

      console.error('Error deleting event:', error)

    }
  }


  // ==========================================
  // START EDITING EVENT
  // ==========================================

  function startEditEvent(event) {

    setEventName(event.name)

    setEventDate(event.date)

    setEventTime(event.time)

    setSelectedFriends(
      event.friends || []
    )

    setSelectedFriendIds(
      friends
        .filter((friend) =>
          (event.friends || []).includes(friend.name || friend.email)
        )
        .map((friend) => friend.id)
    )

    setEditingEventId(event.id)

    setShowForm(true)
  }


  // ==========================================
  // SAVE EDIT
  // ==========================================

  async function saveEdit() {

    if (!eventCheck()) {
      return
    }

    const updatedEvent = {
      name: eventName,
      date: eventDate,
      time: eventTime,
      friends: selectedFriends
    }

    try {

      const response = await fetch(
      `${API_URL}/${editingEventId}`,
      {

        method: 'PUT',

        headers: {
          'Content-Type': 'application/json'
        },

        credentials: 'include',

        body: JSON.stringify(updatedEvent)

      }
    )

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      const savedEvent = await response.json()

      setEvents(

        events.map((event) =>

          event.id === editingEventId
            ? savedEvent
            : event

        )

      )

      clearForm()

    } catch (error) {

      console.error('Error updating event:', error)

    }
  }


  // ==========================================
  // CLEAR FORM
  // ==========================================

  function clearForm() {

    setEventName('')

    setEventDate('')

    setEventTime('')

    setSelectedFriends([])
    setSelectedFriendIds([])

    setEditingEventId(null)

    setShowForm(false)
  }


  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  function openCreateForm() {

    setEventName('')

    setEventDate('')

    setEventTime('')

    setSelectedFriends([])
    setSelectedFriendIds([])

    setEditingEventId(null)

    setShowForm(true)
  }


  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (
    <div className="app">

      {/* NAVIGATION (desktop / tablet) */}
      <nav className="navbar" aria-label="Main">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">H</div>
          <p className="brand-name">Hangout</p>
        </div>

        <div className="nav-links">
          <button
            type="button"
            className="nav-link"
            onClick={() => setActiveView('events')}
            aria-current={activeView === 'events' ? 'page' : undefined}
          >
            <Icon name="calendar" />
            Events
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => setActiveView('friends')}
            aria-current={activeView === 'friends' ? 'page' : undefined}
          >
            <Icon name="users" />
            Friends
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => setActiveView('invitations')}
            aria-current={activeView === 'invitations' ? 'page' : undefined}
          >
            <Icon name="mail" />
            Invitations
          </button>
          <span className="nav-link" aria-disabled="true">
            <Icon name="wallet" />
            Expenses
            <span className="soon">Soon</span>
          </span>
        </div>

        <div className="nav-actions">
          <div className="profile-placeholder" aria-label="Your profile">N</div>
        </div>
      </nav>


      {activeView === 'events' ? (
      <main className="page" id="events">

        {/* HERO */}
        <section className="hero-section">

          <div>
            <h1>Make plans happen.</h1>

            <p className="hero-description">
              Create events, invite your friends, and keep everyone
              on the same page.
            </p>
          </div>

          {!showForm && (
            <button
              className="primary-button"
              onClick={openCreateForm}
            >
              <Icon name="plus" />
              Create event
            </button>
          )}

        </section>


        {/* CREATE / EDIT FORM (modal on desktop, bottom sheet on mobile) */}
        {showForm && (

          <div className="overlay">

            <section
              className="form-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-title"
            >

              <button
                type="button"
                className="form-close"
                onClick={clearForm}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>

              <div className="form-header">
                <h2 id="form-title">
                  {editingEventId === null
                    ? 'Create an event'
                    : 'Edit event'}
                </h2>

                <p>
                  {editingEventId === null
                    ? 'Add the details and choose who you want to invite.'
                    : 'Update the details for this event.'}
                </p>
              </div>


              <div className="form-group">
                <label htmlFor="event-name">
                  Event name
                </label>

                <input
                  id="event-name"
                  type="text"
                  autoFocus
                  placeholder="Dinner, movie night, basketball..."
                  value={eventName}
                  onChange={(e) =>
                    setEventName(e.target.value)
                  }
                />
              </div>


              <div className="date-time-grid">

                <div className="form-group">
                  <label htmlFor="event-date">
                    Date
                  </label>

                  <input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="event-time">
                    Time
                  </label>

                  <input
                    id="event-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) =>
                      setEventTime(e.target.value)
                    }
                  />
                </div>

              </div>


              <div className="form-group">

                <p className="form-label" id="invite-label">
                  Invite friends
                </p>

                <div
                  className="friend-options"
                  role="group"
                  aria-labelledby="invite-label"
                >

                  {friendsLoading ? (

                    <p className="invited-empty">
                      Loading friends...
                    </p>

                  ) : friends.length === 0 ? (

                    <p className="invited-empty">
                      No friends yet. Add and accept a friend from the Friends page first.
                    </p>

                  ) : (

                    friends.map((friend) => {

                      const friendName = friend.name || friend.email

                      return (
                        <label
                          className="friend-option"
                          key={friend.id}
                        >

                          <input
                            type="checkbox"
                            checked={
                              selectedFriendIds.includes(friend.id)
                            }
                            onChange={() =>
                              toggleFriend(friend)
                            }
                          />

                          <Avatar name={friendName} />

                          <span>{friendName}</span>

                          <span className="check">
                            <Icon name="check" size={16} />
                          </span>

                        </label>
                      )
                    })

                  )}

                </div>

              </div>


              <div className="form-actions">

                {editingEventId === null ? (

                  <button
                    className="primary-button"
                    onClick={createEvent}
                  >
                    Create event
                  </button>

                ) : (

                  <button
                    className="primary-button"
                    onClick={saveEdit}
                  >
                    Save changes
                  </button>

                )}

                <button
                  className="secondary-button"
                  onClick={clearForm}
                >
                  Cancel
                </button>

              </div>

            </section>

          </div>

        )}


        {/* EVENTS */}
        <section aria-labelledby="events-title">

          <div className="section-heading">

            <h2 id="events-title">Your events</h2>

            <span className="event-count">
              {events.length}
              {events.length === 1 ? ' event' : ' events'}
            </span>

          </div>


          {events.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon" aria-hidden="true">
                <Icon name="calendar" size={32} />
              </div>

              <h3>No events yet</h3>

              <p>
                Create your first event and start making plans.
              </p>

              {!showForm && (
                <button
                  className="primary-button"
                  onClick={openCreateForm}
                >
                  <Icon name="plus" />
                  Create your first event
                </button>
              )}

            </div>

          ) : (

            <div className="events-grid">

              {events.map((event) => {

                const date = parseEventDate(event.date)
                const when = date ? whenLabel(date) : null

                return (

                <article
                  className="event-card"
                  key={event.id}
                >

                  <div className="event-card-top">

                    {date && (
                      <div className="date-badge" aria-hidden="true">
                        <span className="date-badge-month">
                          {date.toLocaleDateString([], { month: 'short' })}
                        </span>
                        <span className="date-badge-day">
                          {date.getDate()}
                        </span>
                      </div>
                    )}

                    <div className="event-card-main">

                      <h3>{event.name}</h3>

                      <div className="event-meta">

                        <span className="meta-row">
                          <Icon name="calendar" size={16} />
                          {date ? formatLongDate(date) : event.date}
                        </span>

                        <span className="meta-row">
                          <Icon name="clock" size={16} />
                          {formatTime(event.time)}
                        </span>

                      </div>

                    </div>

                    {when && (
                      <span
                        className={
                          when.soon
                            ? 'when-pill is-soon'
                            : 'when-pill'
                        }
                      >
                        {when.text}
                      </span>
                    )}

                  </div>


                  <div className="invited-section">

                    <p className="invited-label">
                      Invited
                    </p>

                    {event.friends &&
                    event.friends.length > 0 ? (

                      <div className="friend-list">

                        {event.friends.map((friend) => (

                          <span
                            className="friend-chip"
                            key={friend}
                          >
                            <Avatar name={friend} />
                            {friend}
                          </span>

                        ))}

                      </div>

                    ) : (

                      <p className="invited-empty">
                        No friends selected.
                      </p>

                    )}

                  </div>


                  <div className="event-actions">

                    <button
                      className="secondary-button"
                      onClick={() =>
                        startEditEvent(event)
                      }
                      aria-label={`Edit ${event.name}`}
                    >
                      <Icon name="edit" size={16} />
                      Edit
                    </button>

                    <button
                      className="danger-button"
                      onClick={() =>
                        deleteEvent(event.id)
                      }
                      aria-label={`Delete ${event.name}`}
                    >
                      <Icon name="trash" size={16} />
                      Delete
                    </button>

                  </div>

                </article>

                )
              })}

            </div>

          )}

        </section>

      </main>
      ) : activeView === 'friends' ? (
        <FriendsPanel />
      ) : (
        <InvitationsPanel />
      )}


      {/* MOBILE TAB BAR */}
      <nav className="tabbar" aria-label="Main">
        <button
          type="button"
          className="tab"
          onClick={() => setActiveView('events')}
          aria-current={activeView === 'events' ? 'page' : undefined}
        >
          <Icon name="calendar" size={22} />
          Events
        </button>

        <button
          type="button"
          className="tab"
          onClick={() => setActiveView('friends')}
          aria-current={activeView === 'friends' ? 'page' : undefined}
        >
          <Icon name="users" size={22} />
          Friends
        </button>

        <button
          type="button"
          className="tab"
          onClick={() => setActiveView('invitations')}
          aria-current={activeView === 'invitations' ? 'page' : undefined}
        >
          <Icon name="mail" size={22} />
          Invites
        </button>

        <button
          type="button"
          className="tab tab-create"
          onClick={() => {
            setActiveView('events')
            openCreateForm()
          }}
          aria-label="Create event"
        >
          <Icon name="plus" size={26} />
        </button>

        <span className="tab" aria-disabled="true">
          <Icon name="wallet" size={22} />
          Expenses
        </span>
      </nav>

    </div>
  )
}


export default App
