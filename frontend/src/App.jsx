import { useState } from 'react'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false)

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')

  const [events, setEvents] = useState([])

  // Temporary friends
  const friends = ['Andrew', 'Ketan', 'Satya']

  const [selectedFriends, setSelectedFriends] = useState([])

  // Stores the ID of the event being edited
  // null means we are creating a new event
  const [editingEventId, setEditingEventId] = useState(null)


  function toggleFriend(friend) {
    if (selectedFriends.includes(friend)) {
      setSelectedFriends(
        selectedFriends.filter((name) => name !== friend)
      )
    } else {
      setSelectedFriends([...selectedFriends, friend])
    }
  }


  // Check if the form is valid
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


  // Create a new event
  function createEvent() {
    if (!eventCheck()) {
      return
    }

    const newEvent = {
      id: crypto.randomUUID(),
      name: eventName,
      date: eventDate,
      time: eventTime,
      friends: selectedFriends
    }

    setEvents([...events, newEvent])

    clearForm()
  }


  // Delete an event using its ID
  function deleteEvent(idToDelete) {
    const updatedEvents = events.filter(
      (event) => event.id !== idToDelete
    )

    setEvents(updatedEvents)
  }


  // Load an existing event into the form
  function startEditEvent(event) {
    setEventName(event.name)
    setEventDate(event.date)
    setEventTime(event.time)
    setSelectedFriends(event.friends)

    setEditingEventId(event.id)

    setShowForm(true)
  }


  // Save changes to an existing event
  function saveEdit() {
    if (!eventCheck()) {
      return
    }

    const updatedEvents = events.map((event) => {
      if (event.id === editingEventId) {
        return {
          ...event,
          name: eventName,
          date: eventDate,
          time: eventTime,
          friends: selectedFriends
        }
      }

      return event
    })

    setEvents(updatedEvents)

    clearForm()
  }


  // Clear all form fields
  function clearForm() {
    setEventName('')
    setEventDate('')
    setEventTime('')
    setSelectedFriends([])
    setEditingEventId(null)
    setShowForm(false)
  }


  // Open a fresh Create Event form
  function openCreateForm() {
    setEventName('')
    setEventDate('')
    setEventTime('')
    setSelectedFriends([])
    setEditingEventId(null)

    setShowForm(true)
  }


  return (
    <div>

      <h1>Hangout</h1>

      <p>Plan something with your friends.</p>

      <h2>Your Events</h2>


      {/* EVENT LIST */}

      {events.length === 0 ? (

        <p>No events yet.</p>

      ) : (

        <div>

          {events.map((event) => (

            <div key={event.id}>

              <h3>{event.name}</h3>

              <p>Date: {event.date}</p>

              <p>Time: {event.time}</p>

              <p>Invited:</p>

              <ul>

                {event.friends.map((friend) => (

                  <li key={friend}>
                    {friend}
                  </li>

                ))}

              </ul>


              <button onClick={() => startEditEvent(event)}>
                Edit
              </button>


              <button onClick={() => deleteEvent(event.id)}>
                Delete
              </button>

              <hr />

            </div>

          ))}

        </div>

      )}


      {/* OPEN CREATE EVENT FORM */}

      {!showForm && (

        <button onClick={openCreateForm}>
          Create Event
        </button>

      )}


      {/* CREATE / EDIT EVENT FORM */}

      {showForm && (

        <div>

          {editingEventId === null ? (
            <h2>Create Event</h2>
          ) : (
            <h2>Edit Event</h2>
          )}


          <label>Event Name</label>

          <br />

          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />


          <br />
          <br />


          <label>Date</label>

          <br />

          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />


          <br />
          <br />


          <label>Time</label>

          <br />

          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />


          <br />
          <br />


          <h3>Invite Friends</h3>


          {friends.map((friend) => (

            <div key={friend}>

              <label>

                <input
                  type="checkbox"
                  checked={selectedFriends.includes(friend)}
                  onChange={() => toggleFriend(friend)}
                />

                {friend}

              </label>

            </div>

          ))}


          <br />


          {editingEventId === null ? (

            <button onClick={createEvent}>
              Create
            </button>

          ) : (

            <button onClick={saveEdit}>
              Save Changes
            </button>

          )}


          <button onClick={clearForm}>
            Cancel
          </button>

        </div>

      )}

    </div>
  )
}

export default App