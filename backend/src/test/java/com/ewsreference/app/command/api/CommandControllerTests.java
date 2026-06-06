package com.ewsreference.app.command.api;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class CommandControllerTests {

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
    void submitCommandReturns202AndCompletesLater() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());

        MvcResult submitResult = mockMvc.perform(post("/api/work-items/wi-1/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.operationId").exists())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.workItemId").value("wi-1"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();
        JsonNode submitted = objectMapper.readTree(submitResult.getResponse().getContentAsString());
        String operationId = submitted.get("operationId").asText();

        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingOperation").value(operationId))
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 1));

        mockMvc.perform(get("/api/commands/" + operationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"));

        JsonNode completed = waitForCompletedOperation(operationId);

        mockMvc.perform(get("/api/commands/" + operationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.resultRevision").value(completed.get("resultRevision").asLong()))
                .andExpect(jsonPath("$.completedAt").exists());

        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"))
                .andExpect(jsonPath("$.pendingOperation").doesNotExist())
                .andExpect(jsonPath("$.revision").value(greaterThan(before.get("revision").asInt() + 1)));
    }

    @Test
    void submitCommandRejectsSecondCommandWhileWorkItemHasPendingOperation() throws Exception {
        MvcResult submitResult = mockMvc.perform(post("/api/work-items/wi-2/commands")
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

        mockMvc.perform(get("/api/work-items/wi-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingOperation").value(operationId));

        mockMvc.perform(post("/api/work-items/wi-2/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.field").value("pendingOperation"));
    }

    @Test
    void submitCommandUnknownWorkItemReturns404ApiError() throws Exception {
        mockMvc.perform(post("/api/work-items/missing/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": "complete"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("WORK_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.details.id").value("missing"));
    }

    @Test
    void submitCommandInvalidTypeReturns400ApiError() throws Exception {
        mockMvc.perform(post("/api/work-items/wi-2/commands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type": null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.field").value("type"));
    }

    @Test
    void getUnknownCommandReturns404ApiError() throws Exception {
        mockMvc.perform(get("/api/commands/op-missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMAND_NOT_FOUND"))
                .andExpect(jsonPath("$.details.operationId").value("op-missing"));
    }

    private JsonNode waitForCompletedOperation(String operationId) throws Exception {
        JsonNode current = null;
        for (int attempt = 0; attempt < 20; attempt++) {
            MvcResult result = mockMvc.perform(get("/api/commands/" + operationId))
                    .andExpect(status().isOk())
                    .andReturn();
            current = objectMapper.readTree(result.getResponse().getContentAsString());
            if ("completed".equals(current.get("status").asText())) {
                return current;
            }
            Thread.sleep(150);
        }
        throw new AssertionError("Command operation did not complete in time: " + operationId);
    }
}
