package com.personal.productivity.learning;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.common.BadRequestException;
import com.personal.productivity.learning.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/learning")
public class LearningController {

    private final LearningService learningService;
    private final AuthService authService;

    public LearningController(LearningService learningService, AuthService authService) {
        this.learningService = learningService;
        this.authService = authService;
    }

    // ROADMAPS
    @GetMapping("/roadmaps")
    public ResponseEntity<List<RoadmapDto.Response>> getRoadmaps() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.getRoadmaps(user));
    }

    @PostMapping("/roadmaps")
    public ResponseEntity<RoadmapDto.Response> createRoadmap(@Valid @RequestBody RoadmapDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(learningService.createRoadmap(user, request), HttpStatus.CREATED);
    }

    @GetMapping("/roadmaps/{id}")
    public ResponseEntity<RoadmapDto.Response> getRoadmapById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.getRoadmapById(user, id));
    }

    @PutMapping("/roadmaps/{id}")
    public ResponseEntity<RoadmapDto.Response> updateRoadmap(@PathVariable UUID id, @Valid @RequestBody RoadmapDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.updateRoadmap(user, id, request));
    }

    @DeleteMapping("/roadmaps/{id}")
    public ResponseEntity<Void> deleteRoadmap(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        learningService.deleteRoadmap(user, id);
        return ResponseEntity.noContent().build();
    }

    // MODULES
    @PostMapping("/roadmaps/{id}/modules")
    public ResponseEntity<ModuleDto.Response> addModule(@PathVariable UUID id, @Valid @RequestBody ModuleDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(learningService.addModule(user, id, request), HttpStatus.CREATED);
    }

    @PutMapping("/modules/{moduleId}")
    public ResponseEntity<ModuleDto.Response> updateModule(@PathVariable UUID moduleId, @Valid @RequestBody ModuleDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.updateModule(user, moduleId, request));
    }

    @DeleteMapping("/modules/{moduleId}")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID moduleId) {
        User user = authService.getCurrentAuthenticatedUser();
        learningService.deleteModule(user, moduleId);
        return ResponseEntity.noContent().build();
    }

    // TOPICS
    @PostMapping("/modules/{moduleId}/topics")
    public ResponseEntity<TopicDto.Response> addTopic(@PathVariable UUID moduleId, @Valid @RequestBody TopicDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(learningService.addTopic(user, moduleId, request), HttpStatus.CREATED);
    }

    @PatchMapping("/topics/{topicId}/status")
    public ResponseEntity<TopicDto.Response> updateTopicStatus(
            @PathVariable UUID topicId,
            @RequestParam(required = false) TopicStatus status,
            @RequestParam(required = false, defaultValue = "false") boolean scheduleRevision,
            @RequestBody(required = false) Map<String, String> body) {
        User user = authService.getCurrentAuthenticatedUser();
        TopicStatus finalStatus = status;
        if (finalStatus == null && body != null && body.containsKey("status")) {
            finalStatus = TopicStatus.valueOf(body.get("status").toUpperCase());
        }
        if (finalStatus == null) {
            throw new BadRequestException("Status is required either as query parameter or request body");
        }
        return ResponseEntity.ok(learningService.updateTopicStatus(user, topicId, finalStatus, scheduleRevision));
    }

    @PutMapping("/topics/{topicId}")
    public ResponseEntity<TopicDto.Response> updateTopic(@PathVariable UUID topicId, @Valid @RequestBody TopicDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.updateTopic(user, topicId, request));
    }

    @DeleteMapping("/topics/{topicId}")
    public ResponseEntity<Void> deleteTopic(@PathVariable UUID topicId) {
        User user = authService.getCurrentAuthenticatedUser();
        learningService.deleteTopic(user, topicId);
        return ResponseEntity.noContent().build();
    }

    // REVISIONS
    @GetMapping("/revisions")
    public ResponseEntity<List<RevisionSessionDto.Response>> getUpcomingRevisions() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.getUpcomingRevisions(user));
    }

    @PostMapping("/revisions")
    public ResponseEntity<RevisionSessionDto.Response> scheduleRevision(@Valid @RequestBody RevisionSessionDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(learningService.scheduleRevision(user, request), HttpStatus.CREATED);
    }

    @PatchMapping("/revisions/{revisionId}/complete")
    public ResponseEntity<RevisionSessionDto.Response> completeRevision(@PathVariable UUID revisionId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.completeRevision(user, revisionId));
    }

    @DeleteMapping("/revisions/{revisionId}")
    public ResponseEntity<Void> deleteRevision(@PathVariable UUID revisionId) {
        User user = authService.getCurrentAuthenticatedUser();
        learningService.deleteRevision(user, revisionId);
        return ResponseEntity.noContent().build();
    }

    // PRACTICE LOGS
    @GetMapping("/practice-logs")
    public ResponseEntity<List<PracticeLogDto.Response>> getPracticeLogs(@RequestParam(required = false) UUID roadmapId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(learningService.getPracticeLogs(user, roadmapId));
    }

    @PostMapping("/practice-logs")
    public ResponseEntity<PracticeLogDto.Response> createPracticeLog(@Valid @RequestBody PracticeLogDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(learningService.createPracticeLog(user, request), HttpStatus.CREATED);
    }

    @DeleteMapping("/practice-logs/{logId}")
    public ResponseEntity<Void> deletePracticeLog(@PathVariable UUID logId) {
        User user = authService.getCurrentAuthenticatedUser();
        learningService.deletePracticeLog(user, logId);
        return ResponseEntity.noContent().build();
    }
}
