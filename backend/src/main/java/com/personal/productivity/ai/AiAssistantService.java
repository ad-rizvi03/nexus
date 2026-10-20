package com.personal.productivity.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AiAssistantService {
    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);

    private final GeminiApiClient geminiApiClient;

    public AiAssistantService(GeminiApiClient geminiApiClient) {
        this.geminiApiClient = geminiApiClient;
    }

    public boolean isGeminiConfigured(String userKey) {
        return geminiApiClient.hasApiKey(userKey);
    }

    public AiResponse processQuery(AiRequest request) {
        String prompt = request.getPrompt();
        String subject = request.getSubject() != null && !request.getSubject().isBlank()
                ? request.getSubject()
                : extractSubjectFromPrompt(prompt);
        String contextType = request.getContextType();

        log.info("Processing real-time AI query: prompt='{}', subject='{}', contextType='{}'", prompt, subject, contextType);

        // Attempt live Google Gemini API call in real time
        Optional<AiResponse> geminiResponse = geminiApiClient.queryGemini(
                prompt, subject, contextType, request.getApiKey());

        if (geminiResponse.isPresent()) {
            return geminiResponse.get();
        }

        // Do NOT return pre-stored or hardcoded values
        log.error("Real-time Gemini query failed. No pre-stored data will be returned.");
        throw new IllegalStateException("Real-time Gemini search failed to retrieve live data. Please check your network connection and API key.");
    }

    private String extractSubjectFromPrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "General Topic";
        }
        String clean = prompt.trim();
        if (clean.length() > 60) {
            clean = clean.substring(0, 60);
        }
        return clean;
    }
}
