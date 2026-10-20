package com.personal.productivity.ai;

import jakarta.validation.constraints.NotBlank;

public class AiRequest {

    @NotBlank(message = "Prompt cannot be blank")
    private String prompt;

    // "TASK", "ROADMAP", or "GENERAL"
    private String contextType = "GENERAL";

    // e.g. Task title or Roadmap skill/topic
    private String subject;

    // Optional user-supplied API key
    private String apiKey;

    public AiRequest() {}

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getContextType() { return contextType; }
    public void setContextType(String contextType) { this.contextType = contextType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
}
