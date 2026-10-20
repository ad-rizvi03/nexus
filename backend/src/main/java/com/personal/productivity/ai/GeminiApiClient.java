package com.personal.productivity.ai;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Component
public class GeminiApiClient {
    private static final Logger log = LoggerFactory.getLogger(GeminiApiClient.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String configuredApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    public GeminiApiClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean hasApiKey(String overrideKey) {
        if (overrideKey != null && !overrideKey.trim().isEmpty()) {
            return true;
        }
        return configuredApiKey != null && !configuredApiKey.trim().isEmpty();
    }

    public Optional<AiResponse> queryGemini(String prompt, String subject, String contextType, String overrideKey) {
        String activeKey = (overrideKey != null && !overrideKey.trim().isEmpty()) ? overrideKey.trim() : configuredApiKey;
        if (activeKey == null || activeKey.trim().isEmpty()) {
            return Optional.empty();
        }

        List<String> candidateModels = new ArrayList<>();
        if (modelName != null && !modelName.trim().isEmpty()) {
            candidateModels.add(modelName.trim());
        }
        if (!candidateModels.contains("gemini-3.5-flash-lite")) {
            candidateModels.add("gemini-3.5-flash-lite");
        }
        if (!candidateModels.contains("gemini-3.8-flash")) {
            candidateModels.add("gemini-3.8-flash");
        }
        if (!candidateModels.contains("gemini-flash-latest")) {
            candidateModels.add("gemini-flash-latest");
        }

        String systemInstruction = """
            You are an expert technical advisor, productivity copilot, and curriculum designer in Nexus Workspace.
            The user is actively searching for guidance, time estimates, and learning resources for their work.
            
            CRITICAL INSTRUCTIONS:
            1. Dynamically tailor your answer and recommendations specifically to the user's EXACT query and subject topic. Do not output generic boilerplate.
            2. For time estimation:
               - If the context relates to a TASK: provide realistic hands-on minutes in "estimatedDurationMinutes" (e.g. 30, 45, 90, 180) and 3-6 actionable step-by-step checklist items in "suggestedSubtasks".
               - If the context relates to a ROADMAP / COURSE / TECHNOLOGY: provide total realistic mastery hours in "estimatedStudyHours" (e.g. 15.0, 30.0, 60.0) and 3-5 structured curriculum modules in "suggestedModules" each with real topics and hours.
            3. Curate 3 to 5 of the absolute BEST, high-reputation, real YouTube video courses and tutorials for this topic:
               - "title": Specific real video title (e.g. "Kubernetes Tutorial for Beginners [Full Course in 4 Hours]")
               - "channel": Real channel/creator name (e.g. "TechWorld with Nana", "freeCodeCamp.org", "Traversy Media", "Hussein Nasser", "Fireship", "Kunal Kushwaha", "NeetCode", "ByteByteGo")
               - "url": Valid YouTube URL. You can use direct links or search URLs formatted as: "https://www.youtube.com/results?search_query=" followed by URL-encoded title and channel.
               - "description": Concrete summary of what is taught in this video and why it is the best resource for learning.
               - "duration": Estimated runtime (e.g. "3h 40m", "45m", "1h 15m")
            
            Respond strictly with valid JSON conforming to this schema:
            {
              "answer": "Comprehensive, clear markdown guidance answering the user's specific query in depth",
              "estimatedDurationMinutes": 45,
              "estimatedStudyHours": 20.0,
              "suggestedSubtasks": ["step 1", "step 2"],
              "suggestedModules": [
                {
                  "title": "Module name",
                  "description": "Module overview",
                  "estimatedHours": 6,
                  "topics": ["topic 1", "topic 2"]
                }
              ],
              "youtubeRecommendations": [
                {
                  "title": "Real Video Course Title",
                  "channel": "Channel Name",
                  "url": "https://www.youtube.com/results?search_query=...",
                  "description": "Why this video is recommended",
                  "duration": "e.g. 2h 30m"
                }
              ]
            }
            """;

        String userMessage = String.format("Context Type: %s\nSubject/Topic: %s\nUser Query: %s",
                contextType != null ? contextType : "GENERAL",
                subject != null ? subject : "General Workspace Topic",
                prompt);

        try {
            Map<String, Object> requestPayload = new LinkedHashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentItem = new LinkedHashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();

            parts.add(Map.of("text", systemInstruction + "\n\n" + userMessage));
            contentItem.put("parts", parts);
            contents.add(contentItem);
            requestPayload.put("contents", contents);

            Map<String, Object> genConfig = new LinkedHashMap<>();
            genConfig.put("temperature", 0.3);
            genConfig.put("responseMimeType", "application/json");
            requestPayload.put("generationConfig", genConfig);

            String requestBodyJson = objectMapper.writeValueAsString(requestPayload);

            for (String candidateModel : candidateModels) {
                try {
                    String endpoint = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                            candidateModel, activeKey);

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(endpoint))
                            .header("Content-Type", "application/json")
                            .timeout(Duration.ofSeconds(30))
                            .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() == 200) {
                        JsonNode root = objectMapper.readTree(response.body());
                        JsonNode candidates = root.path("candidates");
                        if (candidates.isArray() && !candidates.isEmpty()) {
                            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                            String responseText = textNode.asText();

                            AiResponse parsed = parseGeminiJson(responseText);
                            parsed.setModelUsed("Gemini (" + candidateModel + ")");
                            parsed.setLiveGeminiUsed(true);
                            log.info("Successfully received live Gemini response using model: {}", candidateModel);
                            return Optional.of(parsed);
                        }
                    } else if (response.statusCode() == 404) {
                        log.warn("Model {} returned 404, trying next candidate model...", candidateModel);
                        continue;
                    } else {
                        log.warn("Gemini API call to {} returned status {}: {}", candidateModel, response.statusCode(), response.body());
                    }
                } catch (Exception modelEx) {
                    log.warn("Error querying model {}: {}", candidateModel, modelEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Exception calling Gemini API: {}", e.getMessage(), e);
        }

        return Optional.empty();
    }

    private AiResponse parseGeminiJson(String jsonText) {
        AiResponse resp = new AiResponse();
        try {
            // Strip markdown code fences if Gemini returned them
            String cleaned = jsonText.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode node = objectMapper.readTree(cleaned);

            if (node.has("answer")) {
                resp.setAnswer(node.get("answer").asText());
            }
            if (node.has("estimatedDurationMinutes") && !node.get("estimatedDurationMinutes").isNull()) {
                resp.setEstimatedDurationMinutes(node.get("estimatedDurationMinutes").asInt());
            }
            if (node.has("estimatedStudyHours") && !node.get("estimatedStudyHours").isNull()) {
                resp.setEstimatedStudyHours(node.get("estimatedStudyHours").asDouble());
            }

            if (node.has("suggestedSubtasks") && node.get("suggestedSubtasks").isArray()) {
                List<String> subtasks = new ArrayList<>();
                for (JsonNode st : node.get("suggestedSubtasks")) {
                    subtasks.add(st.asText());
                }
                resp.setSuggestedSubtasks(subtasks);
            }

            if (node.has("suggestedModules") && node.get("suggestedModules").isArray()) {
                List<SuggestedModule> modules = new ArrayList<>();
                for (JsonNode m : node.get("suggestedModules")) {
                    SuggestedModule mod = new SuggestedModule();
                    mod.setTitle(m.path("title").asText("Module"));
                    mod.setDescription(m.path("description").asText(""));
                    mod.setEstimatedHours(m.path("estimatedHours").asInt(4));
                    if (m.has("topics") && m.get("topics").isArray()) {
                        List<String> topics = new ArrayList<>();
                        for (JsonNode t : m.get("topics")) {
                            topics.add(t.asText());
                        }
                        mod.setTopics(topics);
                    }
                    modules.add(mod);
                }
                resp.setSuggestedModules(modules);
            }

            if (node.has("youtubeRecommendations") && node.get("youtubeRecommendations").isArray()) {
                List<YouTubeRecommendation> ytList = new ArrayList<>();
                for (JsonNode y : node.get("youtubeRecommendations")) {
                    YouTubeRecommendation yt = new YouTubeRecommendation();
                    yt.setTitle(y.path("title").asText("Tutorial"));
                    yt.setChannel(y.path("channel").asText("YouTube"));
                    yt.setUrl(y.path("url").asText("https://www.youtube.com"));
                    yt.setDescription(y.path("description").asText(""));
                    yt.setDuration(y.path("duration").asText(""));
                    ytList.add(yt);
                }
                resp.setYoutubeRecommendations(ytList);
            }

        } catch (Exception e) {
            log.warn("Could not parse structured JSON from Gemini response, treating as raw answer: {}", e.getMessage());
            resp.setAnswer(jsonText);
        }
        return resp;
    }
}
