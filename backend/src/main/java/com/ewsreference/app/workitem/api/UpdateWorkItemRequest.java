package com.ewsreference.app.workitem.api;

import com.fasterxml.jackson.databind.JsonNode;

public record UpdateWorkItemRequest(
        JsonNode title,
        JsonNode status,
        JsonNode priority,
        JsonNode assignee,
        JsonNode tags
) {
}
