package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.learning.*;
import com.personal.productivity.learning.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningServiceTest {

    @Mock
    private LearningRoadmapRepository roadmapRepository;

    @Mock
    private LearningModuleRepository moduleRepository;

    @Mock
    private LearningTopicRepository topicRepository;

    @Mock
    private RevisionSessionRepository revisionRepository;

    @Mock
    private PracticeLogRepository practiceLogRepository;

    @InjectMocks
    private LearningService learningService;

    private User testUser;
    private LearningRoadmap testRoadmap;
    private LearningModule testModule;
    private LearningTopic testTopic;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        testRoadmap = new LearningRoadmap(testUser, "Java Concurrency", "Deep dive into Loom",
                LocalDate.now(), LocalDate.now().plusMonths(2), BigDecimal.valueOf(6.0));
        testRoadmap.setId(UUID.randomUUID());

        testModule = new LearningModule(testRoadmap, "Virtual Threads", "Structured concurrency", 1);
        testModule.setId(UUID.randomUUID());
        testRoadmap.getModules().add(testModule);

        testTopic = new LearningTopic(testModule, "Scoped Values", 45, 1);
        testTopic.setId(UUID.randomUUID());
        testModule.getTopics().add(testTopic);
    }

    @Test
    void testCreateRoadmap() {
        RoadmapDto.Request request = new RoadmapDto.Request(
                "Distributed Systems",
                "Consensus algorithms",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                BigDecimal.valueOf(5.0),
                RoadmapStatus.IN_PROGRESS
        );

        when(roadmapRepository.save(any(LearningRoadmap.class))).thenAnswer(i -> {
            LearningRoadmap r = i.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });
        when(topicRepository.countByRoadmapId(any())).thenReturn(0L);
        when(topicRepository.countCompletedByRoadmapId(any())).thenReturn(0L);
        when(practiceLogRepository.sumMinutesByRoadmapId(any(), any())).thenReturn(0L);
        when(revisionRepository.findFirstByTopicModuleRoadmapIdAndCompletedFalseOrderByScheduledDateAsc(any()))
                .thenReturn(Optional.empty());

        RoadmapDto.Response response = learningService.createRoadmap(testUser, request);

        assertNotNull(response);
        assertEquals("Distributed Systems", response.skillName());
        assertEquals(0, response.progressPercentage());
        verify(roadmapRepository).save(any(LearningRoadmap.class));
    }

    @Test
    void testAddModuleAndTopic() {
        when(roadmapRepository.findByIdAndUserId(testRoadmap.getId(), testUser.getId()))
                .thenReturn(Optional.of(testRoadmap));
        when(moduleRepository.save(any(LearningModule.class))).thenAnswer(i -> {
            LearningModule m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        ModuleDto.Request modReq = new ModuleDto.Request("Memory Model", "JMM specifications", 2, ModuleStatus.NOT_STARTED);
        ModuleDto.Response modResp = learningService.addModule(testUser, testRoadmap.getId(), modReq);

        assertNotNull(modResp);
        assertEquals("Memory Model", modResp.title());

        when(moduleRepository.findByIdAndRoadmapUserId(modResp.id(), testUser.getId()))
                .thenReturn(Optional.of(testModule));
        when(topicRepository.save(any(LearningTopic.class))).thenAnswer(i -> {
            LearningTopic t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TopicDto.Request topReq = new TopicDto.Request("Happens-Before Relationship", TopicStatus.NOT_STARTED, 40, 1);
        TopicDto.Response topResp = learningService.addTopic(testUser, modResp.id(), topReq);

        assertNotNull(topResp);
        assertEquals("Happens-Before Relationship", topResp.title());
    }

    @Test
    void testUpdateTopicStatusWithAutoScheduledRevision() {
        when(topicRepository.findByIdAndModuleRoadmapUserId(testTopic.getId(), testUser.getId()))
                .thenReturn(Optional.of(testTopic));
        when(topicRepository.save(any(LearningTopic.class))).thenAnswer(i -> i.getArgument(0));

        TopicDto.Response response = learningService.updateTopicStatus(testUser, testTopic.getId(), TopicStatus.COMPLETED, true);

        assertEquals(TopicStatus.COMPLETED, response.status());
        assertNotNull(response.completedAt());
        verify(revisionRepository).save(any(RevisionSession.class));
    }

    @Test
    void testCreatePracticeLog() {
        PracticeLogDto.Request request = new PracticeLogDto.Request(
                testRoadmap.getId(),
                testTopic.getId(),
                LocalDate.now(),
                3,
                90,
                "Solved LeetCode concurrency challenges",
                "Be careful with lock reentrancy"
        );

        when(practiceLogRepository.save(any(PracticeLog.class))).thenAnswer(i -> {
            PracticeLog p = i.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        PracticeLogDto.Response response = learningService.createPracticeLog(testUser, request);

        assertNotNull(response);
        assertEquals(3, response.problemsSolved());
        assertEquals(90, response.minutesSpent());
        verify(practiceLogRepository).save(any(PracticeLog.class));
    }

    @Test
    void testCompleteRevision() {
        RevisionSession session = new RevisionSession(testUser, testTopic, LocalDate.now(), "Notes");
        session.setId(UUID.randomUUID());

        when(revisionRepository.findByIdAndUserId(session.getId(), testUser.getId()))
                .thenReturn(Optional.of(session));
        when(revisionRepository.save(any(RevisionSession.class))).thenAnswer(i -> i.getArgument(0));

        RevisionSessionDto.Response response = learningService.completeRevision(testUser, session.getId());

        assertTrue(response.completed());
        assertNotNull(response.completedAt());
    }
}
