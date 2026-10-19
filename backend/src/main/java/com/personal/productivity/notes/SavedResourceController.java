package com.personal.productivity.notes;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.notes.dto.SavedResourceDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/resources")
public class SavedResourceController {

    private final NoteService noteService;
    private final AuthService authService;

    public SavedResourceController(NoteService noteService, AuthService authService) {
        this.noteService = noteService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<SavedResourceDto.Response>> getResources(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ResourceType type) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.getResources(user.getId(), query, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavedResourceDto.Response> getResourceById(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.getResourceById(user.getId(), id));
    }

    @PostMapping
    public ResponseEntity<SavedResourceDto.Response> createResource(@Valid @RequestBody SavedResourceDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createResource(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedResourceDto.Response> updateResource(
            @PathVariable UUID id,
            @Valid @RequestBody SavedResourceDto.Request request) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(noteService.updateResource(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        User user = authService.getCurrentAuthenticatedUser();
        noteService.deleteResource(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
