package com.ewsreference.app.command.storage;

import com.ewsreference.app.command.domain.CommandOperation;
import java.util.Optional;

public interface CommandOperationRepository {

    Optional<CommandOperation> findById(String operationId);

    CommandOperation save(CommandOperation operation);
}
