package com.hangout.backend;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {

    // Temporary in-memory event storage
    private final List<Event> events = new ArrayList<>();


    // GET all events
    @GetMapping
    public List<Event> getEvents() {
        return events;
    }


    // CREATE a new event
    @PostMapping
    public Event createEvent(@RequestBody Event event) {

        // Generate a unique ID for the event
        event.setId(UUID.randomUUID().toString());

        // Add the event to our temporary list
        events.add(event);

        return event;
    }


    // UPDATE an existing event
    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable String id,
            @RequestBody Event updatedEvent) {

        for (Event event : events) {

            if (event.getId().equals(id)) {

                event.setName(updatedEvent.getName());
                event.setDate(updatedEvent.getDate());
                event.setTime(updatedEvent.getTime());
                event.setFriends(updatedEvent.getFriends());

                return event;
            }
        }

        return null;
    }


    // DELETE an event
    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable String id) {

        events.removeIf(
                event -> event.getId().equals(id)
        );
    }
}