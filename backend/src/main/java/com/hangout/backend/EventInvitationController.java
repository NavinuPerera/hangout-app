package com.hangout.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/invitations")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class EventInvitationController {

    private final EventInvitationRepository invitationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventInvitationController(
            EventInvitationRepository invitationRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {

        this.invitationRepository = invitationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }


    // =========================================================
    // SEND EVENT INVITATION
    // =========================================================

    @PostMapping("/events/{eventId}")
    public ResponseEntity<?> sendInvitation(
            @PathVariable String eventId,
            @RequestBody EventInvitationRequest request,
            HttpSession session) {

        String currentUserId = (String) session.getAttribute("userId");

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not logged in."));
        }

        Optional<Event> eventOptional =
                eventRepository.findByIdAndOwnerId(eventId, currentUserId);

        if (eventOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found."));
        }

        if (request.getReceiverId() == null ||
                request.getReceiverId().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Receiver is required."));
        }

        if (currentUserId.equals(request.getReceiverId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot invite yourself."));
        }

        if (!userRepository.existsById(request.getReceiverId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found."));
        }

        Optional<EventInvitation> existing =
                invitationRepository.findByEventIdAndReceiverId(
                        eventId,
                        request.getReceiverId()
                );

        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "This user has already been invited."
                    ));
        }

        EventInvitation invitation = new EventInvitation();

        invitation.setEventId(eventId);
        invitation.setSenderId(currentUserId);
        invitation.setReceiverId(request.getReceiverId());

        invitation.prepareNewInvitation();

        EventInvitation saved =
                invitationRepository.save(invitation);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saved);
    }


    // =========================================================
    // GET CURRENT USER'S EVENT INVITATIONS
    // =========================================================

    @GetMapping
    public ResponseEntity<?> getMyInvitations(HttpSession session) {

        String currentUserId = (String) session.getAttribute("userId");

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not logged in."));
        }

        List<EventInvitation> invitations =
                invitationRepository.findByReceiverId(currentUserId);

        List<Map<String, Object>> response = new ArrayList<>();

        for (EventInvitation invitation : invitations) {

            Optional<Event> eventOptional =
                    eventRepository.findById(invitation.getEventId());

            if (eventOptional.isEmpty()) {
                continue;
            }

            Event event = eventOptional.get();

            Map<String, Object> item = new HashMap<>();

            item.put("invitationId", invitation.getId());
            item.put("status", invitation.getStatus());
            item.put("createdAt", invitation.getCreatedAt());

            item.put("event", event);

            userRepository.findById(invitation.getSenderId())
                    .ifPresent(sender -> {

                        Map<String, Object> senderInfo = new HashMap<>();

                        senderInfo.put("id", sender.getId());
                        senderInfo.put("name", sender.getName());
                        senderInfo.put("email", sender.getEmail());

                        item.put("sender", senderInfo);
                    });

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // ACCEPT INVITATION
    // =========================================================

    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable String invitationId,
            HttpSession session) {

        return updateInvitationStatus(
                invitationId,
                "ACCEPTED",
                session
        );
    }


    // =========================================================
    // DECLINE INVITATION
    // =========================================================

    @PostMapping("/{invitationId}/decline")
    public ResponseEntity<?> declineInvitation(
            @PathVariable String invitationId,
            HttpSession session) {

        return updateInvitationStatus(
                invitationId,
                "DECLINED",
                session
        );
    }


    // =========================================================
    // GET RSVPS FOR AN EVENT
    // Only the event owner can see these.
    // =========================================================

    @GetMapping("/events/{eventId}")
    public ResponseEntity<?> getEventInvitations(
            @PathVariable String eventId,
            HttpSession session) {

        String currentUserId = (String) session.getAttribute("userId");

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not logged in."));
        }

        Optional<Event> eventOptional =
                eventRepository.findByIdAndOwnerId(
                        eventId,
                        currentUserId
                );

        if (eventOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found."));
        }

        List<EventInvitation> invitations =
                invitationRepository.findByEventId(eventId);

        List<Map<String, Object>> response = new ArrayList<>();

        for (EventInvitation invitation : invitations) {

            Map<String, Object> item = new HashMap<>();

            item.put("invitationId", invitation.getId());
            item.put("status", invitation.getStatus());

            userRepository.findById(invitation.getReceiverId())
                    .ifPresent(user -> {

                        Map<String, Object> userInfo = new HashMap<>();

                        userInfo.put("id", user.getId());
                        userInfo.put("name", user.getName());
                        userInfo.put("email", user.getEmail());

                        item.put("user", userInfo);
                    });

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }


    // =========================================================
    // SHARED RSVP UPDATE LOGIC
    // =========================================================

    private ResponseEntity<?> updateInvitationStatus(
            String invitationId,
            String newStatus,
            HttpSession session) {

        String currentUserId = (String) session.getAttribute("userId");

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not logged in."));
        }

        Optional<EventInvitation> invitationOptional =
                invitationRepository.findById(invitationId);

        if (invitationOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Invitation not found."));
        }

        EventInvitation invitation =
                invitationOptional.get();

        if (!invitation.getReceiverId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error",
                            "This invitation does not belong to this user."
                    ));
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "This invitation has already been answered."
                    ));
        }

        invitation.setStatus(newStatus);

        EventInvitation saved =
                invitationRepository.save(invitation);

        return ResponseEntity.ok(saved);
    }
}