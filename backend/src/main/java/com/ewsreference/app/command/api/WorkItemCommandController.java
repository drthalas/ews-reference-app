package com.ewsreference.app.command.api;

import com.ewsreference.app.command.service.CommandService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-items")
public class WorkItemCommandController {

    private final CommandService service;

    public WorkItemCommandController(CommandService service) {
        this.service = service;
    }

    @PostMapping("/{id}/commands")
    @Operation(
            summary = "Submit a WorkItem command",
            description = "Accepts a WorkItem command and returns a pending operation id."
    )
    public ResponseEntity<CommandOperationDto> submitCommand(
            @PathVariable String id,
            @RequestBody SubmitWorkItemCommandRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(CommandOperationDto.fromDomain(service.submitWorkItemCommand(id, request)));
    }
}
