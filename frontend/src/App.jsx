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

  // Friends selected for the new event
  const [selectedFriends, setSelectedFriends] = useState([])


  function toggleFriend(friend) {
    if (selectedFriends.includes(friend)) {

      // Remove friend
      setSelectedFriends(
        selectedFriends.filter((name) => name !== friend)
      )

    } else {

      // Add friend
      setSelectedFriends([...selectedFriends, friend])
    }
  }


  // Checks whether the event information is valid
  function createEventCheck() {

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

    // Everything passed
    return true
  }


  // Actually creates the event
  function createEvent() {

    // Run validation first
    if (!createEventCheck()) {
      return
    }

    const newEvent = {
      name: eventName,
      date: eventDate,
      time: eventTime,
      friends: selectedFriends
    }

    // Add event
    setEvents([...events, newEvent])

    // Clear form
    setEventName('')
    setEventDate('')
    setEventTime('')
    setSelectedFriends([])

    // Close form
    setShowForm(false)
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

          {events.map((event, index) => (

            <div key={index}>

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

            </div>

          ))}

        </div>
      )}


      {/* OPEN CREATE EVENT FORM */}

      <button onClick={() => setShowForm(true)}>
        Create Event
      </button>


      {/* CREATE EVENT FORM */}

      {showForm && (

        <div>

          <h2>Create Event</h2>


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


          <button onClick={createEvent}>
            Create
          </button>


          <button onClick={() => setShowForm(false)}>
            Cancel
          </button>

        </div>

      )}

    </div>
  )
}

export default App