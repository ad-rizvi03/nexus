package com.personal.productivity.ai;

import java.util.ArrayList;
import java.util.List;

public class SuggestedModule {
    private String title;
    private String description;
    private int estimatedHours;
    private List<String> topics = new ArrayList<>();

    public SuggestedModule() {}

    public SuggestedModule(String title, String description, int estimatedHours, List<String> topics) {
        this.title = title;
        this.description = description;
        this.estimatedHours = estimatedHours;
        if (topics != null) this.topics = topics;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }

    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }
}
