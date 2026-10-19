package com.personal.productivity;

import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.notes.*;
import com.personal.productivity.notes.dto.NoteDto;
import com.personal.productivity.notes.dto.SavedResourceDto;
import com.personal.productivity.tasks.Category;
import com.personal.productivity.tasks.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private SavedResourceRepository savedResourceRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NoteService noteService;

    private User testUser;
    private Category testCategory;
    private Note testNote;
    private SavedResource testResource;

    @BeforeEach
    void setUp() {
        testUser = new User("adnan@example.com", "hashed_pwd", "Adnan");
        testUser.setId(UUID.randomUUID());

        testCategory = new Category(testUser, "Engineering", "#C6A56A", "terminal", 1);
        testCategory.setId(UUID.randomUUID());

        testNote = new Note(testUser, "Raft Protocol", "Log replication details", testCategory, false);
        testNote.setId(UUID.randomUUID());

        testResource = new SavedResource(
                testUser,
                "Designing Data-Intensive Applications",
                "https://dataintensive.net",
                "Key takeaways",
                ResourceType.BOOK,
                null
        );
        testResource.setId(UUID.randomUUID());
    }

    @Test
    void testGetNotesWithSearchQuery() {
        when(noteRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(savedResourceRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(noteRepository.searchNotes(eq(testUser.getId()), eq("raft")))
                .thenReturn(List.of(testNote));

        List<NoteDto.Response> results = noteService.getNotes(testUser.getId(), "raft", null);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Raft Protocol", results.get(0).title());
        assertEquals("Engineering", results.get(0).categoryName());
        verify(noteRepository).searchNotes(testUser.getId(), "raft");
    }

    @Test
    void testCreateNoteWithTags() {
        NoteDto.Request request = new NoteDto.Request(
                "PostgreSQL Indexing",
                "B-tree index deep dive",
                testCategory.getId(),
                null,
                null,
                null,
                true,
                List.of("database", "postgres")
        );

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findByIdAndUserId(testCategory.getId(), testUser.getId()))
                .thenReturn(Optional.of(testCategory));

        Tag dbTag = new Tag(testUser, "database");
        dbTag.setId(UUID.randomUUID());
        Tag pgTag = new Tag(testUser, "postgres");
        pgTag.setId(UUID.randomUUID());

        when(tagRepository.findByUserIdAndName(testUser.getId(), "database")).thenReturn(Optional.of(dbTag));
        when(tagRepository.findByUserIdAndName(testUser.getId(), "postgres")).thenReturn(Optional.of(pgTag));

        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> {
            Note n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        NoteDto.Response created = noteService.createNote(testUser.getId(), request);

        assertNotNull(created);
        assertEquals("PostgreSQL Indexing", created.title());
        assertTrue(created.isPinned());
        assertEquals(2, created.tags().size());
        verify(noteRepository).save(any(Note.class));
    }

    @Test
    void testTogglePin() {
        when(noteRepository.findByIdAndUserId(testNote.getId(), testUser.getId()))
                .thenReturn(Optional.of(testNote));
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        assertFalse(testNote.getIsPinned());

        NoteDto.Response pinnedResponse = noteService.togglePin(testUser.getId(), testNote.getId());
        assertTrue(pinnedResponse.isPinned());

        NoteDto.Response unpinnedResponse = noteService.togglePin(testUser.getId(), testNote.getId());
        assertFalse(unpinnedResponse.isPinned());
    }

    @Test
    void testSavedResourceLifecycle() {
        SavedResourceDto.Request request = new SavedResourceDto.Request(
                "Spring Boot Docs",
                "https://spring.io",
                "Official framework documentation",
                ResourceType.ARTICLE,
                null
        );

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(savedResourceRepository.save(any(SavedResource.class))).thenAnswer(inv -> {
            SavedResource r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        SavedResourceDto.Response created = noteService.createResource(testUser.getId(), request);
        assertNotNull(created);
        assertEquals("Spring Boot Docs", created.title());
        assertEquals(ResourceType.ARTICLE, created.resourceType());

        when(savedResourceRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(noteRepository.existsByUserId(testUser.getId())).thenReturn(true);
        when(savedResourceRepository.findAllByUserIdOrderByCreatedAtDesc(testUser.getId()))
                .thenReturn(List.of(testResource));

        List<SavedResourceDto.Response> list = noteService.getResources(testUser.getId(), null, null);
        assertEquals(1, list.size());
        assertEquals("Designing Data-Intensive Applications", list.get(0).title());
    }
}
