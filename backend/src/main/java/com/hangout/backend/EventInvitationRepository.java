package com.hangout.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventInvitationRepository
        extends JpaRepository<EventInvitation, String> {

    List<EventInvitation> findByReceiverId(String receiverId);

    List<EventInvitation> findBySenderId(String senderId);

    List<EventInvitation> findByEventId(String eventId);

    List<EventInvitation> findByReceiverIdAndStatus(
            String receiverId,
            String status
    );

    Optional<EventInvitation> findByEventIdAndReceiverId(
            String eventId,
            String receiverId
    );

    void deleteByEventId(String eventId);
}