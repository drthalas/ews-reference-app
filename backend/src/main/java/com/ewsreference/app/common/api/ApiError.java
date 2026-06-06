package com.ewsreference.app.common.api;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        int status,
        String code,
        String message,
        Map<String, Object> details,
        Instant timestamp
) {
}
