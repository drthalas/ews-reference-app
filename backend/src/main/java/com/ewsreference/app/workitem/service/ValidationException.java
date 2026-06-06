package com.ewsreference.app.workitem.service;

import java.util.Map;

public class ValidationException extends RuntimeException {

    private final Map<String, Object> details;

    public ValidationException(String message, Map<String, Object> details) {
        super(message);
        this.details = Map.copyOf(details);
    }

    public Map<String, Object> details() {
        return details;
    }
}
