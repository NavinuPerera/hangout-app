package com.hangout.backend;

import java.math.BigDecimal;
import java.util.List;

public class ExpenseRequest {

    private String description;
    private BigDecimal amount;
    private String paidByUserId;
    private List<String> participantUserIds;

    public ExpenseRequest() {
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaidByUserId() {
        return paidByUserId;
    }

    public void setPaidByUserId(String paidByUserId) {
        this.paidByUserId = paidByUserId;
    }

    public List<String> getParticipantUserIds() {
        return participantUserIds;
    }

    public void setParticipantUserIds(List<String> participantUserIds) {
        this.participantUserIds = participantUserIds;
    }
}