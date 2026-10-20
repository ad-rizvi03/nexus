package com.personal.productivity.ai;

import java.util.ArrayList;
import java.util.List;

public class AiResponse {
    private String answer;
    private Integer estimatedDurationMinutes;
    private Double estimatedStudyHours;
    private List<String> suggestedSubtasks = new ArrayList<>();
    private List<SuggestedModule> suggestedModules = new ArrayList<>();
    private List<YouTubeRecommendation> youtubeRecommendations = new ArrayList<>();
    private String modelUsed;
    private boolean liveGeminiUsed;

    public AiResponse() {}

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }

    public Double getEstimatedStudyHours() { return estimatedStudyHours; }
    public void setEstimatedStudyHours(Double estimatedStudyHours) { this.estimatedStudyHours = estimatedStudyHours; }

    public List<String> getSuggestedSubtasks() { return suggestedSubtasks; }
    public void setSuggestedSubtasks(List<String> suggestedSubtasks) { this.suggestedSubtasks = suggestedSubtasks; }

    public List<SuggestedModule> getSuggestedModules() { return suggestedModules; }
    public void setSuggestedModules(List<SuggestedModule> suggestedModules) { this.suggestedModules = suggestedModules; }

    public List<YouTubeRecommendation> getYoutubeRecommendations() { return youtubeRecommendations; }
    public void setYoutubeRecommendations(List<YouTubeRecommendation> youtubeRecommendations) { this.youtubeRecommendations = youtubeRecommendations; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public boolean isLiveGeminiUsed() { return liveGeminiUsed; }
    public void setLiveGeminiUsed(boolean liveGeminiUsed) { this.liveGeminiUsed = liveGeminiUsed; }
}
