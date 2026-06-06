package com.ewsreference.app.devtools.api;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.lessThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DevWorkItemControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void resetState() throws Exception {
        mockMvc.perform(post("/api/dev/reset"))
                .andExpect(status().isOk());
    }

    @Test
    void getAndUpdateDevSettings() throws Exception {
        mockMvc.perform(get("/api/dev/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseDelayMs").value(0))
                .andExpect(jsonPath("$.failNextRequest").value(false))
                .andExpect(jsonPath("$.failNextCommand").value(false))
                .andExpect(jsonPath("$.staleResponseMode").value(false))
                .andExpect(jsonPath("$.conflictMode").value(false))
                .andExpect(jsonPath("$.lastResetAt").exists());

        mockMvc.perform(put("/api/dev/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "responseDelayMs": 500,
                                  "staleResponseMode": true,
                                  "conflictMode": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseDelayMs").value(500))
                .andExpect(jsonPath("$.staleResponseMode").value(true))
                .andExpect(jsonPath("$.conflictMode").value(true));
    }

    @Test
    void updateDevSettingsRejectsInvalidResponseDelay() throws Exception {
        mockMvc.perform(put("/api/dev/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "responseDelayMs": 6000
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.field").value("responseDelayMs"))
                .andExpect(jsonPath("$.details.max").value(5000));
    }

    @Test
    void resetRestoresSeedDataAndClearsCommandOperations() throws Exception {
        MvcResult submitResult = mockMvc.perform(post("/api/work-items/wi-1/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andReturn();
        String operationId = objectMapper.readTree(submitResult.getResponse().getContentAsString())
                .get("operationId")
                .asText();

        mockMvc.perform(post("/api/dev/work-items/wi-1/external-change"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(greaterThan(1)));

        mockMvc.perform(post("/api/dev/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseDelayMs").value(0))
                .andExpect(jsonPath("$.failNextRequest").value(false))
                .andExpect(jsonPath("$.failNextCommand").value(false));

        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Review intake"))
                .andExpect(jsonPath("$.status").value("new"))
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.pendingOperation").doesNotExist());

        mockMvc.perform(get("/api/commands/" + operationId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMAND_NOT_FOUND"));
    }

    @Test
    void externalChangeUnknownIdReturns404ApiError() throws Exception {
        mockMvc.perform(post("/api/dev/work-items/missing/external-change"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("WORK_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.details.id").value("missing"));
    }

    @Test
    void externalChangeUpdatesExistingWorkItemDeterministically() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());
        String expectedStatus = before.get("status").asText().equals("blocked") ? "in_progress" : "blocked";

        mockMvc.perform(post("/api/dev/work-items/wi-1/external-change"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("wi-1"))
                .andExpect(jsonPath("$.status").value(expectedStatus))
                .andExpect(jsonPath("$.tags", hasItem("external-change")))
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 1))
                .andExpect(jsonPath("$.updatedAt").value(greaterThan(before.get("updatedAt").asText())));
    }

    @Test
    void failNextRequestForcesOnePatchFailureAndThenResets() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-2"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());
        String firstStatus = before.get("status").asText().equals("done") ? "in_progress" : "done";
        String secondStatus = firstStatus.equals("blocked") ? "in_progress" : "blocked";

        mockMvc.perform(post("/api/dev/fail-next-request"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failNextRequest").value(true));

        mockMvc.perform(patch("/api/work-items/wi-2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "%s"
                                }
                                """.formatted(firstStatus)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.code").value("DEV_FORCED_FAILURE"))
                .andExpect(jsonPath("$.details.workItemId").value("wi-2"));

        mockMvc.perform(patch("/api/work-items/wi-2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "%s"
                                }
                                """.formatted(firstStatus)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(firstStatus))
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 1))
                .andExpect(jsonPath("$.updatedAt").value(greaterThan(before.get("updatedAt").asText())));

        mockMvc.perform(patch("/api/work-items/wi-2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "%s"
                                }
                                """.formatted(secondStatus)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(secondStatus))
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 2));
    }

    @Test
    void failNextCommandMakesOneAcceptedCommandCompleteAsFailed() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());

        mockMvc.perform(post("/api/dev/fail-next-command"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failNextCommand").value(true));

        MvcResult submitResult = mockMvc.perform(post("/api/work-items/wi-1/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("pending"))
                .andReturn();
        String operationId = objectMapper.readTree(submitResult.getResponse().getContentAsString())
                .get("operationId")
                .asText();

        JsonNode failed = waitForOperationStatus(operationId, "failed");

        mockMvc.perform(get("/api/commands/" + operationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("failed"))
                .andExpect(jsonPath("$.error", containsString("DEV_FORCED_COMMAND_FAILURE")))
                .andExpect(jsonPath("$.completedAt").value(failed.get("completedAt").asText()));

        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(before.get("status").asText()))
                .andExpect(jsonPath("$.pendingOperation").doesNotExist())
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 2));

        mockMvc.perform(post("/api/work-items/wi-2/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    void triggerConflictMakesNextPatchReturn409AndThenResets() throws Exception {
        mockMvc.perform(post("/api/dev/trigger-conflict"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conflictMode").value(true));

        mockMvc.perform(patch("/api/work-items/wi-3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "done"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEV_CONFLICT"))
                .andExpect(jsonPath("$.details.workItemId").value("wi-3"))
                .andExpect(jsonPath("$.details.serverRevision").value(1))
                .andExpect(jsonPath("$.details.clientRevision").value(0))
                .andExpect(jsonPath("$.details.serverWorkItem.id").value("wi-3"))
                .andExpect(jsonPath("$.details.serverWorkItem.title").value("Confirm error contract"))
                .andExpect(jsonPath("$.details.serverWorkItem.status").value("blocked"))
                .andExpect(jsonPath("$.details.serverWorkItem.revision").value(1));

        mockMvc.perform(patch("/api/work-items/wi-3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "done"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"))
                .andExpect(jsonPath("$.revision").value(2));
    }

    @Test
    void triggerStaleResponseReturnsOneOlderReadResponse() throws Exception {
        MvcResult changedResult = mockMvc.perform(post("/api/dev/work-items/wi-4/external-change"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(2))
                .andReturn();
        JsonNode changed = objectMapper.readTree(changedResult.getResponse().getContentAsString());

        mockMvc.perform(post("/api/dev/trigger-stale-response"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staleResponseMode").value(true));

        mockMvc.perform(get("/api/work-items/wi-4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.updatedAt").value(lessThan(changed.get("updatedAt").asText())));

        mockMvc.perform(get("/api/work-items/wi-4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(2));
    }

    @Test
    void triggerStaleResponseCanAffectNextListResponse() throws Exception {
        mockMvc.perform(post("/api/dev/work-items/wi-1/external-change"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(2));

        mockMvc.perform(post("/api/dev/trigger-stale-response"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/work-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("wi-1"))
                .andExpect(jsonPath("$[0].revision").value(1));

        mockMvc.perform(get("/api/work-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("wi-1"))
                .andExpect(jsonPath("$[0].revision").value(2));
    }

    @Test
    void resetClearsConflictAndStaleTriggers() throws Exception {
        mockMvc.perform(post("/api/dev/trigger-conflict"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/dev/trigger-stale-response"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/dev/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conflictMode").value(false))
                .andExpect(jsonPath("$.staleResponseMode").value(false));

        mockMvc.perform(patch("/api/work-items/wi-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "done"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(2));
    }

    private JsonNode waitForOperationStatus(String operationId, String expectedStatus) throws Exception {
        JsonNode current = null;
        for (int attempt = 0; attempt < 20; attempt++) {
            MvcResult result = mockMvc.perform(get("/api/commands/" + operationId))
                    .andExpect(status().isOk())
                    .andReturn();
            current = objectMapper.readTree(result.getResponse().getContentAsString());
            if (expectedStatus.equals(current.get("status").asText())) {
                return current;
            }
            Thread.sleep(150);
        }
        throw new AssertionError("Command operation did not reach status %s in time: %s"
                .formatted(expectedStatus, operationId));
    }
}
