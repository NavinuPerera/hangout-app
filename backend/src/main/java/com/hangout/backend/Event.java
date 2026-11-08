package com.hangout.backend;

import java.util.List;

public class Event {

    private String id;
    private String name;
    private String date;
    private String time;
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