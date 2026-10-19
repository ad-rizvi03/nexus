package com.personal.productivity.learning;

import com.personal.productivity.auth.User;
import com.personal.productivity.common.BadRequestException;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.learning.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LearningService {

    private final LearningRoadmapRepository roadmapRepository;
    private final LearningModuleRepository moduleRepository;
    private final LearningTopicRepository topicRepository;
    private final RevisionSessionRepository revisionRepository;
    private final PracticeLogRepository practiceLogRepository;

    public LearningService(LearningRoadmapRepository roadmapRepository,
                           LearningModuleRepository moduleRepository,
                           LearningTopicRepository topicRepository,
                           RevisionSessionRepository revisionRepository,
                           PracticeLogRepository practiceLogRepository) {
        this.roadmapRepository = roadmapRepository;
        this.moduleRepository = moduleRepository;
        this.topicRepository = topicRepository;
        this.revisionRepository = revisionRepository;
        this.practiceLogRepository = practiceLogRepository;
    }

    @Transactional
    public List<RoadmapDto.Response> getRoadmaps(User user) {
        if (!roadmapRepository.existsByUserId(user.getId())) {
            seedDefaultRoadmaps(user);
        }

        List<LearningRoadmap> roadmaps = roadmapRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        List<RoadmapDto.Response> responses = new ArrayList<>();
        for (LearningRoadmap r : roadmaps) {
            responses.add(buildRoadmapResponse(user, r));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public RoadmapDto.Response getRoadmapById(User user, UUID id) {
        LearningRoadmap roadmap = roadmapRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning roadmap not found"));
        return buildRoadmapResponse(user, roadmap);
    }

    @Transactional
    public RoadmapDto.Response createRoadmap(User user, RoadmapDto.Request request) {
        LearningRoadmap roadmap = new LearningRoadmap(
                user,
                request.skillName().trim(),
                request.objective(),
                request.startDate() != null ? request.startDate() : LocalDate.now(),
                request.targetCompletionDate(),
                request.weeklyTargetHours() != null ? request.weeklyTargetHours() : BigDecimal.valueOf(5.0)
        );
        if (request.status() != null) {
            roadmap.setStatus(request.status());
        }
        roadmap = roadmapRepository.save(roadmap);
        return buildRoadmapResponse(user, roadmap);
    }

    @Transactional
    public RoadmapDto.Response updateRoadmap(User user, UUID id, RoadmapDto.Request request) {
        LearningRoadmap roadmap = roadmapRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning roadmap not found"));

        roadmap.setSkillName(request.skillName().trim());
        roadmap.setObjective(request.objective());
        if (request.startDate() != null) roadmap.setStartDate(request.startDate());
        roadmap.setTargetCompletionDate(request.targetCompletionDate());
        if (request.weeklyTargetHours() != null) roadmap.setWeeklyTargetHours(request.weeklyTargetHours());
        if (request.status() != null) roadmap.setStatus(request.status());

        roadmap = roadmapRepository.save(roadmap);
        return buildRoadmapResponse(user, roadmap);
    }

    @Transactional
    public void deleteRoadmap(User user, UUID id) {
        LearningRoadmap roadmap = roadmapRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning roadmap not found"));
        roadmapRepository.delete(roadmap);
    }

    // MODULES
    @Transactional
    public ModuleDto.Response addModule(User user, UUID roadmapId, ModuleDto.Request request) {
        LearningRoadmap roadmap = roadmapRepository.findByIdAndUserId(roadmapId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning roadmap not found"));

        int sortOrder = request.sortOrder() != null ? request.sortOrder() : roadmap.getModules().size() + 1;
        LearningModule module = new LearningModule(roadmap, request.title().trim(), request.description(), sortOrder);
        if (request.status() != null) {
            module.setStatus(request.status());
        }
        module = moduleRepository.save(module);
        return buildModuleResponse(module);
    }

    @Transactional
    public ModuleDto.Response updateModule(User user, UUID moduleId, ModuleDto.Request request) {
        LearningModule module = moduleRepository.findByIdAndRoadmapUserId(moduleId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning module not found"));

        module.setTitle(request.title().trim());
        module.setDescription(request.description());
        if (request.sortOrder() != null) module.setSortOrder(request.sortOrder());
        if (request.status() != null) module.setStatus(request.status());

        module = moduleRepository.save(module);
        return buildModuleResponse(module);
    }

    @Transactional
    public void deleteModule(User user, UUID moduleId) {
        LearningModule module = moduleRepository.findByIdAndRoadmapUserId(moduleId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning module not found"));
        moduleRepository.delete(module);
    }

    // TOPICS
    @Transactional
    public TopicDto.Response addTopic(User user, UUID moduleId, TopicDto.Request request) {
        LearningModule module = moduleRepository.findByIdAndRoadmapUserId(moduleId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning module not found"));

        int sortOrder = request.sortOrder() != null ? request.sortOrder() : module.getTopics().size() + 1;
        LearningTopic topic = new LearningTopic(module, request.title().trim(), request.estimatedMinutes(), sortOrder);
        if (request.status() != null) {
            topic.setStatus(request.status());
        }
        topic = topicRepository.save(topic);
        return buildTopicResponse(topic);
    }

    @Transactional
    public TopicDto.Response updateTopicStatus(User user, UUID topicId, TopicStatus status, boolean scheduleRevision) {
        LearningTopic topic = topicRepository.findByIdAndModuleRoadmapUserId(topicId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning topic not found"));

        topic.setStatus(status);
        topic = topicRepository.save(topic);

        if (status == TopicStatus.COMPLETED && scheduleRevision) {
            LocalDate revisionDate = LocalDate.now().plusDays(3);
            RevisionSession rev = new RevisionSession(user, topic, revisionDate, "Auto-scheduled 3-day spaced repetition revision");
            revisionRepository.save(rev);
        }

        return buildTopicResponse(topic);
    }

    @Transactional
    public TopicDto.Response updateTopic(User user, UUID topicId, TopicDto.Request request) {
        LearningTopic topic = topicRepository.findByIdAndModuleRoadmapUserId(topicId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning topic not found"));

        topic.setTitle(request.title().trim());
        if (request.estimatedMinutes() != null) topic.setEstimatedMinutes(request.estimatedMinutes());
        if (request.sortOrder() != null) topic.setSortOrder(request.sortOrder());
        if (request.status() != null) topic.setStatus(request.status());

        topic = topicRepository.save(topic);
        return buildTopicResponse(topic);
    }

    @Transactional
    public void deleteTopic(User user, UUID topicId) {
        LearningTopic topic = topicRepository.findByIdAndModuleRoadmapUserId(topicId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Learning topic not found"));
        topicRepository.delete(topic);
    }

    // REVISIONS
    @Transactional(readOnly = true)
    public List<RevisionSessionDto.Response> getUpcomingRevisions(User user) {
        List<RevisionSession> revisions = revisionRepository.findAllByUserIdAndCompletedFalseOrderByScheduledDateAsc(user.getId());
        return revisions.stream().map(this::buildRevisionResponse).toList();
    }

    @Transactional
    public RevisionSessionDto.Response scheduleRevision(User user, RevisionSessionDto.Request request) {
        LearningTopic topic = topicRepository.findByIdAndModuleRoadmapUserId(request.topicId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));

        RevisionSession session = new RevisionSession(user, topic, request.scheduledDate(), request.notes());
        session = revisionRepository.save(session);
        return buildRevisionResponse(session);
    }

    @Transactional
    public RevisionSessionDto.Response completeRevision(User user, UUID revisionId) {
        RevisionSession session = revisionRepository.findByIdAndUserId(revisionId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Revision session not found"));

        session.setCompleted(true);
        session = revisionRepository.save(session);
        return buildRevisionResponse(session);
    }

    // PRACTICE LOGS
    @Transactional(readOnly = true)
    public List<PracticeLogDto.Response> getPracticeLogs(User user, UUID roadmapId) {
        List<PracticeLog> logs;
        if (roadmapId != null) {
            logs = practiceLogRepository.findAllByUserIdAndRoadmapIdOrderByLogDateDescCreatedAtDesc(user.getId(), roadmapId);
        } else {
            logs = practiceLogRepository.findAllByUserIdOrderByLogDateDescCreatedAtDesc(user.getId());
        }
        return logs.stream().map(this::buildPracticeLogResponse).toList();
    }

    @Transactional
    public PracticeLogDto.Response createPracticeLog(User user, PracticeLogDto.Request request) {
        PracticeLog log = new PracticeLog(
                user,
                request.roadmapId(),
                request.topicId(),
                request.logDate() != null ? request.logDate() : LocalDate.now(),
                request.problemsSolved(),
                request.minutesSpent(),
                request.conceptSummary(),
                request.mistakesAndNotes()
        );
        log = practiceLogRepository.save(log);
        return buildPracticeLogResponse(log);
    }

    // SEEDING
    @Transactional
    public void seedDefaultRoadmaps(User user) {
        // Roadmap 1: Java 21 & Spring Boot
        LearningRoadmap javaRoadmap = new LearningRoadmap(
                user,
                "Java 21 & Spring Boot Microservices",
                "Master modern Java concurrency, virtual threads, Spring Boot 4 architecture, and production readiness.",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                BigDecimal.valueOf(6.0)
        );
        javaRoadmap = roadmapRepository.save(javaRoadmap);

        LearningModule mod1 = new LearningModule(javaRoadmap, "Modern Java 21 Core", "Virtual threads, records, pattern matching, sequenced collections.", 1);
        mod1 = moduleRepository.save(mod1);

        LearningTopic top1 = new LearningTopic(mod1, "Virtual Threads & Structured Concurrency", 60, 1);
        top1.setStatus(TopicStatus.COMPLETED);
        topicRepository.save(top1);

        LearningTopic top2 = new LearningTopic(mod1, "Pattern Matching for switch and Record Patterns", 45, 2);
        top2.setStatus(TopicStatus.IN_PROGRESS);
        topicRepository.save(top2);

        LearningTopic top3 = new LearningTopic(mod1, "Sequenced Collections & Unnamed Variables", 30, 3);
        topicRepository.save(top3);

        LearningModule mod2 = new LearningModule(javaRoadmap, "Spring Boot 4 Operations", "JPA, Flyway, Spring Security session authentication, telemetry.", 2);
        mod2 = moduleRepository.save(mod2);

        LearningTopic top4 = new LearningTopic(mod2, "Flyway Database Schema Migrations", 45, 1);
        top4.setStatus(TopicStatus.COMPLETED);
        topicRepository.save(top4);

        LearningTopic top5 = new LearningTopic(mod2, "Stateful Session Security with BCrypt & Cookies", 60, 2);
        top5.setStatus(TopicStatus.IN_PROGRESS);
        topicRepository.save(top5);

        // Roadmap 2: System Design & Distributed Architectures
        LearningRoadmap sysDesignRoadmap = new LearningRoadmap(
                user,
                "System Design & Distributed Architectures",
                "High-scale distributed messaging, caching strategies, partition tolerance, and resilient consensus.",
                LocalDate.now(),
                LocalDate.now().plusMonths(4),
                BigDecimal.valueOf(4.0)
        );
        sysDesignRoadmap = roadmapRepository.save(sysDesignRoadmap);

        LearningModule sysMod1 = new LearningModule(sysDesignRoadmap, "Distributed Storage & Caching", "Cache-aside, Redis cluster, distributed locks.", 1);
        sysMod1 = moduleRepository.save(sysMod1);

        LearningTopic sysTop1 = new LearningTopic(sysMod1, "Consistent Hashing & Virtual Nodes", 45, 1);
        topicRepository.save(sysTop1);

        LearningTopic sysTop2 = new LearningTopic(sysMod1, "Distributed Locks with Redlock & Expiry", 60, 2);
        topicRepository.save(sysTop2);

        // Seed 1 revision session
        RevisionSession rev1 = new RevisionSession(user, top1, LocalDate.now().plusDays(2), "Review Loom platform thread comparison benchmarks");
        revisionRepository.save(rev1);

        // Seed 2 practice logs
        PracticeLog log1 = new PracticeLog(user, javaRoadmap.getId(), top1.getId(), LocalDate.now(), 2, 60,
                "Compared throughput of 10,000 tasks on virtual threads vs fixed thread pool.",
                "Ensure IO blocking operations do not hold synchronized monitors.");
        practiceLogRepository.save(log1);
    }

    // MAPPERS
    private RoadmapDto.Response buildRoadmapResponse(User user, LearningRoadmap roadmap) {
        long totalTopics = topicRepository.countByRoadmapId(roadmap.getId());
        long completedTopics = topicRepository.countCompletedByRoadmapId(roadmap.getId());
        int progressPct = totalTopics > 0 ? (int) Math.round(((double) completedTopics / totalTopics) * 100) : 0;
        long totalPracticeMinutes = practiceLogRepository.sumMinutesByRoadmapId(user.getId(), roadmap.getId());

        String nextRevision = revisionRepository
                .findFirstByTopicModuleRoadmapIdAndCompletedFalseOrderByScheduledDateAsc(roadmap.getId())
                .map(r -> r.getTopic().getTitle() + " (" + r.getScheduledDate() + ")")
                .orElse("None scheduled");

        List<ModuleDto.Response> moduleResponses = moduleRepository.findAllByRoadmapIdOrderBySortOrderAsc(roadmap.getId()).stream()
                .map(this::buildModuleResponse)
                .toList();

        return new RoadmapDto.Response(
                roadmap.getId(),
                roadmap.getSkillName(),
                roadmap.getObjective(),
                roadmap.getStartDate(),
                roadmap.getTargetCompletionDate(),
                roadmap.getWeeklyTargetHours(),
                roadmap.getStatus(),
                moduleResponses,
                totalTopics,
                completedTopics,
                progressPct,
                totalPracticeMinutes,
                nextRevision,
                roadmap.getCreatedAt(),
                roadmap.getUpdatedAt()
        );
    }

    private ModuleDto.Response buildModuleResponse(LearningModule module) {
        List<TopicDto.Response> topics = topicRepository.findAllByModuleIdOrderBySortOrderAsc(module.getId()).stream()
                .map(this::buildTopicResponse)
                .toList();

        return new ModuleDto.Response(
                module.getId(),
                module.getRoadmap().getId(),
                module.getTitle(),
                module.getDescription(),
                module.getSortOrder(),
                module.getStatus(),
                topics,
                module.getCreatedAt(),
                module.getUpdatedAt()
        );
    }

    private TopicDto.Response buildTopicResponse(LearningTopic topic) {
        return new TopicDto.Response(
                topic.getId(),
                topic.getModule().getId(),
                topic.getTitle(),
                topic.getStatus(),
                topic.getEstimatedMinutes(),
                topic.getCompletedAt(),
                topic.getSortOrder(),
                topic.getCreatedAt(),
                topic.getUpdatedAt()
        );
    }

    private RevisionSessionDto.Response buildRevisionResponse(RevisionSession r) {
        return new RevisionSessionDto.Response(
                r.getId(),
                r.getTopic().getId(),
                r.getTopic().getTitle(),
                r.getTopic().getModule().getTitle(),
                r.getTopic().getModule().getRoadmap().getSkillName(),
                r.getScheduledDate(),
                r.getCompleted(),
                r.getCompletedAt(),
                r.getNotes(),
                r.getCreatedAt()
        );
    }

    private PracticeLogDto.Response buildPracticeLogResponse(PracticeLog p) {
        String skillName = null;
        if (p.getRoadmapId() != null) {
            skillName = roadmapRepository.findById(p.getRoadmapId())
                    .map(LearningRoadmap::getSkillName)
                    .orElse(null);
        }
        String topicTitle = null;
        if (p.getTopicId() != null) {
            topicTitle = topicRepository.findById(p.getTopicId())
                    .map(LearningTopic::getTitle)
                    .orElse(null);
        }

        return new PracticeLogDto.Response(
                p.getId(),
                p.getRoadmapId(),
                skillName,
                p.getTopicId(),
                topicTitle,
                p.getLogDate(),
                p.getProblemsSolved(),
                p.getMinutesSpent(),
                p.getConceptSummary(),
                p.getMistakesAndNotes(),
                p.getCreatedAt()
        );
    }
}
