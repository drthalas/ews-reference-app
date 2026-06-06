package com.ewsreference.app.devtools.api;

public record UpdateDevSettingsRequest(
        Integer responseDelayMs,
        Boolean staleResponseMode,
        Boolean conflictMode
) {
}
