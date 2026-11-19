package com.hangout.backend;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/friends")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class FriendController {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;

    public FriendController(
            UserRepository userRepository,
            FriendRequestRepository friendRequestRepository) {

        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
    }

    // ==========================================
    // SEARCH USERS
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam String query,
            HttpSession session) {

        String currentUserId = getUserId(session);

        if (currentUserId == null) {
            return unauthorized();
        }

        String cleanedQuery = query.trim();

        if (cleanedQuery.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users =
                userRepository
                        .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                                cleanedQuery,
                                cleanedQuery
                        );

        List<Map<String, Object>> results =
                new ArrayList<>();

        for (User user : users) {

            if (user.getId().equals(currentUserId)) {
                continue;
            }

            results.add(safeUser(user));
        }

        return ResponseEntity.ok(results);
    }

    // ==========================================
    // SEND FRIEND REQUEST
    // ==========================================

    @PostMapping("/requests")
    public ResponseEntity<?> sendFriendRequest(
            @RequestBody FriendRequestBody request,
            HttpSession session) {

        String senderId = getUserId(session);

        if (senderId == null) {
            return unauthorized();
        }

        if (request.getReceiverId() == null ||
                request.getReceiverId().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            "Receiver is required"
                    ));
        }

        String receiverId =
                request.getReceiverId().trim();

        if (senderId.equals(receiverId)) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            "Cannot send a friend request to yourself"
                    ));
        }

        if (!userRepository.existsById(receiverId)) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "User not found"
                    ));
        }

        if (relationshipExists(senderId, receiverId)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "A friend request or friendship already exists"
                    ));
        }

        FriendRequest friendRequest =
                new FriendRequest();

        friendRequest.setSenderId(senderId);
        friendRequest.setReceiverId(receiverId);
        friendRequest.prepareNewRequest();

        FriendRequest savedRequest =
                friendRequestRepository.save(friendRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedRequest);
    }

    // ==========================================
    // INCOMING REQUESTS
    // ==========================================

    @GetMapping("/requests/incoming")
    public ResponseEntity<?> getIncomingRequests(
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        List<FriendRequest> requests =
                friendRequestRepository
                        .findByReceiverIdAndStatus(
                                userId,
                                "PENDING"
                        );

        List<Map<String, Object>> response =
                new ArrayList<>();

        for (FriendRequest request : requests) {

            User sender = userRepository
                    .findById(request.getSenderId())
                    .orElse(null);

            if (sender == null) {
                continue;
            }

            Map<String, Object> item =
                    new HashMap<>();

            item.put("requestId", request.getId());
            item.put("createdAt", request.getCreatedAt());
            item.put("user", safeUser(sender));

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // OUTGOING REQUESTS
    // ==========================================

    @GetMapping("/requests/outgoing")
    public ResponseEntity<?> getOutgoingRequests(
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        List<FriendRequest> requests =
                friendRequestRepository
                        .findBySenderIdAndStatus(
                                userId,
                                "PENDING"
                        );

        List<Map<String, Object>> response =
                new ArrayList<>();

        for (FriendRequest request : requests) {

            User receiver = userRepository
                    .findById(request.getReceiverId())
                    .orElse(null);

            if (receiver == null) {
                continue;
            }

            Map<String, Object> item =
                    new HashMap<>();

            item.put("requestId", request.getId());
            item.put("createdAt", request.getCreatedAt());
            item.put("user", safeUser(receiver));

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // ACCEPT REQUEST
    // ==========================================

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<?> acceptFriendRequest(
            @PathVariable String requestId,
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        FriendRequest request =
                friendRequestRepository
                        .findById(requestId)
                        .orElse(null);

        if (request == null ||
                !request.getReceiverId().equals(userId) ||
                !"PENDING".equals(request.getStatus())) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "Friend request not found"
                    ));
        }

        request.setStatus("ACCEPTED");
        friendRequestRepository.save(request);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Friend request accepted"
                )
        );
    }

    // ==========================================
    // REJECT REQUEST
    // ==========================================

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(
            @PathVariable String requestId,
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        FriendRequest request =
                friendRequestRepository
                        .findById(requestId)
                        .orElse(null);

        if (request == null ||
                !request.getReceiverId().equals(userId) ||
                !"PENDING".equals(request.getStatus())) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            "Friend request not found"
                    ));
        }

        request.setStatus("REJECTED");
        friendRequestRepository.save(request);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Friend request rejected"
                )
        );
    }

    // ==========================================
    // GET FRIENDS
    // ==========================================

    @GetMapping
    public ResponseEntity<?> getFriends(
            HttpSession session) {

        String userId = getUserId(session);

        if (userId == null) {
            return unauthorized();
        }

        List<FriendRequest> relationships =
                friendRequestRepository
                        .findBySenderIdOrReceiverId(
                                userId,
                                userId
                        );

        List<Map<String, Object>> friends =
                new ArrayList<>();

        for (FriendRequest relationship : relationships) {

            if (!"ACCEPTED".equals(
                    relationship.getStatus())) {
                continue;
            }

            String friendId;

            if (relationship
                    .getSenderId()
                    .equals(userId)) {

                friendId = relationship.getReceiverId();

            } else {

                friendId = relationship.getSenderId();
            }

            User friend = userRepository
                    .findById(friendId)
                    .orElse(null);

            if (friend != null) {
                friends.add(safeUser(friend));
            }
        }

        return ResponseEntity.ok(friends);
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private boolean relationshipExists(
            String firstUserId,
            String secondUserId) {

        List<FriendRequest> relationships =
                friendRequestRepository
                        .findBySenderIdOrReceiverId(
                                firstUserId,
                                firstUserId
                        );

        for (FriendRequest relationship : relationships) {

            boolean sameDirection =
                    relationship.getSenderId()
                            .equals(firstUserId)
                            &&
                    relationship.getReceiverId()
                            .equals(secondUserId);

            boolean oppositeDirection =
                    relationship.getSenderId()
                            .equals(secondUserId)
                            &&
                    relationship.getReceiverId()
                            .equals(firstUserId);

            if ((sameDirection || oppositeDirection)
                    &&
                    !"REJECTED".equals(
                            relationship.getStatus())) {

                return true;
            }
        }

        return false;
    }

    private Map<String, Object> safeUser(
            User user) {

        Map<String, Object> response =
                new HashMap<>();

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());

        return response;
    }

    private String getUserId(
            HttpSession session) {

        return (String)
                session.getAttribute("userId");
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