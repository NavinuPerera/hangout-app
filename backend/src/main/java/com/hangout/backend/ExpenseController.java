package com.hangout.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/expenses")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final EventRepository eventRepository;
    private final EventInvitationRepository invitationRepository;
    private final UserRepository userRepository;

    public ExpenseController(
            ExpenseRepository expenseRepository,
            EventRepository eventRepository,
            EventInvitationRepository invitationRepository,
            UserRepository userRepository) {

        this.expenseRepository = expenseRepository;
        this.eventRepository = eventRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<?> getEventExpenses(
            @PathVariable String eventId,
            HttpSession session) {

        String currentUserId = getUserId(session);

        if (currentUserId == null) {
            return unauthorized();
        }

        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found"));
        }

        if (!canAccessEvent(event, currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You do not have access to this event"));
        }

        List<Expense> expenses =
                expenseRepository.findByEventIdOrderByCreatedAtDesc(eventId);

        return ResponseEntity.ok(expenses);
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<?> createExpense(
            @PathVariable String eventId,
            @RequestBody ExpenseRequest request,
            HttpSession session) {

        String currentUserId = getUserId(session);

        if (currentUserId == null) {
            return unauthorized();
        }

        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found"));
        }

        if (!canAccessEvent(event, currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You do not have access to this event"));
        }

        String description = request.getDescription();

        if (description == null || description.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Expense description is required"));
        }

        BigDecimal amount = request.getAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Expense amount must be greater than 0"));
        }

        String paidByUserId = request.getPaidByUserId();

        if (paidByUserId == null || paidByUserId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "A payer is required"));
        }

        List<String> participantUserIds = request.getParticipantUserIds();

        if (participantUserIds == null || participantUserIds.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "At least one expense participant is required"
                    ));
        }

        Set<String> eventMemberIds = getEventMemberIds(event);

        if (!eventMemberIds.contains(paidByUserId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "The payer must be an accepted member of the event"
                    ));
        }

        Set<String> uniqueParticipantIds =
                new HashSet<>(participantUserIds);

        if (!eventMemberIds.containsAll(uniqueParticipantIds)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "All expense participants must be accepted members of the event"
                    ));
        }

        for (String participantId : uniqueParticipantIds) {
            if (!userRepository.existsById(participantId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error",
                                "One or more expense participants do not exist"
                        ));
            }
        }

        if (!userRepository.existsById(paidByUserId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Payer does not exist"));
        }

        Expense expense = new Expense();

        expense.setEventId(eventId);
        expense.setDescription(description.trim());
        expense.setAmount(amount);
        expense.setPaidByUserId(paidByUserId);
        expense.setParticipantUserIds(
                new ArrayList<>(uniqueParticipantIds)
        );

        expense.prepareNewExpense(currentUserId);

        Expense savedExpense = expenseRepository.save(expense);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedExpense);
    }

    @DeleteMapping("/{expenseId}")
    @Transactional
    public ResponseEntity<?> deleteExpense(
            @PathVariable String expenseId,
            HttpSession session) {

        String currentUserId = getUserId(session);

        if (currentUserId == null) {
            return unauthorized();
        }

        Expense expense =
                expenseRepository.findById(expenseId).orElse(null);

        if (expense == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Expense not found"));
        }

        Event event =
                eventRepository.findById(expense.getEventId()).orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Event not found"));
        }

        boolean isHost =
                currentUserId.equals(event.getOwnerId());

        boolean createdExpense =
                currentUserId.equals(expense.getCreatedByUserId());

        if (!isHost && !createdExpense) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error",
                            "Only the host or expense creator can delete this expense"
                    ));
        }

        expenseRepository.delete(expense);

        return ResponseEntity.ok(
                Map.of("message", "Expense deleted successfully")
        );
    }

    private boolean canAccessEvent(
            Event event,
            String userId) {

        if (userId.equals(event.getOwnerId())) {
            return true;
        }

        return invitationRepository
                .findByEventIdAndReceiverId(event.getId(), userId)
                .map(invitation ->
                        "ACCEPTED".equalsIgnoreCase(
                                invitation.getStatus()
                        )
                )
                .orElse(false);
    }

    private Set<String> getEventMemberIds(Event event) {

        Set<String> memberIds = new HashSet<>();

        memberIds.add(event.getOwnerId());

        List<EventInvitation> invitations =
                invitationRepository.findByEventId(event.getId());

        for (EventInvitation invitation : invitations) {

            if ("ACCEPTED".equalsIgnoreCase(
                    invitation.getStatus())) {

                memberIds.add(invitation.getReceiverId());
            }
        }

        return memberIds;
    }

    private String getUserId(HttpSession session) {
        return (String) session.getAttribute("userId");
    }

   private ResponseEntity<Map<String, String>> unauthorized() {
    return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Not logged in"));
}
}