package com.ewsreference.app.devtools.service;

import java.util.Map;

public class DevConflictException extends RuntimeException {

    private final Map<String, Object> details;

    public DevConflictException(String workItemId, long serverRevision) {
        super("DEV conflict was triggered for the next WorkItem PATCH request.");
        this.details = Map.of(
                "workItemId", workItemId,
                "clientRevision", serverRevision - 1,
                "serverRevision", serverRevision
        );
    }

    public Map<String, Object> details() {
        return details;
    }
}
