package com.ewsreference.app.workitem.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum WorkItemStatus {
    NEW("new"),
    IN_PROGRESS("in_progress"),
    BLOCKED("blocked"),
    DONE("done");

    private final String value;

    WorkItemStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static WorkItemStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status -> status.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown WorkItem status: " + value));
    }
}
