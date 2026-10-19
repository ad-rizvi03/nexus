package com.personal.productivity.notes;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.notes.dto.NoteDto;
import com.personal.productivity.notes.dto.SavedResourceDto;
import com.personal.productivity.tasks.Category;
import com.personal.productivity.tasks.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final TagRepository tagRepository;
    private final SavedResourceRepository savedResourceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public NoteService(
            NoteRepository noteRepository,
            TagRepository tagRepository,
            SavedResourceRepository savedResourceRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.noteRepository = noteRepository;
        this.tagRepository = tagRepository;
        this.savedResourceRepository = savedResourceRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void seedDefaultsIfEmpty(UUID userId) {
        if (!noteRepository.existsByUserId(userId)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            List<Category> userCategories = categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId);
            Category deepWorkCategory = userCategories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase("Deep Work") || c.getName().equalsIgnoreCase("Learning"))
                    .findFirst()
                    .orElse(userCategories.isEmpty() ? null : userCategories.get(0));

            Category operationsCategory = userCategories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase("Operations") || c.getName().equalsIgnoreCase("Admin"))
                    .findFirst()
                    .orElse(deepWorkCategory);

            Tag tagSystemDesign = getOrCreateTag(user, "system-design");
            Tag tagDistributed = getOrCreateTag(user, "distributed-systems");
            Tag tagOperations = getOrCreateTag(user, "operations");
            Tag tagSre = getOrCreateTag(user, "sre");
            Tag tagArchitecture = getOrCreateTag(user, "architecture");

            // Seed Note 1: Architecture
            Note note1 = new Note(
                    user,
                    "Distributed Consensus & Raft Protocol",
                    """
                    # Distributed Consensus & Raft Architecture
                    
                    ## Core Concepts
                    - **Leader Election**: Randomized split vote timers (150ms-300ms) prevent perpetual split votes.
                    - **Log Replication**: Two-phase commit logic. AppendEntries RPC guarantees strict log ordering.
                    - **Safety Invariant**: Leader completeness property ensures committed entries persist across leader transitions.
                    
                    ### Key Implementation Notes
                    ```java
                    public synchronized boolean handleAppendEntries(AppendEntriesArgs args) {
                        if (args.term < currentTerm) return false;
                        resetHeartbeatTimer();
                        // Verify matching log entry at prevLogIndex
                        return appendAndCommit(args);
                    }
                    ```
                    
                    > *"In a distributed system, network partitions are inevitable. Favor consistency and partition tolerance (CP) for consensus state machines."*
                    """.stripIndent(),
                    deepWorkCategory,
                    true
            );
            note1.setTags(new HashSet<>(Arrays.asList(tagSystemDesign, tagDistributed)));
            noteRepository.save(note1);

            // Seed Note 2: Operations
            Note note2 = new Note(
                    user,
                    "Production Incident Protocol (P1/P2)",
                    """
                    # Production Incident Protocol
                    
                    ## Incident Response Lifecycle
                    1. **Triage & Page**: Acknowledge page within 5 minutes. Declare incident channel `#inc-yyyymmdd-title`.
                    2. **Mitigation over Root Cause**: Roll back bad deployments, drain unhealthy ingress pods, apply rate limits.
                    3. **Telemetry & Audit**: Capture Prometheus telemetry, JVM thread dumps, and database connection pool saturation stats.
                    4. **Post-Mortem**: Publish blameless retrospective within 48 business hours with actionable action items.
                    
                    ### On-Call Checklist
                    - [ ] Check Grafana 99th percentile HTTP latency dashboards
                    - [ ] Inspect PostgreSQL connection pool utilization (`pg_stat_activity`)
                    - [ ] Verify circuit breaker trip statuses on downstream gRPC services
                    """.stripIndent(),
                    operationsCategory,
                    false
            );
            note2.setTags(new HashSet<>(Arrays.asList(tagOperations, tagSre)));
            noteRepository.save(note2);

            // Seed Note 3: Clean Architecture
            Note note3 = new Note(
                    user,
                    "Hexagonal / Clean Architecture Tenets",
                    """
                    # Hexagonal Architecture Guidelines
                    
                    ## Dependency Rule
                    Source code dependencies must point only inward toward domain policies.
                    
                    - **Entities**: Pure business rules, zero framework dependencies.
                    - **Use Cases / Application Services**: Orchestrates domain models and inputs.
                    - **Interface Adapters (Controllers, Gateways)**: Translates DTOs to domain objects.
                    - **Frameworks & Drivers (JPA, HTTP, Cloud)**: Outermost layer details.
                    """.stripIndent(),
                    deepWorkCategory,
                    false
            );
            note3.setTags(new HashSet<>(Arrays.asList(tagArchitecture, tagSystemDesign)));
            noteRepository.save(note3);
        }

        if (!savedResourceRepository.existsByUserId(userId)) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                savedResourceRepository.save(new SavedResource(
                        user,
                        "Designing Data-Intensive Applications (Kleppmann)",
                        "https://dataintensive.net",
                        "Indispensable handbook for modern data systems, replication, partitioning, and stream processing.",
                        ResourceType.BOOK,
                        null
                ));
                savedResourceRepository.save(new SavedResource(
                        user,
                        "Spring Boot Observability with OpenTelemetry",
                        "https://github.com/spring-projects/spring-boot",
                        "Reference architecture for distributed tracing, Micrometer metrics, and Prometheus scrapers.",
                        ResourceType.REPO,
                        null
                ));
                savedResourceRepository.save(new SavedResource(
                        user,
                        "PostgreSQL Indexing Internals (B-Tree & BRIN)",
                        "https://www.youtube.com/watch?v=clrtNYn_wkw",
                        "Deep dive into how PostgreSQL plans index scans, heap fetches, and vacuum impact on high-write tables.",
                        ResourceType.VIDEO,
                        null
                ));
            }
        }
    }

    // ================= NOTES =================

    @Transactional
    public List<NoteDto.Response> getNotes(UUID userId, String query, UUID categoryId) {
        seedDefaultsIfEmpty(userId);

        List<Note> notes;
        if (query != null && !query.trim().isEmpty()) {
            notes = noteRepository.searchNotes(userId, query.trim());
        } else if (categoryId != null) {
            notes = noteRepository.findAllByUserIdAndCategoryId(userId, categoryId);
        } else {
            notes = noteRepository.findAllByUserIdWithDetails(userId);
        }
        return notes.stream().map(this::toNoteResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteDto.Response getNoteById(UUID userId, UUID id) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Note not found: " + id));
        return toNoteResponse(note);
    }

    @Transactional
    public NoteDto.Response createNote(UUID userId, NoteDto.Request request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findByIdAndUserId(request.categoryId(), userId).orElse(null);
        }

        Note note = new Note(
                user,
                request.title(),
                request.content(),
                category,
                Boolean.TRUE.equals(request.isPinned())
        );
        note.setTaskId(request.taskId());
        note.setLearningTopicId(request.learningTopicId());
        note.setGoalId(request.goalId());

        if (request.tags() != null && !request.tags().isEmpty()) {
            Set<Tag> tags = request.tags().stream()
                    .filter(t -> t != null && !t.trim().isEmpty())
                    .map(name -> getOrCreateTag(user, name.trim()))
                    .collect(Collectors.toSet());
            note.setTags(tags);
        }

        Note saved = noteRepository.save(note);
        return toNoteResponse(saved);
    }

    @Transactional
    public NoteDto.Response updateNote(UUID userId, UUID id, NoteDto.Request request) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Note not found: " + id));

        note.setTitle(request.title());
        note.setContent(request.content());
        if (request.isPinned() != null) {
            note.setIsPinned(request.isPinned());
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(request.categoryId(), userId).orElse(null);
            note.setCategory(category);
        } else {
            note.setCategory(null);
        }

        note.setTaskId(request.taskId());
        note.setLearningTopicId(request.learningTopicId());
        note.setGoalId(request.goalId());

        if (request.tags() != null) {
            User user = note.getUser();
            Set<Tag> tags = request.tags().stream()
                    .filter(t -> t != null && !t.trim().isEmpty())
                    .map(name -> getOrCreateTag(user, name.trim()))
                    .collect(Collectors.toSet());
            note.setTags(tags);
        }

        Note saved = noteRepository.save(note);
        return toNoteResponse(saved);
    }

    @Transactional
    public NoteDto.Response togglePin(UUID userId, UUID id) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Note not found: " + id));
        note.setIsPinned(!Boolean.TRUE.equals(note.getIsPinned()));
        Note saved = noteRepository.save(note);
        return toNoteResponse(saved);
    }

    @Transactional
    public void deleteNote(UUID userId, UUID id) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Note not found: " + id));
        noteRepository.delete(note);
    }

    // ================= SAVED RESOURCES =================

    @Transactional
    public List<SavedResourceDto.Response> getResources(UUID userId, String query, ResourceType resourceType) {
        seedDefaultsIfEmpty(userId);

        List<SavedResource> resources;
        if (query != null && !query.trim().isEmpty()) {
            resources = savedResourceRepository.searchResources(userId, query.trim());
        } else if (resourceType != null) {
            resources = savedResourceRepository.findAllByUserIdAndResourceTypeOrderByCreatedAtDesc(userId, resourceType);
        } else {
            resources = savedResourceRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        }
        return resources.stream().map(this::toResourceResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SavedResourceDto.Response getResourceById(UUID userId, UUID id) {
        SavedResource resource = savedResourceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
        return toResourceResponse(resource);
    }

    @Transactional
    public SavedResourceDto.Response createResource(UUID userId, SavedResourceDto.Request request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        SavedResource resource = new SavedResource(
                user,
                request.title(),
                request.url(),
                request.description(),
                request.resourceType(),
                request.learningTopicId()
        );
        SavedResource saved = savedResourceRepository.save(resource);
        return toResourceResponse(saved);
    }

    @Transactional
    public SavedResourceDto.Response updateResource(UUID userId, UUID id, SavedResourceDto.Request request) {
        SavedResource resource = savedResourceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));

        resource.setTitle(request.title());
        resource.setUrl(request.url());
        resource.setDescription(request.description());
        if (request.resourceType() != null) {
            resource.setResourceType(request.resourceType());
        }
        resource.setLearningTopicId(request.learningTopicId());

        SavedResource saved = savedResourceRepository.save(resource);
        return toResourceResponse(saved);
    }

    @Transactional
    public void deleteResource(UUID userId, UUID id) {
        SavedResource resource = savedResourceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
        savedResourceRepository.delete(resource);
    }

    // ================= TAGS =================

    @Transactional(readOnly = true)
    public List<String> getAllTags(UUID userId) {
        return tagRepository.findAllByUserIdOrderByNameAsc(userId)
                .stream()
                .map(Tag::getName)
                .collect(Collectors.toList());
    }

    private Tag getOrCreateTag(User user, String tagName) {
        String cleanName = tagName.toLowerCase().replaceAll("[^a-z0-9-_]", "-");
        return tagRepository.findByUserIdAndName(user.getId(), cleanName)
                .orElseGet(() -> tagRepository.save(new Tag(user, cleanName)));
    }

    private NoteDto.Response toNoteResponse(Note note) {
        List<String> tags = note.getTags().stream()
                .map(Tag::getName)
                .sorted()
                .collect(Collectors.toList());

        String categoryName = note.getCategory() != null ? note.getCategory().getName() : null;
        String categoryColor = note.getCategory() != null ? note.getCategory().getColor() : null;
        UUID categoryId = note.getCategory() != null ? note.getCategory().getId() : null;

        return new NoteDto.Response(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                categoryId,
                categoryName,
                categoryColor,
                note.getTaskId(),
                note.getLearningTopicId(),
                note.getGoalId(),
                Boolean.TRUE.equals(note.getIsPinned()),
                tags,
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private SavedResourceDto.Response toResourceResponse(SavedResource resource) {
        return new SavedResourceDto.Response(
                resource.getId(),
                resource.getTitle(),
                resource.getUrl(),
                resource.getDescription(),
                resource.getResourceType(),
                resource.getLearningTopicId(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}
