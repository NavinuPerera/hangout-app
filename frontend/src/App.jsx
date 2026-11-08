import { useEffect, useState } from 'react'
import './App.css'

function App() {

  // Spring Boot API
  const API_URL = 'http://localhost:8080/events'

  const [showForm, setShowForm] = useState(false)

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')

  const [events, setEvents] = useState([])

  // Temporary test friends
  // These will later be replaced with real registered users
  const friends = ['Andrew', 'Ketan', 'Satya']

  const [selectedFriends, setSelectedFriends] = useState([])

  // null = creating a new event
  // an ID = editing an existing event
  const [editingEventId, setEditingEventId] = useState(null)


  // ==========================================
  // LOAD EVENTS FROM SPRING BOOT
  // ==========================================

  useEffect(() => {
    fetchEvents()
  }, [])


  async function fetchEvents() {

    try {

      const response = await fetch(API_URL)

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
  // FRIEND SELECTION
  // ==========================================

  function toggleFriend(friend) {

    if (selectedFriends.includes(friend)) {

      setSelectedFriends(
        selectedFriends.filter(
          (name) => name !== friend
        )
      )

    } else {

      setSelectedFriends([
        ...selectedFriends,
        friend
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

        body: JSON.stringify(newEvent)

      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const createdEvent = await response.json()

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
          method: 'DELETE'
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

    setEditingEventId(null)

    setShowForm(true)
  }


  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (

    <div>

      <h1>Hangout</h1>

      <p>
        Plan something with your friends.
      </p>


      <h2>Your Events</h2>


      {/* EVENT LIST */}

      {events.length === 0 ? (

        <p>No events yet.</p>

      ) : (

        <div>

          {events.map((event) => (

            <div key={event.id}>

              <h3>
                {event.name}
              </h3>

              <p>
                Date: {event.date}
              </p>

              <p>
                Time: {event.time}
              </p>

              <p>
                Invited:
              </p>


              {event.friends &&
              event.friends.length > 0 ? (

                <ul>

                  {event.friends.map(
                    (friend) => (

                      <li key={friend}>
                        {friend}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  No friends selected.
                </p>

              )}


              <button
                onClick={() =>
                  startEditEvent(event)
                }
              >
                Edit
              </button>


              <button
                onClick={() =>
                  deleteEvent(event.id)
                }
              >
                Delete
              </button>


              <hr />

            </div>

          ))}

        </div>

      )}


      {/* CREATE EVENT BUTTON */}

      {!showForm && (

        <button
          onClick={openCreateForm}
        >
          Create Event
        </button>

      )}


      {/* CREATE / EDIT EVENT FORM */}

      {showForm && (

        <div>


          {editingEventId === null ? (

            <h2>
              Create Event
            </h2>

          ) : (

            <h2>
              Edit Event
            </h2>

          )}


          <label>
            Event Name
          </label>

          <br />

          <input
            type="text"
            value={eventName}
            onChange={(e) =>
              setEventName(
                e.target.value
              )
            }
          />


          <br />
          <br />


          <label>
            Date
          </label>

          <br />

          <input
            type="date"
            value={eventDate}
            onChange={(e) =>
              setEventDate(
                e.target.value
              )
            }
          />


          <br />
          <br />


          <label>
            Time
          </label>

          <br />

          <input
            type="time"
            value={eventTime}
            onChange={(e) =>
              setEventTime(
                e.target.value
              )
            }
          />


          <br />
          <br />


          <h3>
            Invite Friends
          </h3>


          {friends.map((friend) => (

            <div key={friend}>

              <label>

                <input
                  type="checkbox"
                  checked={
                    selectedFriends.includes(
                      friend
                    )
                  }
                  onChange={() =>
                    toggleFriend(friend)
                  }
                />

                {friend}

              </label>

            </div>

          ))}


          <br />


          {editingEventId === null ? (

            <button
              onClick={createEvent}
            >
              Create
            </button>

          ) : (

            <button
              onClick={saveEdit}
            >
              Save Changes
            </button>

          )}


          <button
            onClick={clearForm}
          >
            Cancel
          </button>


        </div>

      )}

    </div>

  )
}

export default App