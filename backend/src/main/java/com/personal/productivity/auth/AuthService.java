package com.personal.productivity.auth;

import com.personal.productivity.auth.dto.*;
import com.personal.productivity.common.BadRequestException;
import com.personal.productivity.common.ResourceNotFoundException;
import com.personal.productivity.common.UnauthorizedException;
import com.personal.productivity.settings.UserSettings;
import com.personal.productivity.settings.UserSettingsRepository;
import com.personal.productivity.settings.dto.UserSettingsDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthService(UserRepository userRepository,
                       UserSettingsRepository userSettingsRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserProfileResponse register(RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("An account with this email address already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.email().toLowerCase().trim(), hashedPassword, request.displayName().trim());
        user = userRepository.save(user);

        // Initialize default user settings
        UserSettings settings = new UserSettings(user);
        settings = userSettingsRepository.save(settings);

        // Bind authenticated session
        bindSession(user, httpRequest, httpResponse);

        return buildProfileResponse(user, settings);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Bind authenticated session
        bindSession(user, httpRequest, httpResponse);

        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> userSettingsRepository.save(new UserSettings(user)));

        return buildProfileResponse(user, settings);
    }

    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentAuthenticatedUser();
        UserSettings settings = userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> userSettingsRepository.save(new UserSettings(user)));
        return buildProfileResponse(user, settings);
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();

        // If email changed, check uniqueness
        String newEmail = request.email().toLowerCase().trim();
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("This email address is already in use");
            }
            user.setEmail(newEmail);
        }

        user.setDisplayName(request.displayName().trim());
        user = userRepository.save(user);
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getCreatedAt());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentAuthenticatedUser();

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User user = getCurrentAuthenticatedUser();
        logout(httpRequest, httpResponse);
        userRepository.delete(user);
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException("Authentication required");
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user record not found"));
    }

    private void bindSession(User user, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }

    private UserProfileResponse buildProfileResponse(User user, UserSettings settings) {
        UserResponse userResponse = new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getCreatedAt());
        UserSettingsDto settingsDto = UserSettingsDto.fromEntity(settings);
        return new UserProfileResponse(userResponse, settingsDto);
    }
}
