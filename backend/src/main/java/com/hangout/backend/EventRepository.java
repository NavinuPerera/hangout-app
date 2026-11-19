package com.hangout.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, String> {

    List<Event> findByOwnerId(String ownerId);

    Optional<Event> findByIdAndOwnerId(
            String id,
            String ownerId
    );
}