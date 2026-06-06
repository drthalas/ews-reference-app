package com.ewsreference.app.common.api;

import com.ewsreference.app.command.service.CommandNotFoundException;
import com.ewsreference.app.devtools.service.DevForcedFailureException;
import com.ewsreference.app.workitem.service.ValidationException;
import com.ewsreference.app.workitem.service.WorkItemNotFoundException;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(WorkItemNotFoundException.class)
    public ResponseEntity<ApiError> handleWorkItemNotFound(WorkItemNotFoundException exception) {
        return error(
                HttpStatus.NOT_FOUND,
                "WORK_ITEM_NOT_FOUND",
                exception.getMessage(),
                Map.of("id", exception.id())
        );
    }

    @ExceptionHandler(CommandNotFoundException.class)
    public ResponseEntity<ApiError> handleCommandNotFound(CommandNotFoundException exception) {
        return error(
                HttpStatus.NOT_FOUND,
                "COMMAND_NOT_FOUND",
                exception.getMessage(),
                Map.of("operationId", exception.operationId())
        );
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> handleValidation(ValidationException exception) {
        return error(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                exception.getMessage(),
                exception.details()
        );
    }

    @ExceptionHandler(DevForcedFailureException.class)
    public ResponseEntity<ApiError> handleDevForcedFailure(DevForcedFailureException exception) {
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "DEV_FORCED_FAILURE",
                exception.getMessage(),
                exception.details()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An internal backend error occurred.",
                Map.of("exception", exception.getClass().getSimpleName())
        );
    }

    private ResponseEntity<ApiError> error(
            HttpStatus status,
            String code,
            String message,
            Map<String, Object> details
    ) {
        return ResponseEntity
                .status(status)
                .body(new ApiError(status.value(), code, message, details, Instant.now()));
    }
}
