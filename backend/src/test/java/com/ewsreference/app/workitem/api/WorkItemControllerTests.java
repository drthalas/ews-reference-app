package com.ewsreference.app.workitem.api;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class WorkItemControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listReturnsSeededWorkItems() throws Exception {
        mockMvc.perform(get("/api/work-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].id").value("wi-1"))
                .andExpect(jsonPath("$[0].title").value("Review intake"))
                .andExpect(jsonPath("$[1].id").value("wi-2"))
                .andExpect(jsonPath("$[2].id").value("wi-3"))
                .andExpect(jsonPath("$[3].id").value("wi-4"));
    }

    @Test
    void getReturnsWorkItemById() throws Exception {
        mockMvc.perform(get("/api/work-items/wi-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("wi-1"))
                .andExpect(jsonPath("$.title").value("Review intake"))
                .andExpect(jsonPath("$.status").value("new"))
                .andExpect(jsonPath("$.priority").value("medium"))
                .andExpect(jsonPath("$.assignee").value("Alex"))
                .andExpect(jsonPath("$.tags", contains("intake", "backend")))
                .andExpect(jsonPath("$.revision").value(1))
                .andExpect(jsonPath("$.updatedAt").value("2026-06-06T00:00:00Z"));
    }

    @Test
    void getUnknownIdReturns404ApiError() throws Exception {
        mockMvc.perform(get("/api/work-items/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("WORK_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("WorkItem was not found."))
                .andExpect(jsonPath("$.details.id").value("missing"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void patchUpdatesAllowedFields() throws Exception {
        mockMvc.perform(patch("/api/work-items/wi-2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prepare backend validation",
                                  "status": "blocked",
                                  "priority": "critical",
                                  "assignee": null,
                                  "tags": ["backend", "validation"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("wi-2"))
                .andExpect(jsonPath("$.title").value("Prepare backend validation"))
                .andExpect(jsonPath("$.status").value("blocked"))
                .andExpect(jsonPath("$.priority").value("critical"))
                .andExpect(jsonPath("$.assignee").doesNotExist())
                .andExpect(jsonPath("$.tags", contains("backend", "validation")));
    }

    @Test
    void patchIncrementsRevisionAndUpdatesTimestampOnActualChange() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-4"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());

        mockMvc.perform(patch("/api/work-items/wi-4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "in_progress"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong() + 1))
                .andExpect(jsonPath("$.updatedAt").value(greaterThan(before.get("updatedAt").asText())));
    }

    @Test
    void patchNoOpDoesNotIncrementRevision() throws Exception {
        MvcResult beforeResult = mockMvc.perform(get("/api/work-items/wi-3"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode before = objectMapper.readTree(beforeResult.getResponse().getContentAsString());

        mockMvc.perform(patch("/api/work-items/wi-3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "blocked"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(before.get("revision").asLong()))
                .andExpect(jsonPath("$.updatedAt").value(before.get("updatedAt").asText()));
    }

    @Test
    void patchInvalidTitleReturns400ApiError() throws Exception {
        mockMvc.perform(patch("/api/work-items/wi-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "   "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.field").value("title"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void patchInvalidTagsReturns400ApiError() throws Exception {
        mockMvc.perform(patch("/api/work-items/wi-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tags": ["backend", null]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details.field").value("tags"));
    }

    @Test
    void patchUnknownIdReturns404ApiError() throws Exception {
        mockMvc.perform(patch("/api/work-items/missing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "done"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("WORK_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.details.id").value("missing"));
    }
}
