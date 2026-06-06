package com.ewsreference.app.devtools.api;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class DevWorkItemControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
}
