package com.personal.productivity.tasks;

import com.personal.productivity.auth.User;
import com.personal.productivity.common.BadRequestException;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.tasks.dto.CategoryDto;
import com.personal.productivity.tasks.dto.CategoryRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;

    public CategoryService(CategoryRepository categoryRepository, TaskRepository taskRepository) {
        this.categoryRepository = categoryRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public List<CategoryDto> getCategories(User user) {
        List<Category> categories = categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(user.getId());
        if (categories.isEmpty()) {
            categories = seedDefaultCategories(user);
        }
        return categories.stream().map(CategoryDto::fromEntity).toList();
    }

    @Transactional
    public CategoryDto createCategory(User user, CategoryRequest request) {
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.name().trim())) {
            throw new BadRequestException("Category with name '" + request.name() + "' already exists");
        }

        String color = request.color() != null && !request.color().isBlank() ? request.color() : "#C6A56A";
        Category category = new Category(user, request.name().trim(), color, request.icon(), request.sortOrder());
        category = categoryRepository.save(category);
        return CategoryDto.fromEntity(category);
    }

    @Transactional
    public CategoryDto updateCategory(User user, UUID id, CategoryRequest request) {
        Category category = getCategoryEntity(user, id);
        if (!category.getName().equalsIgnoreCase(request.name().trim()) &&
                categoryRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.name().trim())) {
            throw new BadRequestException("Category with name '" + request.name() + "' already exists");
        }

        category.setName(request.name().trim());
        if (request.color() != null && !request.color().isBlank()) {
            category.setColor(request.color());
        }
        if (request.icon() != null) {
            category.setIcon(request.icon());
        }
        category.setSortOrder(request.sortOrder());

        category = categoryRepository.save(category);
        return CategoryDto.fromEntity(category);
    }

    @Transactional
    public void deleteCategory(User user, UUID id) {
        Category category = getCategoryEntity(user, id);
        // Unassign from any tasks belonging to this user
        List<Task> tasks = taskRepository.findByCategoryId(id);
        for (Task t : tasks) {
            t.setCategory(null);
        }
        taskRepository.saveAll(tasks);
        categoryRepository.delete(category);
    }

    public Category getCategoryEntity(User user, UUID id) {
        return categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private List<Category> seedDefaultCategories(User user) {
        List<Category> defaults = List.of(
            new Category(user, "Engineering", "#C6A56A", "terminal", 1),
            new Category(user, "Learning", "#78B99A", "book-open", 2),
            new Category(user, "Personal", "#6BA8C6", "user", 3),
            new Category(user, "Career", "#D8AC66", "briefcase", 4),
            new Category(user, "Projects", "#A0A6B0", "folder", 5)
        );
        return categoryRepository.saveAll(defaults);
    }
}
