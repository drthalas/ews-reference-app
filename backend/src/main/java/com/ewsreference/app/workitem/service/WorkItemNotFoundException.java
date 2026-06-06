package com.ewsreference.app.workitem.service;

public class WorkItemNotFoundException extends RuntimeException {

    private final String id;

    public WorkItemNotFoundException(String id) {
        super("WorkItem was not found.");
        this.id = id;
    }

    public String id() {
        return id;
    }
}
