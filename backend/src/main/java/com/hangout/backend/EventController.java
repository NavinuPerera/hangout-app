package com.hangout.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
    private final EventInvitationRepository invitationRepository;

    public EventController(
            EventRepository eventRepository,
            EventInvitationRepository invitationRepository) {

        this.eventRepository = eventRepository;
        this.invitationRepository = invitationRepository;
    }

    // ==========================================
    // GET CURRENT USER'S HOSTED EVENTS
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

        // Ownership always comes from the logged-in user's
        // server session, not from frontend data.
        event.setOwnerId(userId);

        Event savedEvent =
                eventRepository.save(event);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedEvent);
    }

    // ==========================================
    // UPDATE EVENT
    // Only the host can edit an event.
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
                    .body(
                            Map.of(
                                    "error",
                                    "Event not found"
                            )
                    );
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
    // Only the host can delete an event.
    // ==========================================

    @DeleteMapping("/{id}")
    @Transactional
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
                    .body(
                            Map.of(
                                    "error",
                                    "Event not found"
                            )
                    );
        }

        // Delete all invitation / RSVP records for this
        // event before deleting the event itself.
        invitationRepository.deleteByEventId(id);

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

    private String getUserId(
            HttpSession session) {

        return (String) session.getAttribute(
                "userId"
        );
    }

    private ResponseEntity<Map<String, String>>
    unauthorized() {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(
                        Map.of(
                                "error",
                                "Not logged in"
                        )
                );
    }
}