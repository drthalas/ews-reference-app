package com.ewsreference.app.command.api;

import com.ewsreference.app.command.domain.CommandOperation;
import com.ewsreference.app.command.domain.CommandStatus;
import java.time.Instant;

public record CommandOperationDto(
        String operationId,
        CommandStatus status,
        String workItemId,
        Long resultRevision,
        String error,
        Instant createdAt,
        Instant completedAt
) {
    public static CommandOperationDto fromDomain(CommandOperation operation) {
        return new CommandOperationDto(
                operation.operationId(),
                operation.status(),
                operation.workItemId(),
                operation.resultRevision(),
                operation.error(),
                operation.createdAt(),
                operation.completedAt()
        );
    }
}
