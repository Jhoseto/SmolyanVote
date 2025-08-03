package smolyanVote.smolyanVote.aspects;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.Optional;

/**
 * AOP Aspect за автоматично логване на потребителски активности
 * Хваща методи анотирани с @LogActivity и записва информация в activity_logs
 */
@Aspect
@Component
public class ActivityLoggingAspect {

    private final ActivityLogService activityLogService;
    private final UserService userService;

    @Autowired
    public ActivityLoggingAspect(ActivityLogService activityLogService, UserService userService) {
        this.activityLogService = activityLogService;
        this.userService = userService;
    }

    /**
     * Around advice за методи с @LogActivity анотация
     */
    @Around("@annotation(logActivity)")
    public Object logActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {

        Object result = null;
        Exception thrownException = null;

        try {
            // Изпълняваме оригиналния метод
            result = joinPoint.proceed();

        } catch (Exception e) {
            thrownException = e;

            // Ако onSuccessOnly е true, не логваме при грешка
            if (logActivity.onSuccessOnly()) {
                throw e; // Re-throw без логване
            }
        }

        try {
            // Записваме активността
            recordActivity(joinPoint, logActivity, result, thrownException);

        } catch (Exception loggingException) {
            // Логването не трябва да спира основната функционалност
            System.err.println("Failed to log activity: " + loggingException.getMessage());
        }

        // Ако имаше exception в оригиналния метод, го хвърляме
        if (thrownException != null) {
            throw thrownException;
        }

        return result;
    }

    /**
     * Записва активността в базата данни
     */
    private void recordActivity(ProceedingJoinPoint joinPoint, LogActivity logActivity,
                                Object result, Exception exception) {

        try {
            // Извличаме информация за потребителя
            UserEntity currentUser = getCurrentUser();

            // Определяме action-а - приоритет на enum над string
            String actionString;
            if (!logActivity.actionString().isEmpty()) {
                // Legacy support за String actions
                actionString = logActivity.actionString();
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return;
                }
            } else {
                // Използваме enum action
                actionString = logActivity.action().getActionName();
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return;
                }
            }

            // Извличаме HTTP информация
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = extractIpAddress(request);
            String userAgent = extractUserAgent(request);

            // Извличаме entity информация
            String entityType = logActivity.entityType().isEmpty() ? null : logActivity.entityType();
            Long entityId = extractEntityId(joinPoint, logActivity, result);

            // Генерираме детайли
            String details = generateDetails(joinPoint, logActivity, result, exception);

