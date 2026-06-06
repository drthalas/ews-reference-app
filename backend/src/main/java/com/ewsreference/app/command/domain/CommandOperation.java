package com.ewsreference.app.command.domain;

import java.time.Instant;

public record CommandOperation(
        String operationId,
        CommandStatus status,
        String workItemId,
        Long resultRevision,
        String error,
        Instant createdAt,
        Instant completedAt
) {
}
