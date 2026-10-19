package com.personal.productivity.tasks;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.tasks.dto.CategoryDto;
import com.personal.productivity.tasks.dto.CategoryRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final AuthService authService;

    public CategoryController(CategoryService categoryService, AuthService authService) {
        this.categoryService = categoryService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getCategories() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(categoryService.getCategories(user));
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        return new ResponseEntity<>(categoryService.createCategory(user, request), HttpStatus.CREATED);
    }
}
