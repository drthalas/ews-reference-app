package com.ewsreference.app.devtools.service;

import java.util.Map;

public class DevForcedFailureException extends RuntimeException {

    private final Map<String, Object> details;

    public DevForcedFailureException(String workItemId) {
        super("DEV forced failure for the next WorkItem PATCH request.");
        this.details = Map.of("workItemId", workItemId);
    }

    public Map<String, Object> details() {
        return details;
    }
}
