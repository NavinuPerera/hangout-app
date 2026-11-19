package com.hangout.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/events")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class EventController {

    private final EventRepository eventRepository;

    public EventController(
            EventRepository eventRepository) {

        this.eventRepository = eventRepository;
    }

    // ==========================================
    // GET CURRENT USER'S EVENTS
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getEvents(
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        List<Event> events =
                eventRepository.findByOwnerId(userId);

        return ResponseEntity.ok(events);
    }

    // ==========================================
    // CREATE EVENT
    // ==========================================

    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestBody Event event,
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        event.setId(UUID.randomUUID().toString());

        // Ownership comes from the authenticated
        // server session, never from the frontend.
        event.setOwnerId(userId);

        Event savedEvent =
                eventRepository.save(event);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedEvent);
    }

    // ==========================================
    // UPDATE EVENT
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable String id,
            @RequestBody Event updatedEvent,
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        Event event = eventRepository
                .findByIdAndOwnerId(id, userId)
                .orElse(null);

        if (event == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "Event not found"
                    ));
        }

        event.setName(updatedEvent.getName());
        event.setDate(updatedEvent.getDate());
        event.setTime(updatedEvent.getTime());
        event.setFriends(updatedEvent.getFriends());

        Event savedEvent =
                eventRepository.save(event);

        return ResponseEntity.ok(savedEvent);
    }

    // ==========================================
    // DELETE EVENT
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            @PathVariable String id,
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        Event event = eventRepository
                .findByIdAndOwnerId(id, userId)
                .orElse(null);

        if (event == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "Event not found"
                    ));
        }

        eventRepository.delete(event);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Event deleted successfully"
                )
        );
    }

    // ==========================================
    // AUTHENTICATION HELPERS
    // ==========================================

    private String getUserId(HttpSession session) {

        return (String) session.getAttribute("userId");
    }

    private ResponseEntity<Map<String, String>>
    unauthorized() {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error",
                        "Not logged in"
                ));
    }
}