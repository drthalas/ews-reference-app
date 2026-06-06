package com.ewsreference.app.command.service;

import com.ewsreference.app.command.api.SubmitWorkItemCommandRequest;
import com.ewsreference.app.command.domain.CommandOperation;
import com.ewsreference.app.command.domain.CommandStatus;
import com.ewsreference.app.command.domain.CommandType;
import com.ewsreference.app.command.storage.CommandOperationRepository;
import com.ewsreference.app.devtools.service.DevFailureService;
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
    private final DevFailureService devFailureService;

    @Autowired
    public CommandService(
            CommandOperationRepository repository,
            WorkItemService workItemService,
            DevFailureService devFailureService
    ) {
        this(repository, workItemService, devFailureService, Clock.systemUTC());
    }

    CommandService(
            CommandOperationRepository repository,
            WorkItemService workItemService,
            DevFailureService devFailureService,
            Clock clock
    ) {
        this.repository = repository;
        this.workItemService = workItemService;
        this.devFailureService = devFailureService;
        this.clock = clock;
    }

    public CommandOperation submitWorkItemCommand(String workItemId, SubmitWorkItemCommandRequest request) {
        CommandType type = parseType(request);
        if (type != CommandType.COMPLETE) {
            throw validation("type", "Command type must be complete.");
        }

        String operationId = "op-" + operationSequence.getAndIncrement();
        workItemService.markPendingOperation(workItemId, operationId);
        boolean failOnCompletion = devFailureService.consumeFailNextCommand();
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
                () -> completeWorkItemCommand(operationId, failOnCompletion),
                COMPLETION_DELAY.toMillis(),
                TimeUnit.MILLISECONDS
        );
        return operation;
    }

    public CommandOperation get(String operationId) {
        return repository.findById(operationId)
                .orElseThrow(() -> new CommandNotFoundException(operationId));
    }

    public void reset() {
        repository.reset();
        operationSequence.set(1);
    }

    private void completeWorkItemCommand(String operationId, boolean failOnCompletion) {
        CommandOperation operation = get(operationId);
        if (operation.status() != CommandStatus.PENDING) {
            return;
        }

        try {
            if (failOnCompletion) {
                workItemService.clearPendingOperation(operation.workItemId(), operationId);
                repository.save(new CommandOperation(
                        operation.operationId(),
                        CommandStatus.FAILED,
                        operation.workItemId(),
                        null,
                        "DEV_FORCED_COMMAND_FAILURE: DEV forced failure for async command completion.",
                        operation.createdAt(),
                        Instant.now(clock)
                ));
                return;
            }

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
