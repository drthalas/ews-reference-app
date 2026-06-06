package com.ewsreference.app.devtools.service;

import java.util.Map;

public class DevSettingsValidationException extends RuntimeException {

    private final Map<String, Object> details;

    public DevSettingsValidationException(Map<String, Object> details) {
        super("DEV settings validation failed.");
        this.details = details;
    }

    public Map<String, Object> details() {
        return details;
    }
}
