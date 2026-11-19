package com.hangout.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository
        extends JpaRepository<FriendRequest, String> {

    List<FriendRequest> findByReceiverIdAndStatus(
            String receiverId,
            String status
    );

    List<FriendRequest> findBySenderIdAndStatus(
            String senderId,
            String status
    );

    List<FriendRequest> findBySenderIdOrReceiverId(
            String senderId,
            String receiverId
    );

    Optional<FriendRequest> findBySenderIdAndReceiverIdAndStatus(
            String senderId,
            String receiverId,
            String status
    );
}