package com.personal.productivity.review.dto;

import java.time.LocalDate;
import java.util.List;

public record DailyReviewSubmissionDto(
    LocalDate reviewDate,
    String reflectionNotes,
    List<TaskTriageRequest> triageActions
) {}
