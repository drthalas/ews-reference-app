package com.ewsreference.app.command.storage;

import com.ewsreference.app.command.domain.CommandOperation;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryCommandOperationRepository implements CommandOperationRepository {

    private final ConcurrentHashMap<String, CommandOperation> operations = new ConcurrentHashMap<>();

    @Override
    public Optional<CommandOperation> findById(String operationId) {
        return Optional.ofNullable(operations.get(operationId));
    }

    @Override
    public CommandOperation save(CommandOperation operation) {
        operations.put(operation.operationId(), operation);
        return operation;
    }
}
