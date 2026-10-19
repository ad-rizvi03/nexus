package com.personal.productivity;

import com.personal.productivity.auth.AuthService;
import com.personal.productivity.auth.User;
import com.personal.productivity.auth.UserRepository;
import com.personal.productivity.auth.dto.LoginRequest;
import com.personal.productivity.auth.dto.RegisterRequest;
import com.personal.productivity.auth.dto.UserProfileResponse;
import com.personal.productivity.common.BadRequestException;
import com.personal.productivity.common.UnauthorizedException;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private HttpServletResponse httpResponse;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, userSettingsRepository, passwordEncoder);
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("operator@local.dev", "Password123!", "Operator One");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hashed-pwd");

        User savedUser = new User(request.email(), "hashed-pwd", request.displayName());
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserSettings savedSettings = new UserSettings(savedUser);
        when(userSettingsRepository.save(any(UserSettings.class))).thenReturn(savedSettings);

        UserProfileResponse response = authService.register(request, httpRequest, httpResponse);

        assertNotNull(response);
        assertEquals("operator@local.dev", response.user().email());
        assertEquals("Operator One", response.user().displayName());
        verify(userRepository).save(any(User.class));
        verify(userSettingsRepository).save(any(UserSettings.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsBadRequest() {
        RegisterRequest request = new RegisterRequest("existing@local.dev", "Password123!", "Operator Duplicate");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request, httpRequest, httpResponse));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_InvalidPassword_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("operator@local.dev", "WrongPassword");
        User user = new User("operator@local.dev", "hashed-pwd", "Operator");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "hashed-pwd")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request, httpRequest, httpResponse));
    }

    @Test
    void login_UserNotFound_ThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("unknown@local.dev", "Password123!");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> authService.login(request, httpRequest, httpResponse));
    }
}
