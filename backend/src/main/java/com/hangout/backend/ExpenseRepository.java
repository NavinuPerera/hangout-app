package com.hangout.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {

    List<Expense> findByEventIdOrderByCreatedAtDesc(String eventId);

    void deleteByEventId(String eventId);
}