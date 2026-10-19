package com.personal.productivity.reminders;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    public record DeliveryResult(boolean success, String message, boolean simulated) {}

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public DeliveryResult sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            return new DeliveryResult(false, "Recipient email address cannot be empty.", false);
        }

        // Check if real SMTP credentials are provided
        if (mailSender != null && smtpUsername != null && !smtpUsername.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(smtpUsername);
                message.setTo(to.trim());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Email delivered via SMTP to {}", to);
                return new DeliveryResult(true, "Email delivered successfully via SMTP.", false);
            } catch (Exception e) {
                log.warn("SMTP delivery to {} failed ({}). Fallback to simulated delivery log.", to, e.getMessage());
                return new DeliveryResult(false, "SMTP delivery failed: " + e.getMessage(), false);
            }
        } else {
            // Simulated local delivery log without crashing
            log.info("[LOCAL SIMULATED NOTIFICATION] To: {} | Subject: '{}' | Content Preview: {}",
                    to, subject, body.length() > 100 ? body.substring(0, 100) + "..." : body);
            return new DeliveryResult(true, "Simulated delivery recorded in local operational logs (SMTP username not configured).", true);
        }
    }

    public DeliveryResult sendTestEmail(String toEmail) {
        String subject = "[Arclight Operations] SMTP Notification Channel Test";
        String body = """
                ARCLIGHT PERSONAL PRODUCTIVITY - NOTIFICATION CHANNEL VERIFICATION
                ------------------------------------------------------------------
                Timestamp: %s
                Recipient: %s

                This automated test message confirms that your notification configuration
                and queue dispatcher are operational.

                Operational limitation note:
                Local desktop scheduling delivers background notifications while the
                computer and application server are running.
                """.formatted(java.time.Instant.now(), toEmail);

        return sendEmail(toEmail, subject, body);
    }
}