            // Записваме активността - използваме legacy метода за String compatibility
            activityLogService.logActivity(actionString, currentUser, entityType, entityId,
                    details, ipAddress, userAgent);

        } catch (Exception e) {
            System.err.println("Error in activity logging aspect: " + e.getMessage());
        }
    }

    /**
     * Извлича entity ID от параметрите на метода или резултата
     */
    private Long extractEntityId(ProceedingJoinPoint joinPoint, LogActivity logActivity, Object result) {

        // Ако е зададено статично ID
        if (logActivity.entityId() != -1) {
            return logActivity.entityId();
        }

        // Ако е зададен конкретен параметър
        if (!logActivity.entityIdParam().isEmpty()) {
            return findParameterValue(joinPoint, logActivity.entityIdParam());
        }

        // Автоматично търсене на ID параметри
        String[] commonIdNames = {"id", "entityId"};

        // Добавяме {entityType}Id ако е зададен entityType
        if (!logActivity.entityType().isEmpty()) {
            String entitySpecificId = logActivity.entityType().toLowerCase() + "Id";
            commonIdNames = Arrays.copyOf(commonIdNames, commonIdNames.length + 1);
            commonIdNames[commonIdNames.length - 1] = entitySpecificId;
        }

        for (String idName : commonIdNames) {
            Long id = findParameterValue(joinPoint, idName);
            if (id != null) {
                return id;
            }
        }

        // Ако не намерим в параметрите, опитваме от резултата
        return extractIdFromResult(result);
    }

    /**
     * Търси стойност на параметър по име
     */
    private Long findParameterValue(ProceedingJoinPoint joinPoint, String parameterName) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Parameter[] parameters = method.getParameters();
            Object[] args = joinPoint.getArgs();

            for (int i = 0; i < parameters.length; i++) {
                if (parameters[i].getName().equals(parameterName) && args[i] instanceof Number) {
                    return ((Number) args[i]).longValue();
                }
            }

        } catch (Exception e) {
            System.err.println("Error finding parameter value: " + e.getMessage());
        }

        return null;
    }

    /**
     * Извлича ID от резултата на метода (ако е Entity с getId())
     */
    private Long extractIdFromResult(Object result) {
        if (result == null) {
            return null;
        }

        try {
            // Опитваме да извикаме getId() метод
            Method getIdMethod = result.getClass().getMethod("getId");
            Object idValue = getIdMethod.invoke(result);

            if (idValue instanceof Number) {
                return ((Number) idValue).longValue();
            }

        } catch (Exception e) {
            // Нормално е да няма getId() метод
        }

        return null;
    }

    /**
     * Генерира детайлите за активността
     */
    private String generateDetails(ProceedingJoinPoint joinPoint, LogActivity logActivity,
                                   Object result, Exception exception) {

        String details = logActivity.details();

        if (details.isEmpty()) {
            // Генерираме основни детайли ако не са зададени
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            details = "Method: " + signature.getMethod().getName();

            if (exception != null) {
                details += ", Error: " + exception.getMessage();
            }

            return details;
        }

        // Заместваме placeholder-и в details стринга
        return replacePlaceholders(details, joinPoint, result);
    }

    /**
     * Замества placeholder-и като {param} в details стринга
     */
    private String replacePlaceholders(String template, ProceedingJoinPoint joinPoint, Object result) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Parameter[] parameters = signature.getMethod().getParameters();
            Object[] args = joinPoint.getArgs();

            String processedTemplate = template;

            // Заместваме параметрите
            for (int i = 0; i < parameters.length; i++) {
                String paramName = parameters[i].getName();
                String placeholder = "{" + paramName + "}";

                if (processedTemplate.contains(placeholder) && args[i] != null) {
                    processedTemplate = processedTemplate.replace(placeholder, args[i].toString());
                }
            }

            return processedTemplate;

        } catch (Exception e) {
            System.err.println("Error replacing placeholders: " + e.getMessage());
            return template; // Връщаме оригинала при грешка
        }
    }

    /**
     * Извлича текущия потребител
     */
    private UserEntity getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                return userService.getCurrentUser();
            }
        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
        }

        return null;
    }

    /**
     * Извлича текущия HTTP request
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            System.err.println("Error getting current request: " + e.getMessage());
            return null;
        }
    }

    /**
     * Извлича IP адреса от request-а
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        try {
            // Проверяваме различни headers за real IP (за случаи с proxy/load balancer)
            String[] headerNames = {
                    "X-Forwarded-For",
                    "X-Real-IP",
                    "X-Originating-IP",
                    "CF-Connecting-IP",
                    "Proxy-Client-IP",
                    "WL-Proxy-Client-IP"
            };

            for (String headerName : headerNames) {
                String ip = request.getHeader(headerName);
                if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                    // X-Forwarded-For може да съдържа списък с IP-та
                    if (ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip;
                }
            }

            // Fallback към стандартния метод
            return request.getRemoteAddr();

        } catch (Exception e) {
            System.err.println("Error extracting IP address: " + e.getMessage());
            return null;
        }
    }

    /**
     * Извлича User Agent от request-а
     */
    private String extractUserAgent(HttpServletRequest request) {
        try {
            return request != null ? request.getHeader("User-Agent") : null;
        } catch (Exception e) {
            System.err.println("Error extracting user agent: " + e.getMessage());
            return null;
        }
    }

    /**
     * Проверява дали действието е позволено за guest потребители
     */
    private boolean isGuestAllowed(String action) {
        // Някои действия могат да се записват дори за неаутентикирани потребители
        return action.equals("VIEW_CONTENT") ||
                action.equals("SEARCH_CONTENT") ||
                action.equals("USER_REGISTER");
    }
}