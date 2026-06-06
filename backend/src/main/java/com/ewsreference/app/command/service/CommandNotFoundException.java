package com.ewsreference.app.command.service;

public class CommandNotFoundException extends RuntimeException {

    private final String operationId;

    public CommandNotFoundException(String operationId) {
        super("Command operation was not found.");
        this.operationId = operationId;
    }

    public String operationId() {
        return operationId;
    }
}
