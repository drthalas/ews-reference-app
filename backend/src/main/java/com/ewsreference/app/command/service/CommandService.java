package com.ewsreference.app.command.service;

import com.ewsreference.app.command.api.SubmitWorkItemCommandRequest;
import com.ewsreference.app.command.domain.CommandOperation;
import com.ewsreference.app.command.domain.CommandStatus;
import com.ewsreference.app.command.domain.CommandType;
import com.ewsreference.app.command.storage.CommandOperationRepository;
import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.service.ValidationException;
import com.ewsreference.app.workitem.service.WorkItemService;
import jakarta.annotation.PreDestroy;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CommandService {

    private static final Duration COMPLETION_DELAY = Duration.ofMillis(1200);

    private final AtomicLong operationSequence = new AtomicLong(1);
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
    private final Clock clock;
    private final CommandOperationRepository repository;
    private final WorkItemService workItemService;

    @Autowired
    public CommandService(CommandOperationRepository repository, WorkItemService workItemService) {
        this(repository, workItemService, Clock.systemUTC());
    }

    CommandService(CommandOperationRepository repository, WorkItemService workItemService, Clock clock) {
        this.repository = repository;
        this.workItemService = workItemService;
        this.clock = clock;
    }

    public CommandOperation submitWorkItemCommand(String workItemId, SubmitWorkItemCommandRequest request) {
        CommandType type = parseType(request);
        if (type != CommandType.COMPLETE) {
            throw validation("type", "Command type must be complete.");
        }

        workItemService.get(workItemId);
        String operationId = "op-" + operationSequence.getAndIncrement();
        workItemService.markPendingOperation(workItemId, operationId);
        CommandOperation operation = repository.save(new CommandOperation(
                operationId,
                CommandStatus.PENDING,
                workItemId,
                null,
                null,
                Instant.now(clock),
                null
        ));

        executor.schedule(
                () -> completeWorkItemCommand(operationId),
                COMPLETION_DELAY.toMillis(),
                TimeUnit.MILLISECONDS
        );
        return operation;
    }

    public CommandOperation get(String operationId) {
        return repository.findById(operationId)
                .orElseThrow(() -> new CommandNotFoundException(operationId));
    }

    private void completeWorkItemCommand(String operationId) {
        CommandOperation operation = get(operationId);
        if (operation.status() != CommandStatus.PENDING) {
            return;
        }

        try {
            WorkItem updated = workItemService.completePendingOperation(operation.workItemId(), operationId);
            repository.save(new CommandOperation(
                    operation.operationId(),
                    CommandStatus.COMPLETED,
                    operation.workItemId(),
                    updated.revision(),
                    null,
                    operation.createdAt(),
                    Instant.now(clock)
            ));
        } catch (RuntimeException exception) {
            repository.save(new CommandOperation(
                    operation.operationId(),
                    CommandStatus.FAILED,
                    operation.workItemId(),
                    null,
                    exception.getMessage(),
                    operation.createdAt(),
                    Instant.now(clock)
            ));
        }
    }

    private CommandType parseType(SubmitWorkItemCommandRequest request) {
        if (request == null || request.type() == null || request.type().isBlank()) {
            throw validation("type", "Command type must be complete.");
        }
        try {
            return CommandType.fromValue(request.type());
        } catch (IllegalArgumentException exception) {
            throw validation("type", "Command type must be complete.");
        }
    }

    private ValidationException validation(String field, String message) {
        return new ValidationException("Command validation failed.", Map.of("field", field, "message", message));
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }
}
