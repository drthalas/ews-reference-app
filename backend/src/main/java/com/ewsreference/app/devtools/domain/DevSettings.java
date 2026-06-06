package com.ewsreference.app.devtools.domain;

import java.time.Instant;

public record DevSettings(
        int responseDelayMs,
        boolean failNextRequest,
        boolean failNextCommand,
        boolean staleResponseMode,
        boolean conflictMode,
        Instant lastResetAt,
        String lastDevAction
) {
}
