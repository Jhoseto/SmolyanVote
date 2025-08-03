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
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AOP Aspect за автоматично логване на потребителски активности
 * Обработва @LogActivity анотации и записва активностите в базата данни
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
     * Around advice за методи анотирани с @LogActivity
     */
    @Around("@annotation(logActivity)")
    public Object logActivityExecution(ProceedingJoinPoint joinPoint, LogActivity logActivity) throws Throwable {
        Object result = null;
        Exception thrownException = null;

        try {
            // Изпълняваме оригиналния метод
            result = joinPoint.proceed();
            return result;

        } catch (Exception e) {
            thrownException = e;
            throw e;

        } finally {
            // Записваме активността
            try {
                // Проверяваме дали да записваме при грешка
                if (thrownException != null && logActivity.onSuccessOnly()) {
                    return result; // Не записваме при неуспех
                }

                recordActivity(joinPoint, logActivity, result, thrownException);

            } catch (Exception loggingException) {
                System.err.println("❌ Error in activity logging aspect: " + loggingException.getMessage());
                // Не хвърляме грешка от logging-а, за да не съсипем основната функционалност
            }
        }
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
            ActivityActionEnum actionEnum;
            String actionString;

            if (!logActivity.actionString().isEmpty()) {
                // Legacy support за String actions
                actionString = logActivity.actionString();
                actionEnum = ActivityActionEnum.fromString(actionString);
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return; // Не логваме guest действия които не са разрешени
                }
            } else {
                // Използваме enum action
                actionEnum = logActivity.action();
                actionString = actionEnum.getActionName();
                if (currentUser == null && !isGuestAllowed(actionString)) {
                    return; // Не логваме guest действия които не са разрешени
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

            // Записваме активността
            if (actionEnum != null) {
                activityLogService.logActivity(actionEnum, currentUser, entityType, entityId,
                        details, ipAddress, userAgent);
            } else {
                // Fallback за неразпознати действия
                activityLogService.logActivity(actionString, currentUser, entityType, entityId,
                        details, ipAddress, userAgent);
            }

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

        // Търсим в параметрите
        for (String idName : commonIdNames) {
            Long foundId = findParameterValue(joinPoint, idName);
            if (foundId != null) {
                return foundId;
            }
        }

        // Търсим в резултата ако е entity с getId() метод
        if (result != null) {
            try {
                Method getIdMethod = result.getClass().getMethod("getId");
                Object idResult = getIdMethod.invoke(result);
                if (idResult instanceof Long) {
                    return (Long) idResult;
                } else if (idResult instanceof Number) {
                    return ((Number) idResult).longValue();
                }
            } catch (Exception e) {
                // Ignore, не всички класове имат getId()
            }
        }

        return null;
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
                if (parameters[i].getName().equals(parameterName)) {
                    Object value = args[i];
                    if (value instanceof Long) {
                        return (Long) value;
                    } else if (value instanceof Number) {
                        return ((Number) value).longValue();
                    } else if (value instanceof String) {
                        try {
                            return Long.parseLong((String) value);
                        } catch (NumberFormatException e) {
                            // Ignore
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error finding parameter value: " + e.getMessage());
        }
        return null;
    }

    /**
     * Генерира детайли за активността
     */
    private String generateDetails(ProceedingJoinPoint joinPoint, LogActivity logActivity,
                                   Object result, Exception exception) {

        StringBuilder details = new StringBuilder();

        // Ако има custom details template
        if (!logActivity.details().isEmpty()) {
            details.append(replacePlaceholders(logActivity.details(), joinPoint, result));
        }

        // Добавяме информация за грешка ако има
        if (exception != null) {
            if (details.length() > 0) {
                details.append(" | ");
            }
            details.append("Error: ").append(exception.getClass().getSimpleName());
            if (exception.getMessage() != null) {
                details.append(" - ").append(exception.getMessage());
            }
        }

        // Ако няма детайли, генерираме автоматично
        if (details.length() == 0) {
            details.append("Method: ").append(joinPoint.getSignature().getName());
        }

        // Ограничаваме дължината
        String finalDetails = details.toString();
        if (finalDetails.length() > 500) {
            finalDetails = finalDetails.substring(0, 497) + "...";
        }

        return finalDetails;
    }

    /**
     * Замества placeholder-и в details template
     */
    private String replacePlaceholders(String template, ProceedingJoinPoint joinPoint, Object result) {
        String processed = template;

        try {
            // Pattern за намиране на {parameterName} placeholders
            Pattern pattern = Pattern.compile("\\{(\\w+)\\}");
            Matcher matcher = pattern.matcher(template);

            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Parameter[] parameters = method.getParameters();
            Object[] args = joinPoint.getArgs();

            while (matcher.find()) {
                String placeholder = matcher.group(0); // цялата {parameterName}
                String paramName = matcher.group(1);   // само parameterName

                // Търсим в параметрите
                String replacement = placeholder; // fallback
                for (int i = 0; i < parameters.length; i++) {
                    if (parameters[i].getName().equals(paramName)) {
                        Object value = args[i];
                        replacement = value != null ? value.toString() : "null";
                        break;
                    }
                }

                // Специални placeholders
                if ("result".equals(paramName) && result != null) {
                    replacement = result.toString();
                } else if ("method".equals(paramName)) {
                    replacement = method.getName();
                } else if ("class".equals(paramName)) {
                    replacement = method.getDeclaringClass().getSimpleName();
                }

                processed = processed.replace(placeholder, replacement);
            }

        } catch (Exception e) {
            System.err.println("Error replacing placeholders: " + e.getMessage());
        }

        return processed;
    }

    /**
     * Извлича текущия автентифициран потребител
     */
    private UserEntity getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return null;
            }

            return userService.getCurrentUser();

        } catch (Exception e) {
            System.err.println("Error getting current user: " + e.getMessage());
            return null;
        }
    }

    /**
     * Извлича текущия HTTP request
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attrs.getRequest();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Извлича IP адрес от HTTP request
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        try {
            // Проверяваме за proxy headers
            String[] headerNames = {
                    "X-Forwarded-For",
                    "X-Real-IP",
                    "Proxy-Client-IP",
                    "WL-Proxy-Client-IP",
                    "HTTP_X_FORWARDED_FOR",
                    "HTTP_X_FORWARDED",
                    "HTTP_X_CLUSTER_CLIENT_IP",
                    "HTTP_CLIENT_IP",
                    "HTTP_FORWARDED_FOR",
                    "HTTP_FORWARDED"
            };

            for (String header : headerNames) {
                String ip = request.getHeader(header);
                if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                    // X-Forwarded-For може да съдържа множество IP-та
                    if (ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip;
                }
            }

            // Fallback към remote address
            return request.getRemoteAddr();

        } catch (Exception e) {
            System.err.println("Error extracting IP address: " + e.getMessage());
            return "unknown";
        }
    }

    /**
     * Извлича User Agent от HTTP request
     */
    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        try {
            String userAgent = request.getHeader("User-Agent");

            // Ограничаваме дължината
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 497) + "...";
            }

            return userAgent;
        } catch (Exception e) {
            System.err.println("Error extracting User Agent: " + e.getMessage());
            return null;
        }
    }

    /**
     * Проверява дали guest потребителите могат да извършват определено действие
     */
    private boolean isGuestAllowed(String action) {
        if (action == null) {
            return false;
        }

        String actionLower = action.toLowerCase();

        // Действия които гостите могат да правят
        return actionLower.contains("view") ||
                actionLower.contains("search") ||
                actionLower.contains("filter") ||
                actionLower.contains("api_access") ||
                actionLower.contains("visit");
    }

    /**
     * Debug helper за изписване на информация за метода
     */
    private void debugMethodInfo(ProceedingJoinPoint joinPoint, LogActivity logActivity) {
        if (System.getProperty("activity.logging.debug") != null) {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            System.out.println("🔍 Activity Logging Debug:");
            System.out.println("   Method: " + signature.getMethod().getName());
            System.out.println("   Class: " + signature.getDeclaringType().getSimpleName());
            System.out.println("   Action: " + (logActivity.actionString().isEmpty() ?
                    logActivity.action().name() : logActivity.actionString()));
            System.out.println("   Entity Type: " + logActivity.entityType());
            System.out.println("   Parameters: " + Arrays.toString(joinPoint.getArgs()));
        }
    }
}