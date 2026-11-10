package com.hangout.backend;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public List<Event> getEvents() {
        return eventRepository.findAll();
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        event.setId(UUID.randomUUID().toString());
        return eventRepository.save(event);
    }

    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable String id,
            @RequestBody Event updatedEvent) {

        return eventRepository.findById(id)
                .map(event -> {
                    event.setName(updatedEvent.getName());
                    event.setDate(updatedEvent.getDate());
                    event.setTime(updatedEvent.getTime());
                    event.setFriends(updatedEvent.getFriends());

                    return eventRepository.save(event);
                })
                .orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable String id) {
        eventRepository.deleteById(id);
    }
}