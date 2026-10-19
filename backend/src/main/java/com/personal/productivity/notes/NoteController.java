package com.personal.productivity.notes;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.notes.dto.NoteDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteService noteService;
    private final AuthService authService;

    public NoteController(NoteService noteService, AuthService authService) {
        this.noteService = noteService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<NoteDto.Response>> getNotes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID categoryId) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.getNotes(user.getId(), query, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteDto.Response> getNoteById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.getNoteById(user.getId(), id));
    }

    @PostMapping
    public ResponseEntity<NoteDto.Response> createNote(@Valid @RequestBody NoteDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDto.Response> updateNote(@PathVariable UUID id, @Valid @RequestBody NoteDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.updateNote(user.getId(), id, request));
    }

    @PatchMapping("/{id}/pin")
    public ResponseEntity<NoteDto.Response> togglePin(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.togglePin(user.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        noteService.deleteNote(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getTags() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.getAllTags(user.getId()));
    }
}
