package com.ewsreference.app.command.api;

import com.ewsreference.app.command.service.CommandService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/commands")
public class CommandController {

    private final CommandService service;

    public CommandController(CommandService service) {
        this.service = service;
    }

    @GetMapping("/{operationId}")
    @Operation(summary = "Get command status", description = "Returns command status by operation id.")
    public CommandOperationDto getCommand(@PathVariable String operationId) {
        return CommandOperationDto.fromDomain(service.get(operationId));
    }
}
