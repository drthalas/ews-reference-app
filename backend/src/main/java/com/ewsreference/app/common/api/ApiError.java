package com.ewsreference.app.common.api;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message
) {
}
