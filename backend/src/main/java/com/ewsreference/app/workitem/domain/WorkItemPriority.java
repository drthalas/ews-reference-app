package com.ewsreference.app.workitem.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum WorkItemPriority {
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high"),
    CRITICAL("critical");

    private final String value;

    WorkItemPriority(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static WorkItemPriority fromValue(String value) {
        return Arrays.stream(values())
                .filter(priority -> priority.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown WorkItem priority: " + value));
    }
}
