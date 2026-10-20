package com.personal.productivity.ai;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiAssistantService aiAssistantService;

    public AiController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/ask")
    public ResponseEntity<AiResponse> askAi(@Valid @RequestBody AiRequest request) {
        AiResponse response = aiAssistantService.processQuery(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus(@RequestParam(required = false) String apiKey) {
        boolean configured = aiAssistantService.isGeminiConfigured(apiKey);
        return ResponseEntity.ok(Map.of(
                "geminiConfigured", configured,
                "model", "gemini-3.5-flash-lite",
                "message", configured
                        ? "Google Gemini Real-Time API connected and ready."
                        : "Configure GEMINI_API_KEY to enable live Gemini generation."
        ));
    }
}
