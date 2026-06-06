package com.ewsreference.app.command.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CommandStatus {
    PENDING("pending"),
    COMPLETED("completed"),
    FAILED("failed");

    private final String value;

    CommandStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static CommandStatus fromValue(String value) {
        for (CommandStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown command status: " + value);
    }
}
