package com.personal.productivity.ai;

public class YouTubeRecommendation {
    private String title;
    private String channel;
    private String url;
    private String description;
    private String duration;

    public YouTubeRecommendation() {}

    public YouTubeRecommendation(String title, String channel, String url, String description, String duration) {
        this.title = title;
        this.channel = channel;
        this.url = url;
        this.description = description;
        this.duration = duration;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
}
