package com.hangout.backend;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.util.List;

@Entity
@Table(name = "events")
public class Event {

    @Id
    private String id;

    private String name;
    private String date;
    private String time;

    @ElementCollection
    @CollectionTable(
            name = "event_friends",
            joinColumns = @JoinColumn(name = "event_id")
    )
    @Column(name = "friend_name")
    private List<String> friends;

    public Event() {
    }

    public Event(
            String id,
            String name,
            String date,
            String time,
            List<String> friends) {

        this.id = id;
        this.name = name;
        this.date = date;
        this.time = time;
        this.friends = friends;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public List<String> getFriends() {
        return friends;
    }

    public void setFriends(List<String> friends) {
        this.friends = friends;
    }
}